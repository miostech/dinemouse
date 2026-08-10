const bcrypt = require('bcryptjs');
const { getStripe } = require('./stripe');
const { connectMongo } = require('./mongo');
const PortalUser = require('./PortalUser');
const PendingOrder = require('./PendingOrder');
const Alert = require('./Alert');
const { syncAlertsFromUser } = require('./syncAlertsFromUser');
const { sendPurchaseEmail } = require('./resendMail');

/** Lê o corpo cru (Buffer) — necessário p/ verificar a assinatura da Stripe. */
async function getRawBody(req) {
    if (Buffer.isBuffer(req.body)) return req.body;
    if (typeof req.body === 'string') return Buffer.from(req.body);
    const chunks = [];
    for await (const chunk of req) chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    return Buffer.concat(chunks);
}

function generatePassword(len = 12) {
    const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let out = '';
    const bytes = require('crypto').randomBytes(len);
    for (let i = 0; i < len; i++) out += chars[bytes[i] % chars.length];
    return out;
}

/** Cria/atualiza o usuário e materializa os alertas comprados. Idempotente. */
async function fulfill(session) {
    const pendingId = session.metadata && session.metadata.pendingOrderId;
    if (!pendingId) {
        console.warn('[webhook] sessão sem pendingOrderId');
        return;
    }

    await connectMongo();
    const pending = await PendingOrder.findById(pendingId);
    if (!pending) {
        console.warn('[webhook] PendingOrder não encontrado:', pendingId);
        return;
    }
    if (pending.status === 'fulfilled') return; // já processado

    // E-mail: o do pedido, ou o que o cliente informou no próprio Checkout.
    const sessionEmail = (session.customer_details && session.customer_details.email) || session.customer_email || '';
    const email = String(pending.email || sessionEmail || '').toLowerCase().trim();
    if (!email) {
        console.warn('[webhook] pedido sem e-mail — impossível criar conta:', pendingId);
        return;
    }
    if (!pending.email) pending.email = email;
    const orderData = pending.userData || {};
    const existing = await PortalUser.findOne({ email });

    let tempPassword = null;

    if (!existing) {
        // Cliente novo: cria com senha temporária e envia credenciais.
        tempPassword = generatePassword();
        const passwordHash = await bcrypt.hash(tempPassword, 10);
        // Serviço já ativo na compra (Stripe confirmou o pagamento) — sem passo de ativação.
        const portalPayload = { ...orderData, isFirstAccess: false, activationDate: new Date().toISOString() };
        const user = await PortalUser.create({ email, passwordHash, portalPayload });
        await syncAlertsFromUser({ email, portalPayload, userId: user._id });
    } else {
        // Cliente existente: mescla os novos alertas, mantém a senha atual.
        const prev = existing.portalPayload && typeof existing.portalPayload === 'object' ? existing.portalPayload : {};
        const prevAlerts = Array.isArray(prev.alerts) ? prev.alerts : [];
        // IDs ÚNICOS: continua a numeração a partir do maior id existente (senão
        // dois alertas ficam com id=1 e colidem no portal).
        const maxId = prevAlerts.reduce((m, a) => Math.max(m, Number(a.id) || 0), 0);
        const newAlerts = (orderData.alerts || []).map((a, i) => ({ ...a, id: maxId + i + 1 }));
        const allAlerts = [...prevAlerts, ...newAlerts];
        const nowIso = new Date().toISOString();

        // ASSINATURA em campo dedicado: só a compra de assinatura define/atualiza;
        // compra de alerta avulso NÃO mexe na assinatura (e vice-versa).
        const subscription = orderData.subscription
            ? { ...orderData.subscription, active: true, since: (prev.subscription && prev.subscription.since) || nowIso }
            : prev.subscription;

        // Plano (lado alertas/concierge): a assinatura NÃO sobrescreve o plano de
        // alertas avulsos; a compra avulsa atualiza normalmente.
        const plan = orderData.subscription
            ? prev.plan || orderData.plan
            : { ...(prev.plan || {}), ...(orderData.plan || {}) };
        if (plan && plan.type === 'alerts') plan.alerts = allAlerts.length;

        const merged = {
            ...prev,
            ...orderData,
            name: orderData.name || prev.name || '',
            phones: orderData.phones && orderData.phones.length ? orderData.phones : prev.phones || [],
            plan,
            alerts: allAlerts,
            isFirstAccess: false,
            activationDate: prev.activationDate || nowIso,
        };
        if (subscription) merged.subscription = subscription;
        else delete merged.subscription;

        existing.portalPayload = merged;
        existing.markModified('portalPayload'); // Mixed: garante persistência
        await existing.save();
        await syncAlertsFromUser({ email, portalPayload: orderData, userId: existing._id });
    }

    // E-mail de confirmação em TODA compra (com credenciais se cliente novo).
    await sendPurchaseEmail({
        to: email,
        name: orderData.name,
        planName: orderData.plan && orderData.plan.name,
        alerts: orderData.alerts,
        tempPassword,
    }).catch((e) => console.error('[webhook] falha e-mail de compra:', e.message));

    pending.status = 'fulfilled';
    pending.fulfilledAt = new Date();
    await pending.save();
    console.log(`[webhook] pedido concluído p/ ${email} (${existing ? 'existente' : 'novo'})`);
}

