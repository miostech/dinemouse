const bcrypt = require('bcryptjs');
const { connectMongo } = require('./mongo');
const PortalUser = require('./PortalUser');
const { enrichAndReconcileAlerts } = require('./portalAlertsEnrich');

async function authLogin(req, res) {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const email = String(body.email || '').trim().toLowerCase();
    const password = body.password;

    if (!email || !password) {
        return res.status(400).json({ ok: false, error: 'missing_fields' });
    }

    try {
        await connectMongo();
        const doc = await PortalUser.findOne({ email });
        if (!doc || !(await bcrypt.compare(password, doc.passwordHash))) {
            return res.status(401).json({ ok: false, error: 'invalid_credentials' });
        }

        const payload = doc.portalPayload && typeof doc.portalPayload === 'object' ? doc.portalPayload : {};

        // Enriquece os alertas com nº de notificações + status reconciliado
        // (expira quando a data já passou). Best-effort: nunca quebra o login.
        try {
            const { alerts, changed } = await enrichAndReconcileAlerts(doc.email, payload);
            payload.alerts = alerts;
            if (changed) {
                // Persiste o status reconciliado no blob (portal/admin consistentes).
                const persisted = alerts.map(({ notificationsCount, lastNotifiedAt, ...rest }) => rest);
                doc.portalPayload = { ...payload, alerts: persisted };
                doc.markModified('portalPayload');
                await doc.save();
            }
        } catch (e) {
            console.warn('auth-login: falha ao enriquecer alertas:', e.message);
        }

        const userData = {
            ...payload,
            email: doc.email,
            password,
        };

        return res.status(200).json({ ok: true, userData });
    } catch (err) {
        console.error('auth-login:', err);
        return res.status(500).json({ ok: false, error: 'server_error' });
    }
}

module.exports = { authLogin };
