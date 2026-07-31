const config = require('../config');

/**
 * Notificação por WhatsApp via Meta WhatsApp Cloud API.
 *
 * IMPORTANTE: alertas são mensagens INICIADAS por nós (proativas). Fora da janela
 * de 24h de atendimento, o WhatsApp só permite enviar via TEMPLATE pré-aprovado
 * no Meta Business. Por isso o envio padrão usa template.
 *
 * Configure no .env:
 *   WHATSAPP_PROVIDER=meta
 *   WHATSAPP_PHONE_NUMBER_ID=...        (ID do número remetente)
 *   WHATSAPP_ACCESS_TOKEN=...           (token do system user / permanente)
 *   WHATSAPP_TEMPLATE_NAME=vaga_disponivel
 *   WHATSAPP_TEMPLATE_LANG=pt_BR
 *
 * Template sugerido (crie no Meta Business, categoria UTILITY, 3 variáveis no corpo):
 *   "🎉 Vaga na Disney! {{1}} — {{2}}. Horários: {{3}}. Reserve rápido no site oficial."
 *   {{1}} = restaurante   {{2}} = data · refeição · nº pessoas   {{3}} = horários
 */

/** Só dígitos, formato E.164 sem '+': "+55 (11) 99999-9999" -> "5511999999999". */
function normalizePhone(raw) {
    return String(raw || '').replace(/\D+/g, '');
}

/** Junta horários limitando o tamanho (templates têm limite de caracteres). */
function joinTimes(slots, max = 12) {
    const times = slots.map((s) => s.time);
    if (times.length <= max) return times.join(', ');
    return times.slice(0, max).join(', ') + ` e mais ${times.length - max}`;
}

async function postMessage(body) {
    const { apiVersion, phoneNumberId, accessToken } = config.notify.whatsapp;
    const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
        const msg = json && json.error ? `${json.error.code} ${json.error.message}` : `HTTP ${res.status}`;
        console.error('[whatsapp] Meta erro:', msg);
        return { sent: false, reason: 'meta_error', status: res.status, error: json.error };
    }
    const id = json.messages && json.messages[0] && json.messages[0].id;
    return { sent: true, id };
}

async function sendAvailabilityWhatsApp({ to, restaurantName, date, meal, partySize, slots }) {
    const wa = config.notify.whatsapp;
    const phone = normalizePhone(to);

    if (wa.provider !== 'meta' || !wa.phoneNumberId || !wa.accessToken) {
        const preview = `${restaurantName} — ${date}: ${joinTimes(slots)}`;
        console.warn(`[whatsapp] Meta não configurado — mensagem NÃO enviada para ${phone}.`);
        console.warn(`[whatsapp] (stub) ${preview}`);
        return { sent: false, reason: 'not_configured' };
    }

    const dateInfo = `${date}${meal ? ` · ${meal}` : ''} · ${partySize} pessoa(s)`;
    const timesText = joinTimes(slots);

    // Envio via TEMPLATE (obrigatório p/ proativo).
    if (wa.templateName) {
        return postMessage({
            messaging_product: 'whatsapp',
            to: phone,
            type: 'template',
            template: {
                name: wa.templateName,
                language: { code: wa.templateLang },
                components: [
                    {
                        type: 'body',
                        parameters: [
                            { type: 'text', text: restaurantName },
                            { type: 'text', text: dateInfo },
                            { type: 'text', text: timesText },
                        ],
                    },
                ],
            },
        });
    }

    // Fallback texto livre — só funciona dentro da janela de 24h / número de teste.
    console.warn('[whatsapp] WHATSAPP_TEMPLATE_NAME ausente — tentando texto livre (só vale na janela de 24h).');
    return postMessage({
        messaging_product: 'whatsapp',
        to: phone,
        type: 'text',
        text: {
            body: `🎉 Vaga na Disney! ${restaurantName} — ${dateInfo}.\nHorários: ${timesText}\nReserve rápido no site oficial.`,
        },
    });
}

module.exports = { sendAvailabilityWhatsApp, normalizePhone };
