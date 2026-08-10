const fs = require('fs');
const path = require('path');
const config = require('../config');

/**
 * Catálogo de restaurantes do WDW.
 *
 * A API de disponibilidade da Disney devolve IDs de facility; o cliente escolhe
 * restaurantes por NOME. Este módulo sincroniza o catálogo via Finder API e
 * oferece um matcher nome -> facilityId.
 *
 * O fetch é injetado (fetchJson) porque o Finder costuma exigir a mesma sessão
 * Akamai da busca — então rodamos de dentro do navegador Playwright.
 */

// ---------- Normalização / matching ----------

// Palavras genéricas que atrapalham o casamento (mantemos restaurant/dining,
// que são distintivos, ex.: "Tokyo Dining").
const STOPWORDS = new Set(['the', 'a', 'an', 'de', 'di', 'by', 'at', 'and', 'co', 'ltd', 'ltd']);

/** Normaliza um nome de restaurante para comparação robusta. */
function normalizeName(name) {
    return String(name || '')
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '') // remove acentos (diacríticos combinantes)
        .replace(/[™®©]/g, '') // marcas ™ ® ©
        .toLowerCase()
        .replace(/\([^)]*\)/g, ' ') // remove anotações entre parênteses "(AK entrance)"
        .replace(/&/g, ' and ')
        .replace(/['’`]/g, '') // apóstrofos
        .replace(/[^a-z0-9]+/g, ' ') // pontuação -> espaço
        .replace(/\s+/g, ' ')
        .trim();
}

/** Tokens significativos (sem stopwords) de um nome. */
function tokens(name) {
    return normalizeName(name)
        .split(' ')
        .filter((t) => t && !STOPWORDS.has(t));
}

// ---------- Cache local ----------

function loadCache() {
    try {
        const raw = fs.readFileSync(config.catalog.cachePath, 'utf8');
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

function saveCache(catalog) {
    const dir = path.dirname(config.catalog.cachePath);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(config.catalog.cachePath, JSON.stringify(catalog, null, 2), 'utf8');
}

function isFresh(catalog) {
    if (!catalog || !catalog.syncedAt) return false;
    return Date.now() - new Date(catalog.syncedAt).getTime() < config.catalog.ttlMs;
}

// ---------- Parser do Finder ----------

/** Extrai o id numérico de um id composto ('90002015;entityType=restaurant'). */
function shortId(rawId) {
    return String(rawId || '').split(';')[0].trim();
}

/** Extrai o tipo de entidade de um id composto ('412554956;entityType=restaurant'). */
function entityType(rawId) {
    const s = String(rawId || '');
    return s.includes('entityType=') ? s.split('entityType=')[1].split(';')[0] : '';
}

/** Deriva uma localização legível a partir do path da url ('/dining/disney-springs/x/'). */
function locationFromUrl(url) {
    const m = String(url || '').match(/\/dining\/([^/]+)\//);
    if (!m) return '';
    return m[1].replace(/-/g, ' ');
}

/**
 * Normaliza a resposta do Finder numa lista de restaurantes.
 * Forma real (WDW): { results: [ { id:'..;entityType=restaurant', name, url, parkIds } ] }.
 * Mantemos fallback tolerante para outras formas. Amostra crua é salva na sync.
 */
function parseFinderResponse(json) {
    if (!json || typeof json !== 'object') return [];

    const list =
        (Array.isArray(json.results) && json.results) ||
        (Array.isArray(json.entities) && json.entities) ||
        (Array.isArray(json.list) && json.list) ||
        (json.data && Array.isArray(json.data.results) && json.data.results) ||
        [];

    const out = [];
    for (const e of list) {
        if (!e || typeof e !== 'object') continue;
        const rawId = e.id || e.entityId || e.facilityId || '';
        const id = shortId(rawId);
        const name = e.name || e.title || e.displayName || '';
        if (!id || !name) continue;

        // O tipo vem do id ('..;entityType=restaurant'). Atenção: e.type aqui é
        // um objeto { facets } — NÃO usar como tipo.
        const type = entityType(rawId) || (typeof e.type === 'string' ? e.type : '');
        // Só entidades reserváveis de gastronomia (restaurant, dining-event, dinner-show).
        if (type && !/restaurant|dining|dinner/i.test(type)) continue;

        out.push({
            id,
            name,
            type: type || 'restaurant',
            facets: e.type && typeof e.type === 'object' ? e.type.facets || '' : '',
            location: locationFromUrl(e.url) || e.locationName || '',
            url: e.url || '',
        });
    }
    return out;
}

// ---------- Sincronização ----------

/**
 * Sincroniza o catálogo do WDW.
 * @param {(url:string)=>Promise<any>} fetchJson  busca autenticada (de preferência dentro do navegador)
 * @param {object} [opts]
 * @param {string} [opts.date] 'YYYY-MM-DD' usado na URL do Finder (default: amanhã)
 * @param {boolean} [opts.force] ignora TTL do cache
 */
async function syncCatalog(fetchJson, opts = {}) {
    const cached = loadCache();
    if (!opts.force && isFresh(cached)) {
        return cached;
    }

    const date = opts.date || tomorrowISO();
    const url = config.wdw.origin + config.wdw.finderCatalogPath.replace('{date}', date);

    const json = await fetchJson(url);

    // Salva amostra crua para calibrarmos o parser se a forma mudar.
    try {
        fs.mkdirSync(config.browser.samplesDir, { recursive: true });
        fs.writeFileSync(
            path.join(config.browser.samplesDir, 'finder-catalog.sample.json'),
            JSON.stringify(json, null, 2),
            'utf8'
        );
    } catch {
        /* amostra é best-effort */
    }

    const restaurants = parseFinderResponse(json);
    const catalog = {
        syncedAt: new Date().toISOString(),
        date,
        count: restaurants.length,
        restaurants,
    };

    if (restaurants.length > 0) {
        saveCache(catalog);
    } else {
        console.warn('[catalog] Finder retornou 0 restaurantes — verifique parseFinderResponse contra worker/samples/finder-catalog.sample.json');
    }
    return catalog;
}

// ---------- Índice de matching ----------

/**
 * Constrói índice de busca a partir do catálogo.
 * @returns {{ exact: Map<string,object>, entries: Array<{r:object,toks:Set<string>}> }}
 */
function buildIndex(catalog) {
    const exact = new Map();
    const entries = [];
    const list = (catalog && catalog.restaurants) || [];
    for (const r of list) {
        exact.set(normalizeName(r.name), r);
        entries.push({ r, toks: new Set(tokens(r.name)) });
    }
    return { exact, entries };
}

/**
 * Resolve o facilityId a partir do nome escolhido pelo cliente.
 * 1) match exato normalizado;
 * 2) sobreposição de tokens (melhor interseção, com desempate pela menor sobra).
 * @returns {{id:string,name:string}|null}
 */
function resolveRestaurant(customerName, index) {
    const norm = normalizeName(customerName);
    if (!norm) return null;

    // Suporte a índice antigo (Map simples), por segurança.
    if (index instanceof Map) {
        return index.get(norm) || null;
    }

    const exact = index.exact.get(norm);
    if (exact) return exact;

    const targetToks = new Set(tokens(customerName));
    if (targetToks.size === 0) return null;

    let best = null;
    let bestScore = 0;
    let bestExtra = Infinity;
    for (const { r, toks } of index.entries) {
        let inter = 0;
        for (const t of targetToks) if (toks.has(t)) inter += 1;
        if (inter === 0) continue;
        const extra = Math.abs(toks.size - targetToks.size);
        if (inter > bestScore || (inter === bestScore && extra < bestExtra)) {
            best = r;
            bestScore = inter;
            bestExtra = extra;
        }
    }

    // Exige cobertura mínima: metade dos tokens do alvo (e ao menos 1).
    const minNeeded = Math.max(1, Math.ceil(targetToks.size / 2));
    return bestScore >= minNeeded ? best : null;
}

/** URL completa da página do restaurante (para deep-link no e-mail). */
function restaurantUrl(entry) {
    const u = entry && entry.url;
    if (!u) return null;
    if (/^https?:\/\//i.test(u)) return u;
    return 'https://disneyworld.disney.go.com' + (u.startsWith('/') ? u : '/' + u);
}

function tomorrowISO() {
    const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return d.toISOString().slice(0, 10);
}

module.exports = {
    normalizeName,
    loadCache,
    saveCache,
    isFresh,
    parseFinderResponse,
    syncCatalog,
    buildIndex,
    resolveRestaurant,
    restaurantUrl,
    tomorrowISO,
};
