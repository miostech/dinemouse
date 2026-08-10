const config = require('../config');
const { connectMongo } = require('../../lib/mongo');
const Alert = require('../../lib/Alert');
const catalog = require('../disney/catalog');
const { parseAvailability } = require('./parse');
const { dispatchAvailability } = require('../notify/dispatch');
const { notifyOps, clearOpsCooldown } = require('../notify/ops');

// Mapeia refeição PT -> período Disney (EN) e faixa de horário para inferência.
const MEAL_MAP = {
    'café da manhã': { en: 'breakfast', from: '00:00', to: '10:59' },
    'cafe da manha': { en: 'breakfast', from: '00:00', to: '10:59' },
    almoço: { en: 'lunch', from: '11:00', to: '15:59' },
    almoco: { en: 'lunch', from: '11:00', to: '15:59' },
    jantar: { en: 'dinner', from: '16:00', to: '23:59' },
};

function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}

/** Uma oferta serve à refeição desejada? Usa mealPeriod se houver; senão, o horário. */
function matchesMeal(offer, mealPt) {
    const key = String(mealPt || '').toLowerCase().trim();
    const rule = MEAL_MAP[key];
    if (!rule) return true; // sem refeição definida => aceita tudo

    if (offer.mealPeriod) {
        return offer.mealPeriod.toLowerCase().includes(rule.en);
    }
    // Fallback por horário.
    return offer.time >= rule.from && offer.time <= rule.to;
}

/** Garante catálogo fresco; sincroniza via fetch in-page do navegador se necessário. */
async function ensureCatalog(browser) {
    let cat = catalog.loadCache();
    if (!catalog.isFresh(cat)) {
        console.log('[run] Sincronizando catálogo WDW (Finder)...');
        cat = await catalog.syncCatalog((url) => browser.fetchInPage(url).then((r) => r.json), {
            date: catalog.tomorrowISO(),
        });
    }
    return { cat, index: catalog.buildIndex(cat) };
}

/** Marca como 'expired' alertas cuja data já passou. */
async function expirePastAlerts() {
    const now = new Date();
    await Alert.updateMany(
        { status: 'active', resort: 'wdw', expiresAt: { $lt: now } },
        { $set: { status: 'expired' } }
    );
}

/** Resolve e persiste facilityId para um alerta, se ainda não tiver. */
async function ensureFacilityId(alert, index) {
    if (alert.facilityId) return alert.facilityId;
    const match = catalog.resolveRestaurant(alert.restaurantName, index);
    if (match) {
        alert.facilityId = match.id;
        await Alert.updateOne({ _id: alert._id }, { $set: { facilityId: match.id } });
        return match.id;
    }
    // Não encontrado: adia e registra o motivo.
    await Alert.updateOne(
        { _id: alert._id },
        {
            $set: {
                lastError: 'restaurante não encontrado no catálogo',
                nextCheckAt: new Date(Date.now() + config.schedule.errorBackoffMs),
            },
        }
    );
    console.warn(`[run] sem facilityId para "${alert.restaurantName}" (alerta ${alert._id})`);
    return null;
}

/** Agrupa alertas por (data, partySize) — cada grupo = 1 busca na Disney. */
function groupBySearch(alerts) {
    const groups = new Map();
    for (const a of alerts) {
        const key = `${a.date}|${a.partySize}`;
        if (!groups.has(key)) groups.set(key, { date: a.date, partySize: a.partySize, alerts: [] });
        groups.get(key).alerts.push(a);
    }
    return [...groups.values()];
}

/**
 * Executa UM ciclo de monitoramento.
 * @param {import('../disney/browser').DisneyBrowser} browser
 */
