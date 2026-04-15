const crypto = require('crypto');
const { connectMongo } = require('./mongo');
const PortalUser = require('./PortalUser');
const PasswordResetToken = require('./PasswordResetToken');
const { sendPasswordResetEmail } = require('./resendMail');

function publicBaseUrl(req) {
    const env = process.env.APP_PUBLIC_URL;
    if (env && String(env).trim()) {
        return String(env).trim().replace(/\/$/, '');
    }
    if (process.env.VERCEL_URL) {
        return `https://${process.env.VERCEL_URL}`.replace(/\/$/, '');
    }
    const origin = req.headers.origin;
    if (origin && typeof origin === 'string') {
        return origin.replace(/\/$/, '');
    }
    const host = req.headers.host;
    if (host) {
        const proto = req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
        return `${proto}://${host}`.replace(/\/$/, '');
    }
    return '';
}

async function authForgotPassword(req, res) {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const email = String(body.email || '').trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ ok: false, error: 'invalid_email' });
    }

    try {
        await connectMongo();
        const user = await PortalUser.findOne({ email });

        if (user) {
            const token = crypto.randomBytes(32).toString('hex');
            const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
            const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

            await PasswordResetToken.updateMany(
                { email, consumedAt: null },
                { $set: { consumedAt: new Date() } }
            );

            await PasswordResetToken.create({
                email,
                tokenHash,
                expiresAt,
            });

            const base = publicBaseUrl(req);
            const resetPath = '/recuperar-senha';
            const resetUrl = base
                ? `${base}${resetPath}?token=${encodeURIComponent(token)}`
                : null;

            if (resetUrl) {
                await sendPasswordResetEmail({ to: email, resetUrl });
            } else {
                console.warn(
                    '[auth] Defina APP_PUBLIC_URL (produção) ou envie o pedido com Origin. Token (só testes):',
                    token
                );
            }
        }

        return res.status(200).json({
            ok: true,
            message: 'Se existir uma conta com este e-mail, enviámos instruções para redefinir a senha.',
        });
    } catch (err) {
        console.error('auth-forgot-password:', err);
        return res.status(500).json({ ok: false, error: 'server_error' });
    }
}

module.exports = { authForgotPassword };
