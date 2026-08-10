const bcrypt = require('bcryptjs');
const { connectMongo } = require('./mongo');
const PortalUser = require('./PortalUser');
const Alert = require('./Alert');

const ALLOWED = ['active', 'paused', 'cancelled'];

/**
 * Atualiza o status de um alerta (pausar/cancelar/retomar) — no portalPayload
 * do usuário E na coleção Alert (o que o worker monitora). Exige email+senha.
 */
async function updateAlertStatus(req, res) {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const email = String(body.email || '').trim().toLowerCase();
    const password = body.password;
    const alertId = body.alertId;
    const status = String(body.status || '');

    if (!email || !password || alertId == null || !ALLOWED.includes(status)) {
        return res.status(400).json({ ok: false, error: 'invalid_params' });
    }

    try {
        await connectMongo();
        const user = await PortalUser.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
            return res.status(401).json({ ok: false, error: 'invalid_credentials' });
        }

        const pp = user.portalPayload && typeof user.portalPayload === 'object' ? user.portalPayload : {};
        const alerts = Array.isArray(pp.alerts) ? pp.alerts : [];
        const alert = alerts.find((a) => Number(a.id) === Number(alertId));
        if (!alert) return res.status(404).json({ ok: false, error: 'alert_not_found' });

        alert.status = status;
        user.portalPayload = pp;
        user.markModified('portalPayload');
        await user.save();

        // Reflete na coleção Alert (worker só monitora status 'active').
        await Alert.updateMany(
            {
                userEmail: email,
                restaurantName: alert.restaurant,
                date: alert.date,
                partySize: Number(alert.partySize) || 2,
            },
            { $set: { status } }
        );

        return res.status(200).json({ ok: true });
    } catch (err) {
        console.error('alert-status:', err);
        return res.status(500).json({ ok: false, error: 'server_error' });
    }
}

module.exports = { updateAlertStatus };
