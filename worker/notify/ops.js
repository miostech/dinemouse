const config = require('../config');

/**
 * Avisos operacionais para VOCÊ (operador), não para clientes.
 * Ex.: sessão MyDisney caiu (401), disjuntor Akamai abriu.
 * Usa Resend (mesma infra do e-mail) e tem cooldown por tipo p/ não floodar.
 */

const lastSentByReason = new Map();

async function notifyOps(reason, subject, message) {
    const now = Date.now();
    const last = lastSentByReason.get(reason) || 0;
    if (now - last < config.notify.opsCooldownMs) {
        return { sent: false, reason: 'cooldown' };
    }
    lastSentByReason.set(reason, now);

    // Sempre loga bem visível.
    console.error(`\n🚨 [ops:${reason}] ${subject}\n${message}\n`);

    const to = config.notify.opsEmail;
    if (config.notify.dryRun || !to || !config.notify.resendApiKey) {
        if (!to) console.warn('[ops] OPS_ALERT_EMAIL não definido — aviso só no log.');
        return { sent: false, reason: 'not_configured_or_dryrun' };
    }

    try {
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${config.notify.resendApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: config.notify.resendFrom,
                to: [to],
                subject: `[Dine Mouse Worker] ${subject}`,
                html: `<p>${message.replace(/\n/g, '<br>')}</p>`,
            }),
        });
        return { sent: res.ok };
    } catch (err) {
        console.error('[ops] falha ao enviar aviso:', err.message);
        return { sent: false, reason: 'error' };
    }
}

/** Reseta o cooldown de um tipo (ex.: quando a sessão volta ao normal). */
function clearOpsCooldown(reason) {
    lastSentByReason.delete(reason);
}

module.exports = { notifyOps, clearOpsCooldown };
