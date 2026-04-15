const bcrypt = require('bcryptjs');
const { connectMongo } = require('./mongo');
const PortalUser = require('./PortalUser');
const { cloneUserDataWithoutPassword } = require('./portalPayload');

async function authPortalRegister(req, res) {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const email = String(body.email || '').trim().toLowerCase();
    const password = body.password;
    const userData = body.userData;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ ok: false, error: 'invalid_email' });
    }
    if (!password || typeof password !== 'string' || password.length < 8) {
        return res.status(400).json({ ok: false, error: 'password_too_short' });
    }
    if (!userData || typeof userData !== 'object') {
        return res.status(400).json({ ok: false, error: 'missing_user_data' });
    }

    try {
        await connectMongo();
        const passwordHash = await bcrypt.hash(password, 10);
        const portalPayload = cloneUserDataWithoutPassword(userData);

        await PortalUser.findOneAndUpdate(
            { email },
            { $set: { email, passwordHash, portalPayload } },
            { upsert: true, new: true }
        );

        return res.status(200).json({ ok: true });
    } catch (err) {
        console.error('portal-register:', err);
        return res.status(500).json({ ok: false, error: 'server_error' });
    }
}

module.exports = { authPortalRegister };
