const Alert = require('./Alert');

// Chave de parque do frontend -> resort interno. Só 'wdw' é monitorado no v1.
const PARK_TO_RESORT = {
    'walt-disney-world': 'wdw',
    disneyland: 'disneyland',
    'disneyland-paris': 'disneyland-paris',
    'tokyo-disney': 'tokyo-disney',
};

/** Normaliza a lista de telefones (pode vir como strings ou objetos {full}). */
function normalizePhones(phones) {
    if (!Array.isArray(phones)) return [];
    return phones
        .map((p) => (p && typeof p === 'object' ? p.full || p.number || '' : String(p || '')))
        .map((s) => s.trim())
        .filter(Boolean);
}

/** Data 'YYYY-MM-DD' -> fim daquele dia (limite natural do alerta). */
function expiryFromDate(dateString) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dateString || ''))) return null;
    // 23:59:59 no fuso da Flórida (EDT ~ -04:00). Aproximação suficiente para expiração.
    const d = new Date(`${dateString}T23:59:59-04:00`);
    return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Cria/atualiza os documentos Alert a partir do payload de um usuário do portal.
 *
 * @param {object} params
 * @param {string} params.email
 * @param {object} params.portalPayload  userData salvo (sem senha)
 * @param {import('mongoose').Types.ObjectId} [params.userId]
 * @returns {Promise<{ upserted: number, skipped: number }>}
 */
async function syncAlertsFromUser({ email, portalPayload, userId = null }) {
    const payload = portalPayload && typeof portalPayload === 'object' ? portalPayload : {};
    const alerts = Array.isArray(payload.alerts) ? payload.alerts : [];
    const phones = normalizePhones(payload.phones);
    const wantsWhatsApp = phones.length > 0; // heurística: tem telefone => quer WhatsApp
    const plan = payload.plan && typeof payload.plan === 'object' ? payload.plan : {};

    let upserted = 0;
    let skipped = 0;

    for (const a of alerts) {
        if (!a || !a.restaurant || !a.date) {
            skipped += 1;
            continue;
        }

        const parkKey = a.park || '';
        const resort = PARK_TO_RESORT[parkKey] || 'wdw';
        // Só WDW é monitorado ativamente no v1; o resto fica marcado.
        const status = resort === 'wdw' ? 'active' : 'unsupported';

        const filter = {
            userEmail: String(email || '').toLowerCase().trim(),
            resort,
            restaurantName: String(a.restaurant).trim(),
            date: String(a.date).trim(),
            meal: a.meal || '',
            partySize: Number(a.partySize) || 2,
        };

        // $setOnInsert nos campos de estado do worker para NÃO resetar
        // agendamento/dedup de um alerta que já existe.
        const update = {
            $set: {
                channels: { email: true, whatsapp: wantsWhatsApp },
                phones,
                parkKey,
                expiresAt: expiryFromDate(a.date),
                planType: plan.type || '',
                planName: plan.name || '',
                lang: a.lang === 'en' || payload.lang === 'en' ? 'en' : 'pt',
                urgent: a.urgent === true,
                sourceUserId: userId,
            },
            $setOnInsert: {
                status,
                nextCheckAt: new Date(),
                notifiedSlots: [],
            },
        };

        try {
            await Alert.updateOne(filter, update, { upsert: true });
            upserted += 1;
        } catch (err) {
            // E11000 (corrida de upsert duplicado) é benigno aqui.
            if (err && err.code === 11000) {
                skipped += 1;
            } else {
                throw err;
            }
        }
    }

    return { upserted, skipped };
}

module.exports = { syncAlertsFromUser, PARK_TO_RESORT };
