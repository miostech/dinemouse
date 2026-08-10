const fs = require('fs');
const config = require('../config');
const { Throttle, CircuitOpenError } = require('../core/throttle');

let chromium;
try {
    ({ chromium } = require('playwright'));
} catch {
    chromium = null;
}

/**
 * DisneyBrowser: controla um Chromium com sessão MyDisney persistente.
 *
 * Estratégia de consulta (fiel ao comportamento validado):
 *  - Mantém um contexto persistente (cookies/sessão + token Akamai).
 *  - A consulta PRIMÁRIA é um fetch executado DENTRO da página (page.evaluate):
 *    mesma origem, mesmos cookies/headers do site => passa pela proteção.
 *  - Se a Disney responder 428 (proteção Akamai), voltamos ao FORMULÁRIO
 *    oficial e refazemos a busca pela interface — isso renova o token — e
 *    interceptamos a resposta real de /dine-res/api/availability/.
 */
class DisneyBrowser {
    constructor() {
        this.context = null;
        this.page = null;
        // Origem para onde a Disney redirecionou (ex.: www.disneyworld.eu por geo).
        this.resolvedOrigin = null;
        // Token BEARER OneID capturado das requisições do próprio site (rotaciona).
        this.bearer = null;
        // Controle de ritmo + disjuntor contra bloqueio Akamai.
        this.throttle = new Throttle();
    }

    /**
     * @param {object} [overrides] força opções (ex.: { headless:false, channel:'chrome' })
     */
    async start(overrides = {}) {
        if (!chromium) {
            throw new Error(
                "playwright não instalado. Rode: npm i playwright && npx playwright install chromium"
            );
        }
        fs.mkdirSync(config.browser.sessionDir, { recursive: true });

        // Remove travas obsoletas do perfil. Sem isso, após um restart (deploy/crash)
        // o Chrome vê o SingletonLock antigo e recusa abrir ("profile appears to be
        // in use"), causando loop de reinício no servidor.
        for (const lock of ['SingletonLock', 'SingletonCookie', 'SingletonSocket']) {
            try {
                fs.rmSync(`${config.browser.sessionDir}/${lock}`, { force: true });
            } catch {
                /* noop */
            }
        }

        const headless = overrides.headless !== undefined ? overrides.headless : config.browser.headless;
        const channel = overrides.channel !== undefined ? overrides.channel : config.browser.channel;

        const launchOpts = {
            headless,
            viewport: { width: 1366, height: 900 },
            locale: 'en-US',
            timezoneId: 'America/New_York',
            userAgent:
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            // Reduz a impressão digital de automação (evita bloqueio Akamai).
            // --disable-http2: o Akamai faz fingerprint do HTTP/2 do Chromium e
            // derruba a conexão (ERR_HTTP2_PROTOCOL_ERROR); forçar HTTP/1.1 contorna.
            args: [
                '--disable-blink-features=AutomationControlled',
                '--no-sandbox',
                '--disable-http2',
                '--disable-dev-shm-usage', // evita crash de /dev/shm pequeno em containers
                '--disable-gpu', // headless não usa GPU; economiza memória no servidor
            ],
            ignoreDefaultArgs: ['--enable-automation'],
            extraHTTPHeaders: {
                'Accept-Language': 'en-US,en;q=0.9,pt-BR;q=0.8',
            },
        };
        if (channel) {
            launchOpts.channel = channel; // ex.: 'chrome'
        }

        this.context = await chromium.launchPersistentContext(config.browser.sessionDir, launchOpts);
        this.context.setDefaultTimeout(config.browser.navTimeoutMs);

        // Esconde navigator.webdriver antes de qualquer script da página.
        await this.context.addInitScript(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
        });

        this.page = this.context.pages()[0] || (await this.context.newPage());

        // Captura o BEARER que o próprio site anexa (auth OneID). Rotaciona, então
        // guardamos sempre o mais recente.
        this.context.on('request', (req) => {
            const auth = req.headers()['authorization'];
            if (auth && /^bearer /i.test(auth)) this.bearer = auth;
        });

