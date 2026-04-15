const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { connectMongo } = require('./mongo');
const PortalUser = require('./PortalUser');
const PasswordResetToken = require('./PasswordResetToken');

async function authResetPassword(req, res) {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const token = String(body.token || '').trim();
    const newPassword = body.newPassword;

    if (!token || !newPassword || typeof newPassword !== 'string') {
        return res.status(400).json({ ok: false, error: 'missing_fields' });
    }
    if (newPassword.length < 8) {
        return res.status(400).json({ ok: false, error: 'password_too_short' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    try {
        await connectMongo();
        const pr = await PasswordResetToken.findOne({
            tokenHash,
            consumedAt: null,
            expiresAt: { $gt: new Date() },
        });

        if (!pr) {
            return res.status(400).json({ ok: false, error: 'invalid_or_expired_token' });
        }

        const email = pr.email;
        const passwordHash = await bcrypt.hash(newPassword, 10);

        const updated = await PortalUser.findOneAndUpdate(
            { email },
            { $set: { passwordHash } },
            { new: true }
        );

        if (!updated) {
            return res.status(400).json({ ok: false, error: 'user_missing' });
        }

        pr.consumedAt = new Date();
        await pr.save();

        return res.status(200).json({ ok: true });
    } catch (err) {
        console.error('auth-reset-password:', err);
        return res.status(500).json({ ok: false, error: 'server_error' });
    }
}

module.exports = { authResetPassword };
