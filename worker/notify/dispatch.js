const config = require('../config');
const { sendAvailabilityEmail } = require('./email');
const { sendAvailabilityWhatsApp } = require('./whatsapp');
const NotificationLog = require('../../lib/NotificationLog');

/** Registra um envio no log (best-effort: nunca quebra o disparo). */
async function logSend(alert, restaurantName, slots, channel, to, result) {
    try {
        await NotificationLog.create({
            userEmail: alert.userEmail || '',
            alertId: alert._id || null,
            restaurantName,
            date: alert.date || '',
            meal: alert.meal || '',
            partySize: alert.partySize || 0,
            slots: slots.map((s) => s.time),
            channel,
            to: to || '',
            status: result && result.sent ? 'sent' : 'failed',
            reason: result && !result.sent ? String(result.reason || result.status || 'erro') : '',
            lang: alert.lang === 'en' ? 'en' : 'pt',
        });
    } catch (e) {
        console.warn('[dispatch] falha ao gravar log de envio:', e.message);
    }
}

/**
 * Roteia a notificação de novas vagas para os canais desejados do alerta.
 * @returns {Promise<{email?:object, whatsapp?:object}>}
 */
async function dispatchAvailability(alert, restaurantName, slots, restaurantUrl) {
    if (config.notify.dryRun) {
        console.log(
            `[dry-run] notificaria ${alert.userEmail} — ${restaurantName} ${alert.date}: ` +
                slots.map((s) => s.time).join(', ')
        );
        return { dryRun: true };
    }

    const payload = {
        restaurantName,
        date: alert.date,
        meal: alert.meal || '',
        partySize: alert.partySize,
        slots,
        restaurantUrl: restaurantUrl || null,
        lang: alert.lang === 'en' ? 'en' : 'pt',
    };
    const result = {};

    if (alert.channels?.email !== false && alert.userEmail) {
        result.email = await sendAvailabilityEmail({ to: alert.userEmail, ...payload }).catch((e) => ({
            sent: false,
            reason: String(e),
        }));
        await logSend(alert, restaurantName, slots, 'email', alert.userEmail, result.email);
    }

    if (alert.channels?.whatsapp && Array.isArray(alert.phones) && alert.phones.length) {
        result.whatsapp = [];
        for (const phone of alert.phones) {
            const r = await sendAvailabilityWhatsApp({ to: phone, ...payload }).catch((e) => ({
                sent: false,
                reason: String(e),
            }));
            result.whatsapp.push({ phone, ...r });
            await logSend(alert, restaurantName, slots, 'whatsapp', phone, r);
        }
    }

    return result;
}

module.exports = { dispatchAvailability };
