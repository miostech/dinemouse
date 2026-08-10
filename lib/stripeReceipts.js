const bcrypt = require('bcryptjs');
const { getStripe } = require('./stripe');
const { connectMongo } = require('./mongo');
const PortalUser = require('./PortalUser');

/**
 * Lista os recibos/faturas do cliente vindos do Stripe.
 * - Assinaturas: invoices (com hosted_invoice_url / PDF).
 * - Pagamentos únicos: charges (receipt_url do Stripe).
 * Exige email + senha (mesma auth do portal) para não vazar por e-mail.
 */
async function listReceipts(req, res) {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const email = String(body.email || '').trim().toLowerCase();
    const password = body.password;
    if (!email || !password) return res.status(400).json({ ok: false, error: 'missing_fields' });

    try {
        await connectMongo();
        const user = await PortalUser.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
            return res.status(401).json({ ok: false, error: 'invalid_credentials' });
        }

        const stripe = getStripe();
        // Um mesmo e-mail pode ter mais de um customer (checkout cria um por vez).
        const customers = await stripe.customers.list({ email, limit: 10 });
        const receipts = [];
        // Dedup: a conta (Managed Payments) gera invoice E charge para o mesmo
        // pagamento, sem campo que os ligue — mas amount+created são idênticos.
        const seen = new Set();
        const key = (amount, created) => `${amount}_${created}`;

        for (const customer of customers.data) {
            const [invoices, charges] = await Promise.all([
                stripe.invoices.list({ customer: customer.id, limit: 24 }),
                stripe.charges.list({ customer: customer.id, limit: 24 }),
            ]);

            // Invoices primeiro (têm PDF / hosted_invoice_url).
            for (const inv of invoices.data) {
                if (inv.status !== 'paid' && !(inv.amount_paid > 0)) continue;
                const amount = inv.amount_paid || inv.total || 0;
                seen.add(key(amount, inv.created));
                receipts.push({
                    date: inv.created,
                    amount,
                    currency: inv.currency,
                    description:
                        (inv.lines && inv.lines.data && inv.lines.data[0] && inv.lines.data[0].description) ||
                        (inv.number ? `Fatura ${inv.number}` : 'Fatura'),
                    url: inv.hosted_invoice_url || inv.invoice_pdf || null,
                    pdf: inv.invoice_pdf || null,
                });
            }

            // Charges só se ainda não representados por uma invoice.
            for (const ch of charges.data) {
                if (ch.status !== 'succeeded') continue;
                if (ch.invoice) continue;
                if (seen.has(key(ch.amount, ch.created))) continue;
                seen.add(key(ch.amount, ch.created));
                receipts.push({
                    date: ch.created,
                    amount: ch.amount,
                    currency: ch.currency,
                    description: ch.description || 'Pagamento avulso',
                    url: ch.receipt_url || null,
                    pdf: null,
                });
            }
        }

        receipts.sort((a, b) => b.date - a.date);
        return res.status(200).json({ ok: true, receipts });
    } catch (err) {
        console.error('stripe-receipts:', err);
        return res.status(500).json({ ok: false, error: 'server_error' });
    }
}

module.exports = { listReceipts };
