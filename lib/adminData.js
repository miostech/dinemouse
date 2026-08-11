const crypto = require('crypto');
const { connectMongo } = require('./mongo');
const PortalUser = require('./PortalUser');
const PendingOrder = require('./PendingOrder');
const NotificationLog = require('./NotificationLog');

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
        const purchases = orders.map((o) => ({
            email: o.email || '',
            planType: o.planType || '',
            planName: (o.userData && o.userData.plan && o.userData.plan.name) || '',
            amount: o.amountTotalCents != null ? o.amountTotalCents / 100 : null,
            currency: (o.currency || 'brl').toUpperCase(),
            lang: (o.userData && o.userData.lang) || 'pt',
            at: o.fulfilledAt ? new Date(o.fulfilledAt).toISOString() : tsFromId(o._id),
        }));

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

        const stats = {
            customers: customers.length,
            purchases: purchases.length,
            deliveries: deliveries.length,
            deliveriesSent: deliveries.filter((d) => d.status === 'sent').length,
            deliveriesFailed: deliveries.filter((d) => d.status === 'failed').length,
        };

        return res.status(200).json({ ok: true, stats, customers, purchases, deliveries });
    } catch (err) {
        console.error('admin-data:', err);
        return res.status(500).json({ ok: false, error: 'server_error' });
    }
}

module.exports = { adminData };
