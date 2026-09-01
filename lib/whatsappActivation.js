/**
 * Mensagem de WhatsApp "alerta ativado" — enviada assim que o cliente compra
 * (ou o assinante cria um alerta no portal) e o monitoramento fica ATIVO.
 *
 * É proativa (iniciada por nós), então só pode ir via TEMPLATE pré-aprovado no
 * Meta Business:
 *   - PT: alerta_ativo_dine    (idioma pt_BR)
 *   - EN: alerta_ativo_dineen  (idioma en_US)
 *
 * Corpo do template (3 variáveis, nesta ordem):
 *   ✨ Seu alerta está ativado!
 *   Já estamos monitorando vagas para {{1}}, em {{2}}, para {{3}} pessoas.
 *   Assim que surgir uma disponibilidade compatível, você receberá um alerta por aqui. 🔔
 *   {{1}} = restaurante · {{2}} = data · {{3}} = nº de pessoas
 *
 * Self-contained (lê process.env direto) para funcionar no webhook da Stripe
 * (Vercel), independente do worker. Exige no ambiente do webhook:
 *   WHATSAPP_PROVIDER=meta
 *   WHATSAPP_PHONE_NUMBER_ID=...
 *   WHATSAPP_ACCESS_TOKEN=...
 */

/** Só dígitos, formato E.164 sem '+': "+55 (11) 99999-9999" -> "5511999999999". */
function normalizePhone(raw) {
    return String(raw || '').replace(/\D+/g, '');
}

