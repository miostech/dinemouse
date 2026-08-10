const { stripeWebhook } = require('../../lib/stripeWebhook');

// A Stripe exige o corpo CRU p/ verificar a assinatura — desliga o parser da Vercel.
module.exports = async (req, res) => {
    if (req.method !== 'POST') return res.status(405).end();
    return stripeWebhook(req, res);
};

module.exports.config = { api: { bodyParser: false } };
