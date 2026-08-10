const bcrypt = require('bcryptjs');
const { connectMongo } = require('./mongo');
const PortalUser = require('./PortalUser');

/**
 * Troca a senha do cliente: verifica a senha atual e grava o hash da nova.
 */
async function changePassword(req, res) {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const email = String(body.email || '').trim().toLowerCase();
    const currentPassword = body.currentPassword;
    const newPassword = body.newPassword;

    if (!email || !currentPassword || !newPassword) {
        return res.status(400).json({ ok: false, error: 'missing_fields' });
    }
    if (typeof newPassword !== 'string' || newPassword.length < 8) {
        return res.status(400).json({ ok: false, error: 'password_too_short' });
    }

    try {
        await connectMongo();
        const user = await PortalUser.findOne({ email });
        if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
            return res.status(401).json({ ok: false, error: 'invalid_credentials' });
        }
        user.passwordHash = await bcrypt.hash(newPassword, 10);
        await user.save();
        return res.status(200).json({ ok: true });
    } catch (err) {
        console.error('change-password:', err);
        return res.status(500).json({ ok: false, error: 'server_error' });
    }
}

module.exports = { changePassword };
