const config = require('../config');

let ImapFlow;
try {
    ({ ImapFlow } = require('imapflow'));
} catch {
    ImapFlow = null;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Extrai o código de verificação de um texto. Prioriza 6 dígitos perto de uma
 * palavra-chave (code/código/verificação); senão, um 6 dígitos isolado.
 */
function extractCode(text) {
    if (!text) return null;
    const s = String(text);
    const near = s.match(/(?:code|c[oó]digo|verif\w*|one[- ]?time|acesso|passcode|pin)[^0-9]{0,24}(\d{6})/i);
    if (near) return near[1];
    const six = s.match(/(?<!\d)(\d{6})(?!\d)/);
    return six ? six[1] : null;
}

/** Uma tentativa de leitura no IMAP: procura o código mais recente da Disney. */
async function tryFetchOnce(c, sinceMs) {
    const client = new ImapFlow({
        host: c.host,
        port: c.port,
        secure: true,
        auth: { user: c.user, pass: c.password },
        logger: false,
    });
    await client.connect();
    try {
        const lock = await client.getMailboxLock('INBOX');
        try {
            const since = new Date((sinceMs || Date.now()) - 90 * 1000); // 90s de folga
            let bestCode = null;
            let bestDate = 0;
            for await (const msg of client.fetch({ since }, { envelope: true, source: true, internalDate: true })) {
                const env = msg.envelope || {};
                const from = (env.from || []).map((a) => `${a.address || ''} ${a.name || ''}`).join(' ');
                const subject = env.subject || '';
                const isDisney = /disney|registerdisney|go\.com/i.test(from) || /disney/i.test(subject);
                const looksOtp = /code|c[oó]digo|verif|one[- ]?time|acesso|passcode|pin|security/i.test(subject);
                if (!isDisney && !looksOtp) continue;

                const dt = msg.internalDate ? new Date(msg.internalDate).getTime() : 0;
                if (sinceMs && dt < sinceMs - 90 * 1000) continue;

                const body = msg.source ? msg.source.toString('utf8') : '';
                const code = extractCode(subject) || extractCode(body);
                if (code && dt >= bestDate) {
                    bestCode = code;
                    bestDate = dt;
                }
            }
            return bestCode;
        } finally {
            lock.release();
        }
    } finally {
        await client.logout().catch(() => {});
    }
}

/** O erro do IMAP é de autenticação (senha errada / precisa App Password)? */
function isAuthError(e) {
    if (!e) return false;
    if (e.authenticationFailed || e.serverResponseCode === 'AUTHENTICATIONFAILED') return true;
    const t = `${e.responseText || ''} ${e.message || ''}`.toLowerCase();
    return /authenticationfailed|invalid credentials|application-specific password|username and password not accepted|auth\w*\s*fail|\[auth\]/i.test(t);
}

/** Loga uma orientação clara quando o IMAP recusa a autenticação. */
function logAuthHelp(e) {
    console.error('[otp] ❌ O e-mail RECUSOU a autenticação IMAP (credencial inválida).');
    console.error('[otp]    Para Gmail pessoal a senha NORMAL não funciona — use uma APP PASSWORD:');
    console.error('[otp]    Conta Google → Segurança → Verificação em 2 etapas → Senhas de app → gere uma (16 caracteres)');
    console.error('[otp]    e coloque em EMAIL_IMAP_PASSWORD. (IMAP estar "ligado" não muda isso.)');
    console.error('[otp]    Detalhe do servidor:', (e && (e.responseText || e.message)) || 'sem detalhe');
}

/**
 * Busca (com polling) o código OTP mais recente no e-mail. O e-mail chega alguns
 * segundos após o site pedir o código, por isso o polling.
 * @returns {Promise<string|null>}
 */
async function fetchOtpCode({ sinceMs, timeoutMs = 120000, intervalMs = 6000 } = {}) {
    const c = config.otpMail;
    if (!ImapFlow) {
        console.warn('[otp] imapflow não instalado.');
        return null;
    }
    if (!c.host || !c.user || !c.password) {
        console.warn('[otp] IMAP não configurado (EMAIL_IMAP_HOST/USER/PASSWORD) — pulando leitura de OTP.');
        return null;
    }

    const end = Date.now() + timeoutMs;
    while (Date.now() < end) {
        try {
            const code = await tryFetchOnce(c, sinceMs);
            if (code) {
                console.log('[otp] código encontrado no e-mail.');
                return code;
            }
        } catch (e) {
            // Erro de autenticação não se resolve tentando de novo — para já com dica clara.
            if (isAuthError(e)) {
                logAuthHelp(e);
                return null;
            }
            console.warn('[otp] erro IMAP (vou tentar de novo):', e.message);
        }
        await sleep(intervalMs);
    }
    console.warn('[otp] código não chegou no e-mail dentro do tempo.');
    return null;
}

module.exports = { fetchOtpCode, extractCode };
