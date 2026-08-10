const { getStripe } = require('./stripe');
const { connectMongo } = require('./mongo');
const PendingOrder = require('./PendingOrder');
const { buildOrder } = require('./buildOrder');

/**
 * Cria uma sessão de Stripe Checkout a partir do carrinho.
 * Guarda um PendingOrder e passa o id na metadata p/ o webhook fazer o fulfillment.
 */
async function createCheckout(req, res) {
    const cart = req.body && typeof req.body === 'object' ? req.body : {};
    // E-mail é OPCIONAL: se não vier (ex.: concierge), o Stripe Checkout coleta
    // e o webhook usa o e-mail da sessão para o fulfillment.
    const email = String((cart.customer && cart.customer.email) || '').trim().toLowerCase();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ ok: false, error: 'invalid_email' });
    }

    let order;
    try {
        order = buildOrder(cart);
    } catch (err) {
        return res.status(400).json({ ok: false, error: 'invalid_cart', detail: err.message });
    }

    try {
        await connectMongo();
        const stripe = getStripe();

        const pending = await PendingOrder.create({
            email: email || '',
            planType: cart.planType,
            userData: order.userData,
            amountTotalCents: order.amountTotalCents,
            currency: order.currency,
            status: 'pending',
        });

        // Reusa (ou cria) UM customer por e-mail: histórico limpo + o Billing
        // Portal encontra a assinatura. Sem e-mail (concierge), o Stripe coleta.
        let customerId = null;
        if (email) {
            const found = await stripe.customers.list({ email, limit: 1 });
            customerId = found.data[0]
                ? found.data[0].id
                : (await stripe.customers.create({ email, name: (cart.customer && cart.customer.name) || undefined })).id;
        }

        const base = (process.env.APP_PUBLIC_URL || 'https://www.dinemouse.com').replace(/\/$/, '');
        const session = await stripe.checkout.sessions.create({
            mode: order.mode,
            line_items: order.lineItems,
            ...(customerId ? { customer: customerId } : email ? { customer_email: email } : {}),
            client_reference_id: String(pending._id),
            metadata: { pendingOrderId: String(pending._id), planType: cart.planType },
            // Em assinatura, a metadata do pedido também vai na subscription.
            ...(order.mode === 'subscription'
                ? { subscription_data: { metadata: { pendingOrderId: String(pending._id) } } }
                : {}),
            success_url: `${base}/portal?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${base}/?checkout=cancel`,
        });

        pending.stripeSessionId = session.id;
        await pending.save();

        return res.status(200).json({ ok: true, url: session.url, id: session.id });
    } catch (err) {
        console.error('create-checkout:', err);
        return res.status(500).json({ ok: false, error: 'server_error' });
    }
}

module.exports = { createCheckout };
