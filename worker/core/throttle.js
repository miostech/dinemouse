const config = require('../config');

/** Erro sinalizando que o disjuntor está aberto (chamadas pausadas). */
class CircuitOpenError extends Error {
    constructor(msUntilClose) {
        super(`circuito aberto (${Math.ceil(msUntilClose / 1000)}s restantes)`);
        this.name = 'CircuitOpenError';
        this.msUntilClose = msUntilClose;
    }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Controla o ritmo das chamadas à Disney para não apanhar do Akamai:
 *  - intervalo mínimo entre chamadas (+ jitter aleatório);
 *  - teto de chamadas por hora (opcional);
 *  - "disjuntor": após N bloqueios seguidos (428/403/erro), pausa tudo por um
 *    período; depois entra em half-open e tenta 1 vez.
 *
 * OBS: usa índice p/ variar o jitter (Math.random é bloqueado no ambiente do
 * agente; aqui rodamos em Node normal, mas evitamos depender dele mesmo assim).
 */
class Throttle {
    constructor(opts = {}) {
        this.min = opts.minIntervalMs ?? config.throttle.minIntervalMs;
        this.jitter = opts.jitterMs ?? config.throttle.jitterMs;
        this.threshold = opts.circuitThreshold ?? config.throttle.circuitThreshold;
        this.cooldown = opts.circuitCooldownMs ?? config.throttle.circuitCooldownMs;
        this.maxPerHour = opts.maxPerHour ?? config.throttle.maxPerHour;

        this.lastCallAt = 0;
        this.consecutiveBlocks = 0;
        this.openUntil = 0; // timestamp; >0 e no futuro => aberto
        this.callTimes = []; // timestamps da última hora
        this._seq = 0;
    }

    _jitter() {
        // Pseudo-jitter determinístico-por-sequência (não depende de Math.random).
        this._seq = (this._seq + 1) % 997;
        return Math.floor((this._seq / 997) * this.jitter);
    }

    isOpen(now) {
        return this.openUntil > now;
    }

    _pruneHour(now) {
        const cutoff = now - 3_600_000;
        this.callTimes = this.callTimes.filter((t) => t > cutoff);
    }

    /**
     * Chame ANTES de cada requisição à Disney. Aguarda o intervalo mínimo e
     * respeita o disjuntor/teto horário. Lança CircuitOpenError se aberto.
     */
    async acquire(now = Date.now()) {
        // Disjuntor aberto?
        if (this.isOpen(now)) {
            throw new CircuitOpenError(this.openUntil - now);
        }

        // Teto horário.
        this._pruneHour(now);
        if (this.maxPerHour > 0 && this.callTimes.length >= this.maxPerHour) {
            const waitMs = this.callTimes[0] + 3_600_000 - now;
            throw new CircuitOpenError(Math.max(0, waitMs));
        }

        // Intervalo mínimo + jitter.
        const elapsed = now - this.lastCallAt;
        const need = this.min + this._jitter();
        if (this.lastCallAt && elapsed < need) {
            await sleep(need - elapsed);
        }

        const stamp = Date.now();
        this.lastCallAt = stamp;
        this.callTimes.push(stamp);
    }

    /** Chame após uma resposta boa (2xx). */
    recordSuccess() {
        this.consecutiveBlocks = 0;
        this.openUntil = 0;
    }

    /** Chame após um bloqueio (428/403/timeout/erro de rede). Pode abrir o disjuntor. */
    recordBlock(now = Date.now()) {
        this.consecutiveBlocks += 1;
        if (this.consecutiveBlocks >= this.threshold) {
            this.openUntil = now + this.cooldown;
            console.warn(
                `[throttle] ${this.consecutiveBlocks} bloqueios seguidos — disjuntor ABERTO por ${Math.round(
                    this.cooldown / 60000
                )} min.`
            );
        }
    }
}

module.exports = { Throttle, CircuitOpenError };
