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

/** 'YYYY-MM-DD' -> 'DD/MM/YYYY' (para exibição). Deixa passar outros formatos. */
function formatDatePt(date) {
    const m = String(date || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return m ? `${m[3]}/${m[2]}/${m[1]}` : String(date || '');
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

async function sendAvailabilityWhatsApp({ to, restaurantName, date, meal, partySize, slots, lang }) {
    const wa = config.notify.whatsapp;
    const phone = normalizePhone(to);

    if (wa.provider !== 'meta' || !wa.phoneNumberId || !wa.accessToken) {
        const preview = `${restaurantName} — ${date}: ${joinTimes(slots)}`;
        console.warn(`[whatsapp] Meta não configurado — mensagem NÃO enviada para ${phone}.`);
        console.warn(`[whatsapp] (stub) ${preview}`);
        return { sent: false, reason: 'not_configured' };
    }

    const dateText = formatDatePt(date);
    const timesText = joinTimes(slots);

    // Template por idioma. Em EN, usa o template/idioma EN se configurado
    // (precisa ser criado e APROVADO no Meta Business); senão cai no padrão.
    const isEn = lang === 'en';
    const templateName = (isEn && wa.templateNameEn) || wa.templateName;
    const templateLang = (isEn && wa.templateNameEn && wa.templateLangEn) || wa.templateLang;

    // Envio via TEMPLATE (obrigatório p/ proativo).
    // Template `vaga_disponivel` (4 variáveis, nesta ordem):
    //   {{1}} restaurante · {{2}} data · {{3}} horário(s) · {{4}} nº de pessoas
    if (templateName) {
        return postMessage({
            messaging_product: 'whatsapp',
            to: phone,
            type: 'template',
            template: {
                name: templateName,
                language: { code: templateLang },
                components: [
                    {
                        type: 'body',
                        parameters: [
                            { type: 'text', text: restaurantName },
                            { type: 'text', text: dateText },
                            { type: 'text', text: timesText },
                            { type: 'text', text: String(partySize) },
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
            body: `🎉 Vaga na Disney! ${restaurantName} — ${dateText}${meal ? ` · ${meal}` : ''} · ${partySize} pessoa(s).\nHorários: ${timesText}\nReserve rápido no site oficial.`,
        },
    });
}

module.exports = { sendAvailabilityWhatsApp, normalizePhone };
