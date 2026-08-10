const { getStripe } = require('./stripe');

/**
 * Cria uma sessão do Billing Customer Portal (cliente gerencia/cancela assinatura).
 * Requer o portal ativado em Settings → Billing → Customer portal no dashboard.
 */
async function createPortalSession(req, res) {
    const email = String((req.body && req.body.email) || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ ok: false, error: 'missing_email' });

    try {
        const stripe = getStripe();
        const base = (process.env.APP_PUBLIC_URL || 'https://www.dinemouse.com').replace(/\/$/, '');
        const list = await stripe.customers.list({ email, limit: 1 });
        const customer = list.data[0];
        if (!customer) return res.status(404).json({ ok: false, error: 'no_customer' });

        const session = await stripe.billingPortal.sessions.create({
            customer: customer.id,
            return_url: `${base}/portal`,
        });
        return res.status(200).json({ ok: true, url: session.url });
    } catch (err) {
        console.error('stripe-portal:', err);
        return res.status(500).json({ ok: false, error: 'server_error' });
    }
}

module.exports = { createPortalSession };
