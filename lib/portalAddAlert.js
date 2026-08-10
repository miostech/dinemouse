const bcrypt = require('bcryptjs');
const { connectMongo } = require('./mongo');
const PortalUser = require('./PortalUser');
const Alert = require('./Alert');

const MAX_ACTIVE = Number(process.env.PORTAL_MAX_ACTIVE_ALERTS || 25);

function expiryFromDate(dateString) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dateString || ''))) return null;
    const d = new Date(`${dateString}T23:59:59-04:00`);
    return Number.isNaN(d.getTime()) ? null : d;
}
function daysAhead(dateString) {
    const target = new Date(`${dateString}T00:00:00Z`);
    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    return Math.ceil((target - today) / 86400000);
}

/**
 * Cria um alerta a partir do PORTAL (assinantes) — sem pagar por alerta.
 * Grava no portalPayload.alerts E na coleção Alert (o worker monitora).
 */
async function addAlert(req, res) {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const email = String(body.email || '').trim().toLowerCase();
    const password = body.password;
    const restaurant = String(body.restaurant || '').trim();
    const date = String(body.date || '').trim();
    const meal = String(body.meal || 'Jantar').trim();
    const partySize = Number(body.partySize) || 2;

    if (!email || !password || !restaurant || !date) return res.status(400).json({ ok: false, error: 'invalid_params' });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ ok: false, error: 'invalid_date' });
    const da = daysAhead(date);
    if (da < 0 || da > 60) return res.status(400).json({ ok: false, error: 'date_out_of_range' });
    if (partySize < 1 || partySize > 20) return res.status(400).json({ ok: false, error: 'invalid_party' });

    try {
        await connectMongo();
        const user = await PortalUser.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
            return res.status(401).json({ ok: false, error: 'invalid_credentials' });
        }

        const pp = user.portalPayload && typeof user.portalPayload === 'object' ? user.portalPayload : {};
        const sub = pp.subscription;
        if (!sub || sub.active === false) return res.status(403).json({ ok: false, error: 'no_subscription' });

        const alerts = Array.isArray(pp.alerts) ? pp.alerts : [];
        const activeCount = alerts.filter((a) => a.status === 'active').length;
        if (activeCount >= MAX_ACTIVE) return res.status(409).json({ ok: false, error: 'limit_reached', limit: MAX_ACTIVE });

        const dup = alerts.find(
            (a) => a.restaurant === restaurant && a.date === date && (a.meal || '') === meal && Number(a.partySize) === partySize && a.status !== 'cancelled'
        );
        if (dup) return res.status(409).json({ ok: false, error: 'duplicate' });

        const maxId = alerts.reduce((m, a) => Math.max(m, Number(a.id) || 0), 0);
        const newAlert = {
            id: maxId + 1,
            restaurant,
            park: 'walt-disney-world',
            date,
            meal,
            partySize,
            status: 'active',
            activeDays: 12,
            createdAt: new Date().toISOString(),
        };
        alerts.push(newAlert);
        pp.alerts = alerts;
        user.portalPayload = pp;
        user.markModified('portalPayload');
        await user.save();

        const phones = Array.isArray(pp.phones)
            ? pp.phones.map((p) => (p && typeof p === 'object' ? p.full || p.number || '' : String(p || ''))).filter(Boolean)
            : [];
        await Alert.updateOne(
            { userEmail: email, resort: 'wdw', restaurantName: restaurant, date, meal, partySize },
            {
                $set: {
                    status: 'active',
                    nextCheckAt: new Date(),
                    channels: { email: true, whatsapp: phones.length > 0 },
                    phones,
                    parkKey: 'walt-disney-world',
                    expiresAt: expiryFromDate(date),
                    planType: 'subscription',
                    planName: sub.name || 'Assinatura',
                    sourceUserId: user._id,
                },
                $setOnInsert: { notifiedSlots: [] },
            },
            { upsert: true }
        );

        return res.status(200).json({ ok: true, alert: newAlert });
    } catch (err) {
        console.error('add-alert:', err);
        return res.status(500).json({ ok: false, error: 'server_error' });
    }
}

module.exports = { addAlert };
