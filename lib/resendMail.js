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

/**
 * E-mail de boas-vindas com credenciais de acesso ao portal, após pagamento.
 */
async function sendCredentialsEmail({ to, name, tempPassword, planName }) {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM || 'Dine Mouse <onboarding@resend.dev>';
    const portalUrl = `${(process.env.APP_PUBLIC_URL || 'https://www.dinemouse.com').replace(/\/$/, '')}/portal`;

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: system-ui, sans-serif; line-height:1.6; color:#333;">
  <p>Olá ${name || ''},</p>
  <p>Seu pagamento foi confirmado! 🎉 Plano: <strong>${planName || 'Dine Mouse'}</strong>.</p>
  <p>Acesse o Portal do Cliente com estas credenciais:</p>
  <p style="background:#f5f5f7;padding:12px 16px;border-radius:8px;">
    <strong>E-mail:</strong> ${to}<br>
    <strong>Senha temporária:</strong> ${tempPassword}
  </p>
  <p><a href="${portalUrl}" style="display:inline-block;padding:12px 24px;background:#4B3F72;color:#fff;text-decoration:none;border-radius:8px;">Acessar o Portal</a></p>
  <p style="font-size:0.9rem;color:#666;">Recomendamos alterar sua senha no primeiro acesso.</p>
</body>
</html>`.trim();

    if (!apiKey) {
        console.warn('[mail] RESEND_API_KEY ausente — credenciais não enviadas. Senha temporária:', tempPassword);
        return { sent: false, reason: 'no_api_key' };
    }

    const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to: [to], subject: 'Bem-vindo ao Dine Mouse — seu acesso', html }),
    });
    if (!res.ok) {
        console.error('[mail] Resend erro (credenciais):', res.status, await res.text().catch(() => ''));
        return { sent: false, reason: 'resend_error', status: res.status };
    }
    return { sent: true };
}

/**
 * E-mail de confirmação de compra, listando os alertas que ficaram ATIVOS.
 * Inclui credenciais quando o cliente é novo (tempPassword presente).
 */
async function sendPurchaseEmail({ to, name, planName, alerts, tempPassword }) {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM || 'Dine Mouse <onboarding@resend.dev>';
    const portalUrl = `${(process.env.APP_PUBLIC_URL || 'https://www.dinemouse.com').replace(/\/$/, '')}/portal`;

    const hasAlerts = Array.isArray(alerts) && alerts.length > 0;
    const alertsHtml = hasAlerts
        ? '<ul style="padding-left:20px;">' +
          alerts
              .map(
                  (a) =>
                      `<li><strong>${a.restaurant}</strong> — ${a.date}${a.meal ? ` · ${a.meal}` : ''} · ${a.partySize} pessoa(s)</li>`
              )
              .join('') +
          '</ul>'
        : '';
    const credsHtml = tempPassword
        ? `<p style="background:#f5f5f7;padding:12px 16px;border-radius:8px;">
             <strong>E-mail:</strong> ${to}<br>
             <strong>Senha temporária:</strong> ${tempPassword}
           </p><p style="font-size:0.9rem;color:#666;">Recomendamos alterar sua senha no primeiro acesso.</p>`
        : '';

    const subject = hasAlerts ? 'Seus alertas Dine Mouse estão ativos ✅' : 'Compra confirmada — Dine Mouse';
    const intro = hasAlerts
        ? 'Seu pagamento foi confirmado e os alertas abaixo já estão <strong>ativos</strong> — vamos monitorar 24/7 e avisar assim que surgir disponibilidade:'
        : 'Seu pagamento foi confirmado! 🎉';

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: system-ui, sans-serif; line-height:1.6; color:#333;">
  <h2 style="color:#4B3F72;">🎉 Compra confirmada</h2>
  <p>Olá ${name || ''},</p>
  <p>${intro}</p>
  ${alertsHtml}
  <p>Plano: <strong>${planName || 'Dine Mouse'}</strong>.</p>
  ${credsHtml}
  <p><a href="${portalUrl}" style="display:inline-block;padding:12px 24px;background:#4B3F72;color:#fff;text-decoration:none;border-radius:8px;">Acessar o Portal</a></p>
</body>
</html>`.trim();

    if (!apiKey) {
        console.warn('[mail] RESEND_API_KEY ausente — e-mail de compra não enviado.', tempPassword ? `senha: ${tempPassword}` : '');
        return { sent: false, reason: 'no_api_key' };
    }
    const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to: [to], subject, html }),
    });
    if (!res.ok) {
        console.error('[mail] Resend erro (compra):', res.status, await res.text().catch(() => ''));
        return { sent: false, reason: 'resend_error', status: res.status };
    }
    return { sent: true };
}

module.exports = { sendPasswordResetEmail, sendCredentialsEmail, sendPurchaseEmail };