async function runCycle(browser) {
    await connectMongo();
    await expirePastAlerts();

    const now = new Date();
    const dueAlerts = await Alert.find({
        status: 'active',
        resort: 'wdw',
        nextCheckAt: { $lte: now },
    })
        .sort({ nextCheckAt: 1 })
        .limit(200);

    if (dueAlerts.length === 0) {
        console.log('[run] Nenhum alerta na fila.');
        return { checked: 0, notified: 0 };
    }

    const { index } = await ensureCatalog(browser);

    // Resolve facilityId de quem ainda não tem.
    const resolvable = [];
    for (const a of dueAlerts) {
        const fid = await ensureFacilityId(a, index);
        if (fid) resolvable.push(a);
    }

    const groups = groupBySearch(resolvable).slice(0, config.schedule.maxGroupsPerCycle);
    console.log(`[run] ${resolvable.length} alerta(s) em ${groups.length} busca(s).`);

    // Renova o token proativamente se estiver velho (evita 401 no meio do ciclo).
    if (typeof browser.ensureFreshBearer === 'function') {
        await browser.ensureFreshBearer();
    }

    let checked = 0;
    let notified = 0;

    for (const group of groups) {
        try {
            const { status, json, via } = await browser.queryAvailability(group.date, group.partySize);

            // Disjuntor aberto: Akamai bloqueando — pausa o ciclo inteiro.
            if (via === 'circuit-open') {
                console.warn('[run] disjuntor aberto (Akamai) — encerrando ciclo até esfriar.');
                await notifyOps(
                    'blocked',
                    'Bloqueio Akamai (disjuntor aberto)',
                    'A Disney começou a bloquear as buscas (428/403). O worker pausou as chamadas para esfriar. ' +
                        'Se persistir, reduza a frequência (WORKER_INTERVAL_MS / WORKER_MAX_GROUPS_PER_CYCLE) ou considere proxies.'
                );
                await backoffGroup(group.alerts, 'disjuntor aberto (Akamai)');
                break;
            }

            if (status === 401 || via === 'needs-login' || via === 'no-bearer') {
                const bearerAgeMin = browser.bearerAt ? Math.round((Date.now() - browser.bearerAt) / 60000) : null;
                const autoLogin = !!(config && config.disney && config.disney.username && config.disney.password);
                console.error(`[run] 401 da Disney (via=${via}, bearer=${browser.bearer ? bearerAgeMin + 'min' : 'ausente'}). Recuperação automática falhou.`);
                const otpBlocked = !!browser.loginBlockedByOtp;
                const imapCfg = !!(config.otpMail && config.otpMail.host && config.otpMail.user && config.otpMail.password);
                await notifyOps(
                    'session_down',
                    otpBlocked ? 'Sessão MyDisney caiu — código (OTP) não resolvido' : 'Sessão MyDisney caiu (401)',
                    (otpBlocked
                        ? 'O auto-login chegou até a senha, a Disney pediu o CÓDIGO por e-mail (OTP), mas o worker não conseguiu concluir.\n' +
                          (imapCfg
                              ? '→ O leitor de e-mail (IMAP) está configurado, mas falhou. Provável causa: senha inválida (no Gmail pessoal use uma APP PASSWORD, não a senha normal) ou o código não chegou a tempo. Veja os logs do worker (linhas [otp]).\n\n'
                              : '→ O leitor de e-mail (IMAP) NÃO está configurado. Preencha EMAIL_IMAP_HOST/USER/PASSWORD (Gmail: App Password) para o worker ler o código sozinho.\n\n')
                        : 'O worker tentou renovar o token e restaurar a sessão, mas não conseguiu — a sessão MyDisney provavelmente expirou de verdade.\n\n') +
                        `Diagnóstico: via=${via}; token=${browser.bearer ? 'presente (' + bearerAgeMin + ' min)' : 'ausente'}; auto-login=${autoLogin ? 'configurado' : 'NÃO configurado'}; otp=${otpBlocked ? 'SIM' : 'não'}; imap=${imapCfg ? 'configurado' : 'não'}.\n\n` +
                        'Enquanto isso: rode `npm run worker:login` (headful) e faça login (marque "lembrar dispositivo" se aparecer).'
                );
                await backoffGroup(group.alerts, 'sessão MyDisney expirada (401)');
                break; // sem login, nenhuma busca vai funcionar
            }
            if (status !== 200) {
                console.warn(`[run] busca ${group.date}/p${group.partySize} status ${status} (${via})`);
                await backoffGroup(group.alerts, `disney status ${status}`);
                continue;
            }

            // Sessão/rede saudáveis de novo: permite avisar imediatamente numa próxima queda.
            clearOpsCooldown('session_down');
            clearOpsCooldown('blocked');

            const availability = parseAvailability(json, group.date); // Map<facilityId, Offer[]>

            for (const alert of group.alerts) {
                checked += 1;
                const offers = (availability.get(alert.facilityId) || []).filter((o) =>
                    matchesMeal(o, alert.meal)
                );

                // Novos slots (dedup por 'YYYY-MM-DD HH:mm').
                const already = new Set(alert.notifiedSlots || []);
                const newSlots = [];
                for (const o of offers) {
                    const key = `${alert.date} ${o.time}`;
                    if (!already.has(key)) {
                        newSlots.push(o);
                        already.add(key);
                    }
                }

                const update = {
                    lastCheckedAt: new Date(),
                    nextCheckAt: new Date(Date.now() + config.schedule.recheckMs),
                    lastError: '',
                    $inc: { checkCount: 1 },
                };

                if (newSlots.length) {
                    await dispatchAvailability(alert, alert.restaurantName, newSlots);
                    notified += 1;
                    update.notifiedSlots = [...already];
                    update.lastNotifiedAt = new Date();
                    console.log(
                        `[run] 🔔 ${alert.userEmail}: ${newSlots.length} vaga(s) em "${alert.restaurantName}" ${alert.date}`
                    );
                }

                const { $inc, ...set } = update;
                await Alert.updateOne({ _id: alert._id }, { $set: set, $inc });
            }
        } catch (err) {
            console.error(`[run] erro no grupo ${group.date}/p${group.partySize}:`, err.message);
            await backoffGroup(group.alerts, err.message);
        }

        await sleep(config.schedule.betweenSearchesMs);
    }

    console.log(`[run] Ciclo concluído: ${checked} checado(s), ${notified} notificado(s).`);
    return { checked, notified };
}

async function backoffGroup(alerts, reason) {
    const ids = alerts.map((a) => a._id);
    await Alert.updateMany(
        { _id: { $in: ids } },
        {
            $set: {
                lastError: String(reason).slice(0, 200),
                nextCheckAt: new Date(Date.now() + config.schedule.errorBackoffMs),
            },
        }
    );
}

module.exports = { runCycle, matchesMeal, groupBySearch };