/** 'YYYY-MM-DD' -> 'DD/MM/YYYY'. Deixa passar outros formatos. */
function formatDate(date) {
    const m = String(date || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return m ? `${m[3]}/${m[2]}/${m[1]}` : String(date || '');
}

function waConfig() {
    return {
        provider: process.env.WHATSAPP_PROVIDER || '',
        phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
        accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
        apiVersion: process.env.WHATSAPP_API_VERSION || 'v21.0',
        templatePt: process.env.WHATSAPP_TEMPLATE_ACTIVATED || 'alerta_ativo_dine',
        templateEn: process.env.WHATSAPP_TEMPLATE_ACTIVATED_EN || 'alerta_ativo_dineen',
        templateLangPt: process.env.WHATSAPP_TEMPLATE_ACTIVATED_LANG || 'pt_BR',
        templateLangEn: process.env.WHATSAPP_TEMPLATE_ACTIVATED_LANG_EN || 'en_US',
    };
}

/**
 * Envia o template de "alerta ativado" para UM telefone.
 * @returns {Promise<{sent:boolean, id?:string, reason?:string}>}
 */
async function sendAlertActivatedWhatsApp({ to, restaurantName, date, partySize, lang }) {
    const wa = waConfig();
    const phone = normalizePhone(to);

    if (wa.provider !== 'meta' || !wa.phoneNumberId || !wa.accessToken || !phone) {
        console.warn('[whatsapp-ativado] Meta não configurado (ou telefone vazio) — mensagem NÃO enviada.');
        return { sent: false, reason: 'not_configured' };
    }

    const isEn = lang === 'en';
    const templateName = isEn ? wa.templateEn : wa.templatePt;
    const templateLang = isEn ? wa.templateLangEn : wa.templateLangPt;

    const url = `https://graph.facebook.com/${wa.apiVersion}/${wa.phoneNumberId}/messages`;
    const body = {
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
                        { type: 'text', text: String(restaurantName || '') },
                        { type: 'text', text: formatDate(date) },
                        { type: 'text', text: String(partySize || '') },
                    ],
                },
            ],
        },
    };

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { Authorization: `Bearer ${wa.accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
            const msg = json && json.error ? `${json.error.code} ${json.error.message}` : `HTTP ${res.status}`;
            console.error('[whatsapp-ativado] Meta erro:', msg);
            return { sent: false, reason: 'meta_error', status: res.status };
        }
        const id = json.messages && json.messages[0] && json.messages[0].id;
        return { sent: true, id };
    } catch (err) {
        console.error('[whatsapp-ativado] falha de rede:', err.message);
        return { sent: false, reason: 'network_error' };
    }
}

/**
 * Dispara a mensagem de ativação para uma lista de alertas recém-ativados,
 * para cada telefone do cliente. Best-effort: nunca lança (não quebra o fluxo).
 *
 * @param {object} params
 * @param {Array<{restaurant?:string, restaurantName?:string, date:string, partySize?:number}>} params.alerts
 * @param {string[]} params.phones  telefones do cliente (só envia se houver ≥1)
 * @param {'pt'|'en'} [params.lang]
 */
async function notifyAlertsActivated({ alerts, phones, lang = 'pt' }) {
    const list = Array.isArray(alerts) ? alerts : [];
    const nums = (Array.isArray(phones) ? phones : [])
        .map((p) => (p && typeof p === 'object' ? p.full || p.number || '' : p))
        .map(normalizePhone)
        .filter(Boolean);
    if (list.length === 0 || nums.length === 0) return; // sem WhatsApp contratado

    for (const a of list) {
        if (!a) continue;
        const restaurantName = a.restaurantName || a.restaurant || '';
        if (!restaurantName || !a.date) continue;
        for (const phone of nums) {
            const r = await sendAlertActivatedWhatsApp({
                to: phone,
                restaurantName,
                date: a.date,
                partySize: Number(a.partySize) || 2,
                lang,
            }).catch((e) => ({ sent: false, reason: String(e && e.message) }));
            if (r.sent) console.log(`[whatsapp-ativado] enviado p/ ${phone} — ${restaurantName} ${a.date}`);
        }
    }
}

/**
 * Aviso INTERNO por WhatsApp para a equipe: um Concierge foi pago (execução
 * manual). Proativo => precisa de TEMPLATE aprovado no Meta.
 *
 * Template `concierge_novo` (5 variáveis, nesta ordem):
 *   {{1}} plano · {{2}} cliente · {{3}} telefone · {{4}} viagem · {{5}} pessoas
 *
 * Env:
 *   CONCIERGE_ALERT_WHATSAPP=5511999998888,5521988887777   (1+ números da equipe)
 *   WHATSAPP_TEMPLATE_CONCIERGE=concierge_novo
 *   WHATSAPP_TEMPLATE_CONCIERGE_LANG=pt_BR
 *
 * Best-effort: nunca lança.
 * @returns {Promise<{sent:boolean, results?:Array, reason?:string}>}
 */
async function notifyConciergeTeamWhatsApp({ planName, customerName, phone, tripDateStart, tripDateEnd, partySize }) {
    const wa = waConfig();
    const template = process.env.WHATSAPP_TEMPLATE_CONCIERGE || 'concierge_novo';
    const templateLang = process.env.WHATSAPP_TEMPLATE_CONCIERGE_LANG || 'pt_BR';
    const teamNums = String(process.env.CONCIERGE_ALERT_WHATSAPP || '')
        .split(',')
        .map((s) => normalizePhone(s))
        .filter(Boolean);

    if (wa.provider !== 'meta' || !wa.phoneNumberId || !wa.accessToken) {
        console.warn('[whatsapp-concierge] Meta não configurado — aviso à equipe NÃO enviado.');
        return { sent: false, reason: 'not_configured' };
    }
    if (teamNums.length === 0) {
        console.warn('[whatsapp-concierge] CONCIERGE_ALERT_WHATSAPP ausente — aviso à equipe NÃO enviado.');
        return { sent: false, reason: 'no_recipient' };
    }

    const trip = `${formatDate(tripDateStart)} - ${formatDate(tripDateEnd)}`;
    const params = [
        { type: 'text', text: String(planName || 'Concierge') },
        { type: 'text', text: String(customerName || '-') },
        { type: 'text', text: String(phone || '-') },
        { type: 'text', text: trip },
        { type: 'text', text: String(partySize || '-') },
    ];
    const url = `https://graph.facebook.com/${wa.apiVersion}/${wa.phoneNumberId}/messages`;
    const results = [];
    for (const to of teamNums) {
        const body = {
            messaging_product: 'whatsapp',
            to,
            type: 'template',
            template: { name: template, language: { code: templateLang }, components: [{ type: 'body', parameters: params }] },
        };
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { Authorization: `Bearer ${wa.accessToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) {
                const msg = json && json.error ? `${json.error.code} ${json.error.message}` : `HTTP ${res.status}`;
                console.error('[whatsapp-concierge] Meta erro:', msg);
                results.push({ to, sent: false, reason: 'meta_error' });
            } else {
                results.push({ to, sent: true, id: json.messages && json.messages[0] && json.messages[0].id });
            }
        } catch (err) {
            console.error('[whatsapp-concierge] falha de rede:', err.message);
            results.push({ to, sent: false, reason: 'network_error' });
        }
    }
    return { sent: results.some((r) => r.sent), results };
}

module.exports = { sendAlertActivatedWhatsApp, notifyAlertsActivated, notifyConciergeTeamWhatsApp, normalizePhone };
