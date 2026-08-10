/**
 * Preços AUTORITATIVOS calculados no servidor (nunca confiar no valor do cliente).
 * Valores em reais; Stripe usa centavos (toCents).
 */

const EXTRAS = {
    whatsapp: 8, // R$ 8 (notificação WhatsApp)
    additionalPhone: 5, // R$ 5 por telefone adicional
};

const CONCIERGE_PRICES = {
    essencial: 599,
    completo: 949,
    premium: 1499,
};

// Assinatura mensal (BRL/mês). Um tier por enquanto; fácil adicionar mais.
const SUBSCRIPTION_TIERS = {
    mensal: { amount: 49.9, label: 'Assinatura Mensal — Alertas' },
};

/** Preço de 1 alerta avulso conforme a antecedência (dias até a data). */
function priceByDaysAhead(daysAhead) {
    if (daysAhead <= 30) return 15;
    if (daysAhead <= 45) return 20;
    return 30;
}

/** Dias entre hoje (UTC) e uma data 'YYYY-MM-DD'. */
function daysAhead(dateString, now = new Date()) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dateString || ''))) return 0;
    const target = new Date(`${dateString}T00:00:00Z`);
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    return Math.max(0, Math.ceil((target - today) / (24 * 60 * 60 * 1000)));
}

/** Reais -> centavos (inteiro), à prova de float. */
function toCents(reais) {
    return Math.round(Number(reais) * 100);
}

module.exports = {
    EXTRAS,
    CONCIERGE_PRICES,
    SUBSCRIPTION_TIERS,
    priceByDaysAhead,
    daysAhead,
    toCents,
};
