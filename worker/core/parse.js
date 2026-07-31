/**
 * Parser da resposta de /dine-res/api/availability/{party}/{date}/00:00:00,23:59:59
 *
 * Schema real (confirmado com resposta ao vivo do WDW):
 *   {
 *     restaurant:  { "<facilityId>": { id, name, ancestorLocationParkResort, offers, ... }, ... },
 *     diningEvent: { ... },   // mesmo formato
 *     dinnerShow:  { ... },   // mesmo formato
 *     statusCode:  200
 *   }
 *
 * Onde entry.offers é um OBJETO keyado por data:
 *   offers["2026-09-26"] = [
 *     { mealPeriodType:"Lunch", startTime, endTime,
 *       offersByAccessibility: [ { accessibilityLevel:"GENERAL",
 *         offers: [ { offerId, time:"12:30:00", label:"12:30 PM" }, ... ] } ] },
 *     { mealPeriodType:"Dinner", ... }
 *   ]
 */

function shortId(rawId) {
    return String(rawId || '').split(';')[0].trim();
}

/** Normaliza um horário para 'HH:mm' (aceita '18:30:00', '6:30 PM', ISO). */
function normalizeTime(raw) {
    if (!raw) return '';
    const s = String(raw).trim();

    const iso = s.match(/T(\d{2}):(\d{2})/);
    if (iso) return `${iso[1]}:${iso[2]}`;

    const ampm = s.match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])$/);
    if (ampm) {
        let h = parseInt(ampm[1], 10);
        const pm = /p/i.test(ampm[3]);
        if (pm && h < 12) h += 12;
        if (!pm && h === 12) h = 0;
        return `${String(h).padStart(2, '0')}:${ampm[2]}`;
    }

    const hm = s.match(/^(\d{1,2}):(\d{2})/);
    if (hm) return `${hm[1].padStart(2, '0')}:${hm[2]}`;

    return s;
}

/** Extrai as ofertas de UM restaurante para uma data. */
function offersForDate(entry, date) {
    const byDate = entry && entry.offers && typeof entry.offers === 'object' ? entry.offers : null;
    if (!byDate) return [];

    // Usa a data pedida; se ausente, a primeira data presente no objeto.
    const blocks = byDate[date] || byDate[Object.keys(byDate)[0]] || [];
    if (!Array.isArray(blocks)) return [];

    const out = [];
    for (const block of blocks) {
        const meal = block.mealPeriodType || block.type || '';
        const accs = Array.isArray(block.offersByAccessibility) ? block.offersByAccessibility : [];
        // Prefere nível GENERAL; senão o primeiro grupo.
        const group = accs.find((a) => /general/i.test(a.accessibilityLevel || '')) || accs[0];
        const offers = group && Array.isArray(group.offers) ? group.offers : [];
        for (const o of offers) {
            const time = normalizeTime(o.time || o.label || '');
            if (!time) continue;
            out.push({ time, mealPeriod: meal, offerId: o.offerId || '', label: o.label || '' });
        }
    }
    return out;
}

/**
 * Normaliza a resposta inteira em Map<facilityId, Offer[]> para a data pedida.
 * @param {object} json
 * @param {string} date 'YYYY-MM-DD'
 */
function parseAvailability(json, date) {
    const map = new Map();
    if (!json || typeof json !== 'object') return map;

    const categories = [json.restaurant, json.diningEvent, json.dinnerShow];
    for (const cat of categories) {
        if (!cat || typeof cat !== 'object') continue;
        for (const [rawId, entry] of Object.entries(cat)) {
            if (!entry || typeof entry !== 'object') continue;
            const id = shortId(entry.id || rawId);
            if (!id) continue;
            const offers = offersForDate(entry, date);
            if (offers.length) {
                map.set(id, (map.get(id) || []).concat(offers));
            }
        }
    }
    return map;
}

module.exports = { parseAvailability, normalizeTime, shortId, offersForDate };
