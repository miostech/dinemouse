/**
 * Cliente Stripe. Requer STRIPE_SECRET_KEY no ambiente (use sk_test_... em teste).
 */
const Stripe = require('stripe');

let client = null;

function getStripe() {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY não definido');
    if (!client) {
        // Versão de API >= 2025-03-31.basil (exigida pelo Managed Payments da conta).
        client = new Stripe(key, { apiVersion: '2025-03-31.basil' });
    }
    return client;
}

module.exports = { getStripe };
