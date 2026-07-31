const config = require('../config');

/**
 * E-mail de disponibilidade via Resend.
 * Sem RESEND_API_KEY, apenas loga (útil em desenvolvimento).
 */

function slotsHtml(slots) {
    return slots
        .map((s) => {
            const label = s.mealPeriod ? `${s.time} · ${s.mealPeriod}` : s.time;
            const link = s.url
                ? `<a href="${s.url}" style="color:#4B3F72;font-weight:600;">Reservar</a>`
                : '';
            return `<li style="margin:4px 0;">${label} ${link}</li>`;
        })
        .join('');
}

function buildHtml({ restaurantName, date, meal, partySize, slots }) {
    const portalUrl = `${config.notify.appPublicUrl.replace(/\/$/, '')}/portal`;
    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: system-ui, -apple-system, sans-serif; line-height:1.6; color:#0B1C2D;">
  <h2 style="color:#4B3F72; margin-bottom:4px;">🎉 Vaga encontrada!</h2>
  <p style="margin-top:0;">Surgiu disponibilidade em um restaurante que você está monitorando.</p>
  <table style="border-collapse:collapse; margin:16px 0;">
    <tr><td style="padding:2px 12px 2px 0; color:#666;">Restaurante</td><td><strong>${restaurantName}</strong></td></tr>
    <tr><td style="padding:2px 12px 2px 0; color:#666;">Data</td><td><strong>${date}</strong></td></tr>
    ${meal ? `<tr><td style="padding:2px 12px 2px 0; color:#666;">Refeição</td><td><strong>${meal}</strong></td></tr>` : ''}
    <tr><td style="padding:2px 12px 2px 0; color:#666;">Pessoas</td><td><strong>${partySize}</strong></td></tr>
  </table>
  <p style="margin-bottom:4px;"><strong>Horários disponíveis agora:</strong></p>
  <ul style="padding-left:20px; margin-top:4px;">${slotsHtml(slots)}</ul>
  <p style="font-size:0.9rem; color:#666;">⚠️ Essas vagas somem rápido. Reserve o quanto antes no site oficial da Disney.</p>
  <p style="font-size:0.9rem;">Gerencie seus alertas no <a href="${portalUrl}" style="color:#4B3F72;">Portal Dine Mouse</a>.</p>
</body>
</html>`.trim();
}

async function sendAvailabilityEmail({ to, restaurantName, date, meal, partySize, slots }) {
    const subject = `Vaga disponível: ${restaurantName} em ${date}`;
    const html = buildHtml({ restaurantName, date, meal, partySize, slots });

    if (!config.notify.resendApiKey) {
        console.warn(`[email] RESEND_API_KEY ausente — e-mail NÃO enviado para ${to}.`);
        console.warn(`[email] (dev) Assunto: ${subject}`);
        return { sent: false, reason: 'no_api_key' };
    }

    const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${config.notify.resendApiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from: config.notify.resendFrom, to: [to], subject, html }),
    });

    if (!res.ok) {
        const text = await res.text().catch(() => '');
        console.error('[email] Resend erro:', res.status, text);
        return { sent: false, reason: 'resend_error', status: res.status };
    }
    return { sent: true };
}

module.exports = { sendAvailabilityEmail };
