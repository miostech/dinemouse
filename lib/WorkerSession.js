const mongoose = require('mongoose');

/**
 * Sessão do worker persistida no banco (cookies MyDisney/Akamai).
 *
 * Permite primar o login em QUALQUER lugar (ex.: seu Mac) e restaurar num
 * servidor headless (deploy), sem precisar logar de novo na nuvem. O token
 * BEARER é derivado dos cookies ao carregar a página.
 */
const workerSessionSchema = new mongoose.Schema(
    {
        key: { type: String, required: true, unique: true, default: 'wdw', index: true },
        cookies: { type: Array, default: [] }, // formato Playwright (context.cookies())
        savedAt: { type: Date, default: null },
    },
    { timestamps: true }
);

module.exports = mongoose.models.WorkerSession || mongoose.model('WorkerSession', workerSessionSchema);
