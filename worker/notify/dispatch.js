const config = require('../config');
const { sendAvailabilityEmail } = require('./email');
const { sendAvailabilityWhatsApp } = require('./whatsapp');

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
    }

    if (alert.channels?.whatsapp && Array.isArray(alert.phones) && alert.phones.length) {
        result.whatsapp = [];
        for (const phone of alert.phones) {
            const r = await sendAvailabilityWhatsApp({ to: phone, ...payload }).catch((e) => ({
                sent: false,
                reason: String(e),
            }));
            result.whatsapp.push({ phone, ...r });
        }
    }

    return result;
}

module.exports = { dispatchAvailability };
