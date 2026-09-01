const crypto = require('crypto');
const { connectMongo } = require('./mongo');
const PortalUser = require('./PortalUser');
const PendingOrder = require('./PendingOrder');
const NotificationLog = require('./NotificationLog');
const ContactLead = require('./ContactLead');
const B2BLead = require('./B2BLead');

/** Compara a senha informada com ADMIN_PASSWORD em tempo ~constante. */
function checkPassword(provided) {
    const expected = process.env.ADMIN_PASSWORD || '';
    if (!expected) return false; // não configurado => acesso negado
    const a = Buffer.from(String(provided || ''));
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
}

function tsFromId(id) {
    try { return id.getTimestamp().toISOString(); } catch { return null; }
}

/**
 * Painel de admin: retorna o que os clientes contrataram + o log de envios.
 * Protegido por senha (ADMIN_PASSWORD). POST { password }.
 */
async function adminData(req, res) {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    if (!process.env.ADMIN_PASSWORD) {
        return res.status(500).json({ ok: false, error: 'admin_not_configured' });
    }
    if (!checkPassword(body.password)) {
        return res.status(401).json({ ok: false, error: 'unauthorized' });
    }

    try {
        await connectMongo();
        const limit = Math.min(Number(body.limit) || 500, 2000);

        // --- Clientes (o que contrataram) ---
        const users = await PortalUser.find({}).sort({ _id: -1 }).limit(1000).lean();
        const customers = users.map((u) => {
            const p = (u.portalPayload && typeof u.portalPayload === 'object' && u.portalPayload) || {};
            const plan = p.plan || {};
            const sub = p.subscription || null;
            const alerts = Array.isArray(p.alerts) ? p.alerts : [];
            return {
                email: u.email,
                name: p.name || '',
                lang: p.lang || 'pt',
                phones: Array.isArray(p.phones) ? p.phones : [],
                planName: plan.name || '',
                planType: plan.type || '',
                billing: plan.billing || '',
                planPrice: plan.price != null ? plan.price : null,
                subscriptionActive: sub ? sub.active !== false : false,
                subscriptionName: sub ? sub.name || '' : '',
                alertsTotal: alerts.length,
                alertsActive: alerts.filter((a) => a && a.status === 'active').length,
                createdAt: tsFromId(u._id),
            };
        });

        // --- Contratos / compras (pedidos concluídos) ---
        const orders = await PendingOrder.find({ status: 'fulfilled' })
            .sort({ _id: -1 })
            .limit(limit)
            .lean();
        const purchases = orders.map((o) => {
            const ud = o.userData || {};
            // Concierge: expõe os detalhes da viagem para a equipe executar.
            const ci = o.planType === 'concierge' && ud.conciergeInfo && typeof ud.conciergeInfo === 'object'
                ? {
                      tripDateStart: ud.conciergeInfo.tripDateStart || '',
                      tripDateEnd: ud.conciergeInfo.tripDateEnd || '',
                      partySize: ud.conciergeInfo.partySize || null,
                      contactName: ud.conciergeInfo.contactName || ud.name || '',
                      phone: ud.conciergeInfo.phone || (Array.isArray(ud.phones) && ud.phones[0]
                          ? (typeof ud.phones[0] === 'object' ? ud.phones[0].full || '' : ud.phones[0]) : ''),
                  }
                : null;
            return {
                email: o.email || '',
                planType: o.planType || '',
                planName: (ud.plan && ud.plan.name) || '',
                amount: o.amountTotalCents != null ? o.amountTotalCents / 100 : null,
                currency: (o.currency || 'brl').toUpperCase(),
                lang: ud.lang || 'pt',
                at: o.fulfilledAt ? new Date(o.fulfilledAt).toISOString() : tsFromId(o._id),
                concierge: ci,
            };
        });

        // --- Log de envios de alerta ---
        const logs = await NotificationLog.find({}).sort({ sentAt: -1 }).limit(limit).lean();
        const deliveries = logs.map((l) => ({
            at: l.sentAt ? new Date(l.sentAt).toISOString() : tsFromId(l._id),
            email: l.userEmail || '',
            restaurant: l.restaurantName || '',
            date: l.date || '',
            meal: l.meal || '',
            partySize: l.partySize || 0,
            slots: l.slots || [],
            channel: l.channel,
            to: l.to || '',
            status: l.status,
            reason: l.reason || '',
        }));

        // --- Assinaturas (derivadas do portalPayload dos clientes) ---
        const subscriptions = users
            .map((u) => {
                const p = (u.portalPayload && typeof u.portalPayload === 'object' && u.portalPayload) || {};
                const s = p.subscription && typeof p.subscription === 'object' ? p.subscription : null;
                if (!s) return null;
                return {
                    email: u.email,
                    name: p.name || '',
                    planName: s.name || (p.plan && p.plan.name) || '',
                    active: s.active !== false,
                    alerts: s.alerts != null ? s.alerts : (p.plan && p.plan.alerts) || null,
                    price: s.price != null ? s.price : null,
                    since: s.since || null,
                    lastPaymentAt: s.lastPaymentAt || null,
                    canceledAt: s.canceledAt || null,
                };
            })
            .filter(Boolean);

        // --- Leads (formulário de contato + parceria B2B) ---
        const [contactDocs, b2bDocs] = await Promise.all([
            ContactLead.find({}).sort({ _id: -1 }).limit(limit).lean().catch(() => []),
            B2BLead.find({}).sort({ _id: -1 }).limit(limit).lean().catch(() => []),
        ]);
        const contactLeads = contactDocs.map((l) => ({
            at: l.createdAt ? new Date(l.createdAt).toISOString() : tsFromId(l._id),
            source: l.source || 'modal',
            name: l.name || '',
            email: l.email || '',
            phone: l.phone || '',
            dates: l.dates || '',
            parks: l.parks || '',
            restaurants: l.restaurants || '',
            message: l.message || '',
        }));
        const b2bLeads = b2bDocs.map((l) => ({
            at: l.createdAt ? new Date(l.createdAt).toISOString() : tsFromId(l._id),
            companyName: l.companyName || '',
            contactName: l.contactName || '',
            email: l.email || '',
            phone: l.phone || '',
            country: l.country || '',
            website: l.website || '',
            monthlyVolume: l.monthlyVolume || '',
            message: l.message || '',
        }));

        const stats = {
            customers: customers.length,
            purchases: purchases.length,
            deliveries: deliveries.length,
            deliveriesSent: deliveries.filter((d) => d.status === 'sent').length,
            deliveriesFailed: deliveries.filter((d) => d.status === 'failed').length,
            subscriptions: subscriptions.filter((s) => s.active).length,
            leads: contactLeads.length + b2bLeads.length,
        };

        return res.status(200).json({ ok: true, stats, customers, purchases, deliveries, subscriptions, contactLeads, b2bLeads });
    } catch (err) {
        console.error('admin-data:', err);
        return res.status(500).json({ ok: false, error: 'server_error' });
    }
}

module.exports = { adminData };
