#!/usr/bin/env node
/**
 * Worker de monitoramento Dine Mouse.
 *
 * Modos (via argv[2]):
 *   (vazio) | loop   -> loop contínuo, um ciclo a cada WORKER_INTERVAL_MS
 *   once             -> executa um único ciclo e sai
 *   login            -> abre o Chrome visível p/ login MyDisney; espera ENTER e salva a sessão (local + Mongo)
 *   save-session     -> salva no Mongo a sessão já logada localmente (sem re-login)
 *   test-login       -> valida auto-login (usuário/senha) + leitura de OTP por e-mail, sob demanda
 *   probe DATE PARTY -> uma busca crua p/ calibrar parser/seletores (não toca no DB)
 *                       ex.: node worker/index.js probe 2026-10-10 4
 *   catalog          -> sincroniza o catálogo do WDW e sai
 */
const readline = require('readline');
const config = require('./config');
const { DisneyBrowser } = require('./disney/browser');
const { runCycle } = require('./core/run');
const catalog = require('./disney/catalog');
const { parseAvailability } = require('./core/parse');

const mode = process.argv[2] || 'loop';

let browser = null;
let stopping = false;

async function withBrowser(fn) {
    browser = await new DisneyBrowser().start();
    await browser.ensureSession();
    try {
        return await fn(browser);
    } finally {
        await browser.close();
    }
}

async function loop() {
    browser = await new DisneyBrowser().start();
    await browser.ensureSession();
    console.log(`[worker] loop iniciado (intervalo ${config.schedule.loopIntervalMs}ms).`);

    while (!stopping) {
        try {
            await runCycle(browser);
        } catch (err) {
            console.error('[worker] erro no ciclo:', err);
        }
        if (stopping) break;
        await new Promise((r) => setTimeout(r, config.schedule.loopIntervalMs));
    }
    await browser.close();
}

async function once() {
    await withBrowser((b) => runCycle(b));
}

/** Pergunta no terminal e resolve quando o usuário aperta ENTER. */
function waitForEnter(question) {
    return new Promise((resolve) => {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        rl.question(question, () => {
            rl.close();
            resolve();
        });
    });
}

/**
 * Abre o Chrome VISÍVEL para você logar na conta MyDisney. Mantém a janela
 * aberta até você apertar ENTER no terminal — então salva a sessão e sai.
 */
async function login() {
    const channel = config.browser.channel || 'chrome';
    console.log('[login] Abrindo o Chrome... (canal:', channel + ')');
    browser = await new DisneyBrowser().start({ headless: false, channel });

    // Vai para a página de reservas (tem o botão de login MyDisney).
    await browser._goto(config.wdw.availabilityFormUrl);
    try {
        browser.resolvedOrigin = new URL(browser.page.url()).origin;
    } catch {
        /* noop */
    }

    console.log('\n============================================================');
    console.log('  Faça login na sua conta MyDisney na janela do Chrome.');
    console.log('  (procure "Sign In" / "Log In" no topo do site)');
    console.log('  A janela vai FICAR ABERTA. Quando terminar o login,');
    console.log('  volte aqui e pressione ENTER para salvar a sessão.');
    console.log('============================================================\n');

    await waitForEnter('>> Pressione ENTER depois de logar... ');

    const logged = await browser._isLoggedIn().catch(() => false);
    console.log(logged ? '[login] Sessão detectada como logada. ✅' : '[login] Não confirmei o login automaticamente, mas a sessão foi salva mesmo assim.');
    console.log('[login] Sessão local salva em', config.browser.sessionDir);

    // Persiste no banco p/ o servidor de produção restaurar (deploy headless).
    try {
        await browser.saveSession();
    } catch (e) {
        console.warn('[login] não consegui salvar a sessão no banco:', e.message);
    }

    await browser.close();
}

/** Salva no banco a sessão já logada (usa o .session local). Sem re-login. */
async function saveSession() {
    await withBrowser(async (b) => {
        const logged = await b._isLoggedIn().catch(() => false);
        if (!b.bearer && !logged) {
            console.warn('[save-session] a sessão local não parece logada — rode `worker:login` primeiro.');
        }
        await b.saveSession();
    });
}

