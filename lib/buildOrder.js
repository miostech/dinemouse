const {
    EXTRAS,
    CONCIERGE_PRICES,
    SUBSCRIPTION_TIERS,
    priceByDaysAhead,
    daysAhead,
    toCents,
} = require('./pricing');

/**
 * Constrói o pedido (line items da Stripe + userData p/ fulfillment) a partir do
 * carrinho enviado pelo frontend. TODO preço é recalculado aqui no servidor.
 *
 * @returns {{ mode:'payment'|'subscription', currency:'brl', lineItems:Array, amountTotalCents:number, userData:object }}
 */
function buildOrder(cart) {
    const planType = cart && cart.planType;
    const customer = (cart && cart.customer) || {};
    const phones = normalizePhones(customer.phones);

    if (planType === 'alerts') return buildAlerts(cart, phones);
    if (planType === 'subscription') return buildSubscription(cart, phones);
    if (planType === 'concierge') return buildConcierge(cart, phones);
    throw new Error('planType inválido');
}

function normalizePhones(phones) {
    if (!Array.isArray(phones)) return [];
    return phones
        .map((p) => (p && typeof p === 'object' ? p.full || p.number || '' : String(p || '')))
        .map((s) => s.trim())
        .filter(Boolean);
}

// Código fiscal Stripe "General - Services" (exigido pelo Managed Payments).
const TAX_CODE = 'txcd_10000000';

function line(name, amountReais, qty = 1) {
    return {
        price_data: {
            currency: 'brl',
            product_data: { name, tax_code: TAX_CODE },
            unit_amount: toCents(amountReais),
        },
        quantity: qty,
    };
}

// ---- Alertas avulsos (pagamento único, valor dinâmico por data) ----
function buildAlerts(cart, phones) {
    const park = cart.themePark || '';
    const restaurant = cart.selectedRestaurant || '';
    const dates = Array.isArray(cart.dates) ? cart.dates : [];
    if (!restaurant || dates.length === 0) throw new Error('alerta sem restaurante/data');

    const lineItems = [];
    const alerts = [];
    let total = 0;

    dates.forEach((d, i) => {
        const price = priceByDaysAhead(daysAhead(d.dateString));
        total += price;
        lineItems.push(line(`Alerta: ${restaurant} — ${d.dateString}`, price));
        alerts.push({
            id: i + 1,
            restaurant,
            park,
            date: d.dateString,
            meal: d.meal || 'Jantar',
            partySize: Number(d.partySize) || 2,
            status: 'active',
            activeDays: Number(d.activeDays) || 12,
            createdAt: new Date().toISOString(),
        });
    });

    // Extras
    const extras = cart.extras || {};
    if (extras.whatsapp) {
        total += EXTRAS.whatsapp;
        lineItems.push(line('Extra: Notificação WhatsApp', EXTRAS.whatsapp));
    }
    const addPhones = Number(extras.additionalPhone) || 0;
    if (addPhones > 0) {
        total += EXTRAS.additionalPhone * addPhones;
        lineItems.push(line('Extra: Telefone adicional', EXTRAS.additionalPhone, addPhones));
    }

    const userData = {
        name: cart.customer?.name || '',
        phones,
        plan: {
            type: 'alerts',
            name: 'Plano Individual — Alertas',
            price: total,
            alerts: alerts.length, // nº de alertas comprados
            billing: 'once', // pagamento único (não mensal)
        },
        alerts,
    };

    return { mode: 'payment', currency: 'brl', lineItems, amountTotalCents: toCents(total), userData };
}

// ---- Assinatura mensal (Billing) ----
function buildSubscription(cart, phones) {
    const tierKey = String((cart.subscription && cart.subscription.tier) || 'mensal');
    const tier = SUBSCRIPTION_TIERS[tierKey] || SUBSCRIPTION_TIERS.mensal;

    const lineItems = [
        {
            price_data: {
                currency: 'brl',
                product_data: { name: tier.label, tax_code: TAX_CODE },
                unit_amount: toCents(tier.amount),
                recurring: { interval: 'month' },
            },
            quantity: 1,
        },
    ];

    // Assinante configura os alertas no portal depois; não criamos alertas aqui
    // (alerts: []). Mas plan.alerts guarda a COTA do plano, para o portal exibir.
    const userData = {
        name: cart.customer?.name || '',
        phones,
        // Campo DEDICADO da assinatura (separado dos alertas avulsos).
        subscription: { active: true, name: tier.label, price: tier.amount, alerts: tier.alerts, billing: 'monthly' },
        plan: { type: 'alerts', name: tier.label, price: tier.amount, alerts: tier.alerts, billing: 'monthly' },
        alerts: [],
    };

    return {
        mode: 'subscription',
        currency: 'brl',
        lineItems,
        amountTotalCents: toCents(tier.amount),
        userData,
    };
}

// ---- Concierge (pagamento único, execução manual da equipe) ----
function buildConcierge(cart, phones) {
    const planKey = cart.concierge && cart.concierge.plan;
    const price = CONCIERGE_PRICES[planKey];
    if (!price) throw new Error('plano concierge inválido');

    const names = { essencial: 'Concierge Essencial', completo: 'Concierge Completo', premium: 'Concierge Premium' };
    const lineItems = [line(names[planKey], price)];

    const c = cart.concierge || {};
    const userData = {
        name: cart.customer?.name || c.contactName || '',
        phones,
        plan: { type: 'concierge', name: names[planKey], price },
        alerts: [], // concierge é executado pela equipe, não pelo worker
        conciergeInfo: {
            tripDateStart: c.tripDateStart || '',
            tripDateEnd: c.tripDateEnd || '',
            partySize: Number(c.partySize) || 2,
            contactName: c.contactName || '',
            phone: c.phone || '',
        },
    };

    return { mode: 'payment', currency: 'brl', lineItems, amountTotalCents: toCents(price), userData };
}

module.exports = { buildOrder };
