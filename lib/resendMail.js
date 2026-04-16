/**
 * Envio via Resend (https://resend.com). Defina RESEND_API_KEY e RESEND_FROM no .env.
 * Sem API key, regista o link no servidor (útil em desenvolvimento).
 */
async function sendPasswordResetEmail({ to, resetUrl }) {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM || 'Dine Mouse <onboarding@resend.dev>';

    if (!apiKey) {
        console.warn('[auth] RESEND_API_KEY não definido - e-mail não enviado. Link de redefinição:');
        console.warn(resetUrl);
        return { sent: false, reason: 'no_api_key' };
    }

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: system-ui, sans-serif; line-height: 1.6; color: #333;">
  <p>Recebemos um pedido para redefinir a senha da sua conta Dine Mouse.</p>
  <p><a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#4B3F72;color:#fff;text-decoration:none;border-radius:8px;">Redefinir senha</a></p>
  <p>Ou copie este endereço no navegador:<br><small style="word-break:break-all;">${resetUrl}</small></p>
  <p>Este link expira em <strong>1 hora</strong>. Se não foi você, ignore este e-mail.</p>
</body>
</html>`.trim();

    const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            from,
            to: [to],
            subject: 'Redefinir senha - Dine Mouse',
            html,
        }),
    });

    if (!res.ok) {
        const text = await res.text().catch(() => '');
        console.error('[auth] Resend erro:', res.status, text);
        return { sent: false, reason: 'resend_error', status: res.status };
    }

    return { sent: true };
}

module.exports = { sendPasswordResetEmail };