        return this;
    }

    async close() {
        try {
            await this.context?.close();
        } catch {
            /* noop */
        }
    }

    /** Espera o site emitir o token BEARER (até ~10s). */
    async _waitBearer() {
        for (let i = 0; i < 10 && !this.bearer; i++) {
            await this.page.waitForTimeout(1000);
        }
        return !!this.bearer;
    }

    /**
     * Salva os cookies da sessão atual no MongoDB (chave 'wdw'). Assim o login
     * feito num lugar (ex.: seu Mac) pode ser restaurado num servidor headless.
     */
    async saveSession() {
        const { connectMongo } = require('../../lib/mongo');
        const WorkerSession = require('../../lib/WorkerSession');
        await connectMongo();
        const state = await this.context.storageState();
        await WorkerSession.updateOne(
            { key: 'wdw' },
            { $set: { key: 'wdw', cookies: state.cookies || [], savedAt: new Date() } },
            { upsert: true }
        );
        console.log(`[session] salva no banco: ${(state.cookies || []).length} cookies.`);
        return (state.cookies || []).length;
    }

    /** Restaura os cookies salvos no banco para o contexto atual. */
    async restoreSession() {
        const { connectMongo } = require('../../lib/mongo');
        const WorkerSession = require('../../lib/WorkerSession');
        await connectMongo();
        const doc = await WorkerSession.findOne({ key: 'wdw' }).lean();
        if (!doc || !Array.isArray(doc.cookies) || doc.cookies.length === 0) {
            console.warn('[session] nada salvo no banco para restaurar.');
            return false;
        }
        await this.context.addCookies(doc.cookies);
        console.log(`[session] restaurada do banco: ${doc.cookies.length} cookies (salva em ${doc.savedAt}).`);
        return true;
    }

    /**
     * Garante uma sessão utilizável: abre o formulário oficial (estabelece
     * cookies/Akamai). Faz login MyDisney se houver credenciais e não estiver logado.
     */
    /**
     * Navega com retry. O ERR_HTTP2_PROTOCOL_ERROR do Akamai costuma ceder numa
     * segunda tentativa e com waitUntil:'commit' (não espera todos os recursos).
     */
    async _goto(url) {
        let lastErr;
        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                await this.page.goto(url, { waitUntil: 'commit', timeout: config.browser.navTimeoutMs });
                await this.page.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => {});
                return true;
            } catch (err) {
                lastErr = err;
                console.warn(`[browser] goto falhou (tentativa ${attempt}): ${err.message.split('\n')[0]}`);
                await this.page.waitForTimeout(2000 * attempt);
            }
        }
        throw lastErr;
    }

    async ensureSession() {
        // Aquece na raiz do domínio (mais leve que a SPA de reservas) para
        // estabelecer cookies/token Akamai antes de tocar no formulário.
        await this._goto(config.wdw.origin + '/');
        await this.page.waitForTimeout(1500);
        await this._goto(config.wdw.availabilityFormUrl);
        await this.page.waitForTimeout(2500);

        // Captura a origem real (a Disney faz geo-redirect, ex.: .eu no Brasil).
        try {
            this.resolvedOrigin = new URL(this.page.url()).origin;
        } catch {
            this.resolvedOrigin = config.wdw.origin;
        }

        // Aguarda o site emitir o token BEARER (necessário p/ a API de disponibilidade).
        await this._waitBearer();

        // Sem bearer? Tenta restaurar a sessão do banco (deploy headless) e recarregar.
        if (!this.bearer) {
            const restored = await this.restoreSession().catch((e) => {
                console.warn('[browser] restoreSession falhou:', e.message);
                return false;
            });
            if (restored) {
                await this._goto(config.wdw.availabilityFormUrl);
                await this._waitBearer();
            }
        }

        if (this.bearer) console.log('[browser] token BEARER capturado.');

        if (await this._isLoggedIn()) return true;

        if (config.disney.username && config.disney.password) {
            const ok = await this._login().catch((e) => {
                console.warn('[browser] login MyDisney falhou:', e.message);
                return false;
            });
            return ok;
        }

        // Sem credenciais: depende de sessão primada manualmente (headful uma vez).
        console.warn(
            '[browser] Sem sessão MyDisney logada e sem DISNEY_USERNAME/PASSWORD. ' +
                'Rode uma vez com WORKER_HEADLESS=false e faça login manual para primar a sessão.'
        );
        return false;
    }

    async _isLoggedIn() {
        // Heurística: presença de um elemento de conta/logout. Ajuste conforme o DOM real.
        try {
            const html = await this.page.content();
            return /log ?out|sign ?out|my ?disney experience|myAccount/i.test(html) &&
                !/sign ?in|log ?in/i.test(await this._headerText());
        } catch {
            return false;
        }
    }

    async _headerText() {
        try {
            return (await this.page.locator('header, [role="banner"]').first().innerText({ timeout: 2000 })) || '';
        } catch {
            return '';
        }
    }

    /**
     * Login MyDisney (best-effort). O fluxo OneID pode mudar/usar iframe;
     * por isso o caminho confiável é primar a sessão manualmente uma vez.
     */
    async _login() {
        const page = this.page;
        // Abre o modal/página de login.
        const signIn = page.getByRole('link', { name: /sign in|log in|entrar/i }).first();
        if (await signIn.isVisible().catch(() => false)) {
            await signIn.click().catch(() => {});
            await page.waitForTimeout(2000);
        }

        // O OneID normalmente vive num iframe.
        const frames = page.frames();
        const target =
            frames.find((f) => /oneid|registerdisney|login/i.test(f.url())) || page.mainFrame();

        const userField = target.locator(
            'input[type="email"], input[name*="loginValue" i], input[name*="username" i]'
        );
        const passField = target.locator('input[type="password"]');

        await userField.first().fill(config.disney.username, { timeout: 8000 });
        await passField.first().fill(config.disney.password, { timeout: 8000 });
        await target
            .locator('button[type="submit"], button:has-text("Log In"), button:has-text("Sign In")')
            .first()
            .click({ timeout: 8000 })
            .catch(() => {});

        await page.waitForTimeout(5000);
        return this._isLoggedIn();
    }

    /**
     * GET de API pela camada de request do contexto (page.request): usa os
     * cookies do navegador (token Akamai _abck/bm_sz), ignora CORS/CSP da página.
     * É "dentro do navegador" (mesma sessão), e foi o mecanismo que retornou 200.
     * @returns {Promise<{status:number, ok:boolean, json:any}>}
     */
    async apiGet(url, extraHeaders = {}) {
        // Respeita ritmo/disjuntor antes de qualquer chamada.
        try {
            await this.throttle.acquire();
        } catch (e) {
            if (e instanceof CircuitOpenError) {
                return { status: 0, ok: false, circuitOpen: true, json: { __circuitOpen: true } };
            }
            throw e;
        }

        try {
            const r = await this.page.request.get(url, {
                headers: { accept: 'application/json, text/plain, */*', ...extraHeaders },
                timeout: config.browser.navTimeoutMs,
            });
            const status = r.status();
            const text = await r.text();
            let json;
            try {
                json = JSON.parse(text);
            } catch {
                json = { __nonJson: true, textSnippet: text.slice(0, 500) };
            }
            // 428/403 = bloqueio Akamai; conta p/ o disjuntor. 2xx = sucesso.
            if (status === 428 || status === 403) this.throttle.recordBlock();
            else if (status >= 200 && status < 300) this.throttle.recordSuccess();
            return { status, ok: status >= 200 && status < 300, json };
        } catch (err) {
            this.throttle.recordBlock();
            return { status: 0, ok: false, json: { __error: String(err) } };
        }
    }

    /** Retrocompat: catálogo usa fetchInPage(url).then(r=>r.json). */
    async fetchInPage(url) {
        return this.apiGet(url);
    }

    /** Origem efetiva das APIs (pós geo-redirect). */
    apiOrigin() {
        return this.resolvedOrigin || config.wdw.origin;
    }

    /** Monta a URL da API interna de disponibilidade (uma data por consulta). */
    availabilityUrl(date, partySize) {
        return (
            this.apiOrigin() +
            config.wdw.availabilityApiPath +
            `${partySize}/${date}/00:00:00,23:59:59`
        );
    }

    /**
     * Headers que o próprio site usa e que fazem a API devolver JSON (e não o
     * HTML de fallback). Confirmados via captura da requisição real do SPA.
     */
    availabilityHeaders() {
        return {
            accept: 'application/json, text/plain, */*',
            authorization: this.bearer || '',
            'x-function-name': 'getAvailability',
            'x-disney-internal-dine-vas-eks': 'true',
            referer: this.apiOrigin() + '/dine-res/search-results',
        };
    }

    /** A resposta é o JSON de disponibilidade esperado (e não o HTML de fallback)? */
    _looksLikeAvailability(json) {
        return !!(
            json &&
            typeof json === 'object' &&
            !json.__nonJson &&
            (json.restaurant || json.diningEvent || json.dinnerShow)
        );
    }

    /**
     * Consulta a disponibilidade para (data, partySize).
     * Replay autorizado (bearer + headers do site) via page.request. Se o token
     * estiver velho/ausente, reaquece a sessão e tenta de novo. Fallback final:
     * dirige o formulário e intercepta a resposta real.
     * @returns {Promise<{status:number, json:any, via:string}>}
     */
    async queryAvailability(date, partySize) {
        const url = this.availabilityUrl(date, partySize);

        // Sem bearer não adianta; sinaliza para (re)aquecer a sessão/login.
        if (!this.bearer) {
            await this._rewarm();
            if (!this.bearer) return { status: 401, json: null, via: 'no-bearer' };
        }

        let res = await this.apiGet(url, this.availabilityHeaders());
        if (res.circuitOpen) return { status: 0, json: null, via: 'circuit-open' };
        if (res.ok && this._looksLikeAvailability(res.json)) {
            return { status: 200, json: res.json, via: 'request' };
        }

        // 401/HTML de fallback => token velho. Reaquece e tenta 1x.
        if (res.status === 401 || (res.ok && !this._looksLikeAvailability(res.json))) {
            await this._rewarm();
            res = await this.apiGet(url, this.availabilityHeaders());
            if (res.ok && this._looksLikeAvailability(res.json)) {
                return { status: 200, json: res.json, via: 'request-rewarm' };
            }
            if (res.status === 401) return { status: 401, json: res.json, via: 'needs-login' };
        }

        // 428 (sec-cp-challenge Akamai): dirige o formulário e intercepta.
        if (res.status === 428 || res.status === 403 || res.status === 0) {
            const intercepted = await this._driveFormAndIntercept(date, partySize).catch((e) => {
                console.warn('[browser] intercept falhou:', e.message);
                return null;
            });
            if (this._looksLikeAvailability(intercepted)) {
                return { status: 200, json: intercepted, via: 'form-intercept' };
            }
        }

        return { status: res.status || 0, json: res.json, via: 'failed' };
    }

    /** Reaquece a sessão: recarrega o formulário para renovar cookies + bearer. */
    async _rewarm() {
        try {
            await this._goto(config.wdw.availabilityFormUrl);
            for (let i = 0; i < 8 && !this.bearer; i++) {
                await this.page.waitForTimeout(1000);
            }
        } catch (e) {
            console.warn('[browser] rewarm falhou:', e.message);
        }
    }

    /**
     * Dirige o formulário oficial (partySize + data + dia todo + todas as
     * localizações) e intercepta a resposta de /dine-res/api/availability/.
     *
     * Os seletores da UI são best-effort — se o DOM mudar, ajuste aqui. O caminho
     * primário (fetchInPage) não depende deles; isto só roda no fallback de 428.
     */
    async _driveFormAndIntercept(date, partySize) {
        const page = this.page;
        await this._goto(config.wdw.availabilityFormUrl);
        await page.waitForTimeout(2500);

        // Prepara a espera pela resposta ANTES de submeter.
        const waitResp = page
            .waitForResponse(
                (r) => r.url().includes(config.wdw.availabilityApiPath) && r.request().method() === 'GET',
                { timeout: config.browser.navTimeoutMs }
            )
            .catch(() => null);

        // Tenta preencher o formulário. Envolto em try porque os seletores variam.
        try {
            await this._selectPartySize(partySize);
            await this._selectDate(date);
            const searchBtn = page
                .getByRole('button', { name: /search|buscar|find|reserve/i })
                .first();
            if (await searchBtn.isVisible().catch(() => false)) {
                await searchBtn.click().catch(() => {});
            }
        } catch (e) {
            console.warn('[browser] preenchimento do formulário parcial:', e.message);
        }

        const resp = await waitResp;
        if (!resp) return null;

        const json = await resp.json().catch(() => null);
        this._saveSample('availability', date, partySize, json);
        return json;
    }

    async _selectPartySize(partySize) {
        const page = this.page;
        const sel = page.locator('select[name*="party" i], select[id*="party" i], select[name*="guest" i]').first();
        if (await sel.isVisible().catch(() => false)) {
            await sel.selectOption(String(partySize)).catch(() => {});
        }
    }

    async _selectDate(date) {
        const page = this.page;
        const input = page.locator('input[type="date"], input[name*="date" i], input[id*="date" i]').first();
        if (await input.isVisible().catch(() => false)) {
            await input.fill(date).catch(() => {});
        }
    }

    _saveSample(kind, date, partySize, json) {
        try {
            fs.mkdirSync(config.browser.samplesDir, { recursive: true });
            fs.writeFileSync(
                `${config.browser.samplesDir}/${kind}-${date}-p${partySize}.sample.json`,
                JSON.stringify(json, null, 2),
                'utf8'
            );
        } catch {
            /* best-effort */
        }
    }
}

module.exports = { DisneyBrowser };