/** Resolve o e-mail do cliente a partir do que o evento da Stripe traz. */
async function resolveEmail(stripe, { customerEmail, customerId, pendingOrderId }) {
    let email = String(customerEmail || '').toLowerCase().trim();
    if (!email && pendingOrderId) {
        const po = await PendingOrder.findById(pendingOrderId).lean().catch(() => null);
        if (po && po.email) email = String(po.email).toLowerCase().trim();
    }
    if (!email && customerId) {
        try {
            const c = await stripe.customers.retrieve(customerId);
            if (c && !c.deleted && c.email) email = String(c.email).toLowerCase().trim();
        } catch {
            /* customer pode ter sido removido */
        }
    }
    return email;
}

/**
 * Renovação (ou 1º pagamento) de assinatura: mantém a assinatura ATIVA e
 * registra o último pagamento. Não cria conta (isso é do checkout.session.completed).
 */
async function handleInvoicePaid(invoice) {
    // Só nos interessa fatura de assinatura.
    const subId = invoice && (invoice.subscription ||
        (invoice.parent && invoice.parent.subscription_details && invoice.parent.subscription_details.subscription));
    const isSub = !!subId || /subscription/.test((invoice && invoice.billing_reason) || '');
    if (!isSub) return;

    await connectMongo();
    const stripe = getStripe();
    const email = await resolveEmail(stripe, {
        customerEmail: invoice.customer_email,
        customerId: invoice.customer,
        pendingOrderId: null,
    });
    if (!email) {
        console.warn('[webhook] invoice.paid sem e-mail resolvível');
        return;
    }
    const user = await PortalUser.findOne({ email });
    if (!user) {
        // O 1º pagamento pode chegar antes de o checkout.session.completed criar a conta.
        console.log('[webhook] invoice.paid: conta ainda não existe p/', email, '(o checkout cria)');
        return;
    }
    const pp = user.portalPayload && typeof user.portalPayload === 'object' ? user.portalPayload : {};
    const sub = pp.subscription && typeof pp.subscription === 'object' ? pp.subscription : {};
    pp.subscription = {
        ...sub,
        active: true,
        lastPaymentAt: new Date().toISOString(),
        ...(subId ? { stripeSubscriptionId: subId } : {}),
    };
    user.portalPayload = pp;
    user.markModified('portalPayload');
    await user.save();
    console.log('[webhook] assinatura renovada/ativa p/', email);
}

/**
 * Cancelamento de assinatura: desativa a assinatura no portal e PARA os alertas
 * no worker (para o assinante deixar de ser monitorado ao fim do período pago).
 */
async function handleSubscriptionDeleted(subscription) {
    await connectMongo();
    const stripe = getStripe();
    const email = await resolveEmail(stripe, {
        customerEmail: null,
        customerId: subscription.customer,
        pendingOrderId: subscription.metadata && subscription.metadata.pendingOrderId,
    });
    if (!email) {
        console.warn('[webhook] subscription.deleted sem e-mail resolvível');
        return;
    }

    const user = await PortalUser.findOne({ email });
    if (user) {
        const pp = user.portalPayload && typeof user.portalPayload === 'object' ? user.portalPayload : {};
        const sub = pp.subscription && typeof pp.subscription === 'object' ? pp.subscription : {};
        pp.subscription = { ...sub, active: false, canceledAt: new Date().toISOString() };
        // Reflete no portal: alertas ativos viram 'cancelled'.
        if (Array.isArray(pp.alerts)) {
            pp.alerts = pp.alerts.map((a) => (a && a.status === 'active' ? { ...a, status: 'cancelled' } : a));
        }
        user.portalPayload = pp;
        user.markModified('portalPayload');
        await user.save();
    }

    // Para o worker: cancela os alertas ativos desse e-mail (deixa de monitorar).
    const r = await Alert.updateMany({ userEmail: email, status: 'active' }, { $set: { status: 'cancelled' } });
    console.log(`[webhook] assinatura cancelada p/ ${email}; alertas parados: ${r.modifiedCount}`);
}

/** Handler do webhook (Express com express.raw, ou Vercel com bodyParser off). */
async function stripeWebhook(req, res) {
    const stripe = getStripe();
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    const sig = req.headers['stripe-signature'];

    let event;
    try {
        const raw = await getRawBody(req);
        event = stripe.webhooks.constructEvent(raw, sig, secret);
    } catch (err) {
        console.error('[webhook] assinatura inválida:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed':
                await fulfill(event.data.object);
                break;
            case 'invoice.paid': // renovação mensal (e 1º pagamento) da assinatura
                await handleInvoicePaid(event.data.object);
                break;
            case 'customer.subscription.deleted': // cancelamento da assinatura
                await handleSubscriptionDeleted(event.data.object);
                break;
            default:
                break; // outros eventos: apenas confirmamos o recebimento
        }
        return res.status(200).json({ received: true });
    } catch (err) {
        console.error('[webhook] processamento falhou:', err);
        return res.status(500).json({ error: 'handler_failed' });
    }
}

module.exports = { stripeWebhook, fulfill, handleInvoicePaid, handleSubscriptionDeleted };
