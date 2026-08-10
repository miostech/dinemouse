require('dotenv').config();

const path = require('path');

/**
 * Configuração central do worker de monitoramento.
 * Ajuste via variáveis de ambiente (.env). Ver worker/README.md.
 */
const config = {
    // ---- Disney: Walt Disney World ----
    wdw: {
        // Host oficial de reservas de restaurantes.
        origin: 'https://disneyworld.disney.go.com',

        // Página do formulário oficial de busca de disponibilidade.
        availabilityFormUrl: 'https://disneyworld.disney.go.com/dine-res/availability/',

        // ID do destino WDW (resort de Orlando) usado pelo Finder.
        destinationId: '80007798',

        // API interna de disponibilidade (confirmada ao vivo):
        //   GET /dine-res/api/availability/{partySize}/{date}/00:00:00,23:59:59
        // Requer BEARER (OneID) + headers: x-function-name=getAvailability,
        // x-disney-internal-dine-vas-eks=true. Ver disney/browser.js.
        availabilityApiPath: '/dine-res/api/availability/',

        // Endpoint interno do Finder para o catálogo de restaurantes do WDW.
        // {date} = 'YYYY-MM-DD'.
        finderCatalogPath:
            '/finder/api/v1/explorer-service/list-ancestor-entities/wdw/80007798;entityType=destination/{date}/dining',
    },

    // ---- Leitura de OTP por e-mail (IMAP) para auto-login ----
    // A Disney envia um código por e-mail após a senha. Com isso configurado,
    // o worker lê o código e completa o login sozinho.
    otpMail: {
        host: process.env.EMAIL_IMAP_HOST || '',
        port: Number(process.env.EMAIL_IMAP_PORT || 993),
        user: process.env.EMAIL_IMAP_USER || '',
        password: process.env.EMAIL_IMAP_PASSWORD || '',
    },

    // ---- Sessão MyDisney (opcional) ----
    // Se fornecidos, o worker tenta logar para obter uma sessão real.
    // Sem eles, é preciso "primar" a sessão manualmente uma vez (headful).
    disney: {
        username: process.env.DISNEY_USERNAME || '',
        password: process.env.DISNEY_PASSWORD || '',
    },

    // ---- Playwright ----
    browser: {
        headless: process.env.WORKER_HEADLESS !== 'false', // default: headless
        // Canal do navegador. Default 'chrome' (Chrome real): o Chromium empacotado
        // do Playwright é bloqueado pelo Akamai da Disney. Defina '' só se quiser
        // forçar o empacotado. No deploy, instale o Chrome no servidor.
        channel: process.env.WORKER_BROWSER_CHANNEL !== undefined ? process.env.WORKER_BROWSER_CHANNEL : 'chrome',
        // Diretório do contexto persistente (cookies/sessão MyDisney).
        sessionDir: process.env.WORKER_SESSION_DIR || path.join(__dirname, '.session'),
        // Onde salvar amostras de JSON interceptado (para calibrar o parser).
        samplesDir: process.env.WORKER_SAMPLES_DIR || path.join(__dirname, 'samples'),
        // Timeout padrão de navegação/espera de resposta (ms).
        navTimeoutMs: Number(process.env.WORKER_NAV_TIMEOUT_MS || 45000),
        // Máx. de tentativas ao receber 428 (proteção Akamai) antes de desistir do ciclo.
        max428Retries: Number(process.env.WORKER_MAX_428_RETRIES || 3),
        // Idade máx. do token BEARER antes de renovar proativamente (ms). Default 20min.
        // O token OneID dura ~24h, mas renovar cedo evita 401 no meio do ciclo.
        bearerMaxAgeMs: Number(process.env.WORKER_BEARER_MAX_AGE_MS || 20 * 60 * 1000),
    },

    // ---- Agendamento ----
    schedule: {
        // Intervalo entre ciclos do loop (ms).
        loopIntervalMs: Number(process.env.WORKER_INTERVAL_MS || 60_000),
        // Gap mínimo antes de re-checar o MESMO alerta (ms).
        recheckMs: Number(process.env.ALERT_RECHECK_MS || 90_000),
        // Backoff quando um alerta dá erro (ms).
        errorBackoffMs: Number(process.env.ALERT_ERROR_BACKOFF_MS || 300_000),
        // Máx. de grupos (data,partySize) processados por ciclo (proteção de rate limit).
        maxGroupsPerCycle: Number(process.env.WORKER_MAX_GROUPS_PER_CYCLE || 8),
        // Pausa entre buscas dentro de um ciclo (ms) para não martelar a Disney.
        betweenSearchesMs: Number(process.env.WORKER_BETWEEN_SEARCHES_MS || 4000),
    },

    // ---- Rate limiting / anti-bloqueio (Akamai) ----
    throttle: {
        // Intervalo mínimo entre QUAISQUER duas chamadas à Disney (ms).
        minIntervalMs: Number(process.env.WORKER_MIN_REQUEST_INTERVAL_MS || 3000),
        // Jitter aleatório somado ao intervalo (ms) — parece menos robótico.
        jitterMs: Number(process.env.WORKER_REQUEST_JITTER_MS || 2000),
        // Bloqueios consecutivos (428/403/0) até abrir o "disjuntor".
        circuitThreshold: Number(process.env.WORKER_CIRCUIT_THRESHOLD || 3),
        // Tempo com o disjuntor aberto (pausa total das chamadas) (ms).
        circuitCooldownMs: Number(process.env.WORKER_CIRCUIT_COOLDOWN_MS || 10 * 60 * 1000),
        // Teto duro de chamadas por hora (0 = sem teto).
        maxPerHour: Number(process.env.WORKER_MAX_REQUESTS_PER_HOUR || 0),
    },

    // ---- Catálogo ----
    catalog: {
        // Caminho do cache local do catálogo (id <-> nome).
        cachePath: process.env.WORKER_CATALOG_PATH || path.join(__dirname, 'data', 'wdw-catalog.json'),
        // Revalidar o catálogo se mais velho que isso (ms). Default 24h.
        ttlMs: Number(process.env.WORKER_CATALOG_TTL_MS || 24 * 60 * 60 * 1000),
    },

    // ---- Notificações ----
    notify: {
        resendApiKey: process.env.RESEND_API_KEY || '',
        resendFrom: process.env.RESEND_FROM || 'Dine Mouse <onboarding@resend.dev>',
        appPublicUrl: process.env.APP_PUBLIC_URL || 'https://www.dinemouse.com',
        // URL do botão "Reservar na Disney" (mesma do botão do template WhatsApp).
        reserveUrl: process.env.RESERVE_URL || 'https://disneyworld.disney.go.com/dine-res/',
        // E-mail do operador p/ avisos de saúde do worker (sessão caiu, bloqueio).
        opsEmail: process.env.OPS_ALERT_EMAIL || '',
        // Cooldown entre avisos repetidos do mesmo tipo ao operador (ms).
        opsCooldownMs: Number(process.env.OPS_ALERT_COOLDOWN_MS || 30 * 60 * 1000),
        // WhatsApp via Meta WhatsApp Cloud API.
        whatsapp: {
            provider: process.env.WHATSAPP_PROVIDER || '', // 'meta' | ''
            phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
            accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
            apiVersion: process.env.WHATSAPP_API_VERSION || 'v21.0',
            // Template pré-aprovado no Meta Business (obrigatório p/ msg proativa).
            templateName: process.env.WHATSAPP_TEMPLATE_NAME || '',
            templateLang: process.env.WHATSAPP_TEMPLATE_LANG || 'pt_BR',
        },
        // DRY_RUN: não envia nada, só loga (para testar o ciclo sem notificar clientes).
        dryRun: process.env.WORKER_DRY_RUN === 'true',
    },

    // ---- Infra ----
    mongoUri: process.env.MONGODB_URI || '',
};

module.exports = config;
