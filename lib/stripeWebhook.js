const bcrypt = require('bcryptjs');
const { getStripe } = require('./stripe');
const { connectMongo } = require('./mongo');
const PortalUser = require('./PortalUser');
const PendingOrder = require('./PendingOrder');
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
        const plan = { ...(prev.plan || {}), ...(orderData.plan || {}) };
        if (plan.type === 'alerts') plan.alerts = allAlerts.length;

        existing.portalPayload = {
            ...prev,
            ...orderData,
            name: orderData.name || prev.name || '',
            phones: orderData.phones && orderData.phones.length ? orderData.phones : prev.phones || [],
            plan,
            alerts: allAlerts,
            isFirstAccess: false,
            activationDate: prev.activationDate || new Date().toISOString(),
        };
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
        if (event.type === 'checkout.session.completed') {
            await fulfill(event.data.object);
        }
        // Futuro: invoice.paid (renovação), customer.subscription.deleted (cancelamento).
        return res.status(200).json({ received: true });
    } catch (err) {
        console.error('[webhook] fulfillment falhou:', err);
        return res.status(500).json({ error: 'fulfill_failed' });
    }
}

module.exports = { stripeWebhook, fulfill };
