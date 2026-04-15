const bcrypt = require('bcryptjs');
const { connectMongo } = require('./mongo');
const PortalUser = require('./PortalUser');

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

        const userData = {
            ...(doc.portalPayload && typeof doc.portalPayload === 'object' ? doc.portalPayload : {}),
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