async function probe() {
    const date = process.argv[3];
    const party = Number(process.argv[4] || 2);
    if (!date) {
        console.error('Uso: node worker/index.js probe YYYY-MM-DD [partySize]');
        process.exit(1);
    }
    await withBrowser(async (b) => {
        console.log(`[probe] Consultando ${date} para ${party} pessoa(s)...`);
        const { status, json, via } = await b.queryAvailability(date, party);
        console.log(`[probe] status=${status} via=${via}`);
        try {
            require('fs').mkdirSync(config.browser.samplesDir, { recursive: true });
            require('fs').writeFileSync(
                `${config.browser.samplesDir}/availability-${date}-p${party}.sample.json`,
                JSON.stringify(json, null, 2)
            );
        } catch { /* best-effort */ }
        const map = parseAvailability(json, date);
        console.log(`[probe] facilities com oferta: ${map.size}`);
        let shown = 0;
        for (const [fid, offers] of map) {
            const meals = [...new Set(offers.map((o) => o.mealPeriod))].join('/');
            console.log(`  ${fid}: ${offers.length} horários (${meals}) ex: ${offers.slice(0, 5).map((o) => o.time).join(', ')}`);
            if (++shown >= 10) { console.log(`  ... (+${map.size - shown} restaurantes)`); break; }
        }
        console.log(`[probe] JSON cru salvo em ${config.browser.samplesDir}/`);
    });
}

async function syncCatalog() {
    await withBrowser(async (b) => {
        const cat = await catalog.syncCatalog((url) => b.fetchInPage(url).then((r) => r.json), {
            date: catalog.tomorrowISO(),
            force: true,
        });
        console.log(`[catalog] ${cat.count} restaurante(s) sincronizado(s) -> ${config.catalog.cachePath}`);
    });
}

/**
 * Valida o auto-login (usuário/senha) + leitura de OTP por e-mail, sob demanda.
 * Usa uma sessão EFÊMERA para forçar estado deslogado (exercita o login de
 * verdade). Se tudo der certo, salva a sessão no banco (também re-prima a prod).
 */
async function testLogin() {
    const os = require('os');
    const path = require('path');
    const channel = config.browser.channel || 'chrome';
    const imapCfg = !!(config.otpMail.host && config.otpMail.user && config.otpMail.password);

    console.log('=== test-login: validando auto-login + OTP ===');
    console.log('DISNEY_USERNAME/PASSWORD:', config.disney.username && config.disney.password ? 'configurado ✅' : '❌ FALTA');
    console.log('IMAP (leitura de OTP):', imapCfg ? 'configurado ✅' : '⚠️ não configurado (OTP por e-mail não será lido)');
    if (!config.disney.username || !config.disney.password) {
        console.error('Sem DISNEY_USERNAME/PASSWORD não há o que testar. Abortando.');
        return;
    }

    const tmpDir = path.join(os.tmpdir(), 'dm-test-login-' + process.pid);
    browser = await new DisneyBrowser().start({ sessionDir: tmpDir, headless: config.browser.headless, channel });
    try {
        await browser._goto(config.wdw.origin + '/');
        await browser.page.waitForTimeout(1500);
        await browser._goto(config.wdw.availabilityFormUrl);
        await browser.page.waitForTimeout(2500);
        try {
            browser.resolvedOrigin = new URL(browser.page.url()).origin;
        } catch {
            /* noop */
        }
        await browser._waitBearer();
        console.log('estado inicial:', (await browser._isLoggedIn().catch(() => false)) ? 'já logado' : 'deslogado (bom p/ testar)');

        const ok = await browser._login().catch((e) => {
            console.error('login erro:', e.message);
            return false;
        });

        console.log('\n--- RESULTADO ---');
        console.log('login:', ok ? '✅ OK' : '❌ falhou');
        console.log('OTP pedido:', browser.loginBlockedByOtp ? '⚠️ SIM e não resolvido (veja linhas [otp] acima)' : 'não / resolvido');
        console.log('token BEARER:', browser.bearer ? '✅ capturado' : '❌ ausente');

        if (browser.bearer) {
            const date = new Date(Date.now() + 50 * 86400000).toISOString().slice(0, 10);
            const { status, via } = await browser.queryAvailability(date, 2);
            console.log(`consulta de disponibilidade (${date}, 2 pessoas): status=${status} via=${via}`);
            if (status === 200) {
                console.log('\n🎉 TUDO FUNCIONANDO — salvando a sessão no banco (também re-prima a produção).');
                await browser.saveSession().catch((e) => console.warn('saveSession:', e.message));
            } else {
                console.warn('\n⚠️ Login OK mas a consulta não retornou 200 — verifique os logs acima.');
            }
        }
    } finally {
        await browser.close();
    }
}

function handleSignals() {
    const shutdown = async (sig) => {
        console.log(`\n[worker] ${sig} recebido, encerrando...`);
        stopping = true;
        try {
            await browser?.close();
        } catch {
            /* noop */
        }
        setTimeout(() => process.exit(0), 1500);
    };
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
}

(async () => {
    handleSignals();
    try {
        if (mode === 'once') await once();
        else if (mode === 'login' || mode === 'prime') await login();
        else if (mode === 'save-session') await saveSession();
        else if (mode === 'test-login') await testLogin();
        else if (mode === 'probe') await probe();
        else if (mode === 'catalog') await syncCatalog();
        else await loop();
        if (mode !== 'loop') process.exit(0);
    } catch (err) {
        console.error('[worker] fatal:', err);
        process.exit(1);
    }
})();
