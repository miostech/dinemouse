const mongoose = require('mongoose');

/**
 * Alerta de disponibilidade comprado por um cliente.
 *
 * É a FONTE DA VERDADE do worker de monitoramento. Cada alerta representa
 * a intenção de monitorar UM restaurante + UMA data + UM tamanho de grupo.
 * Os alertas são criados/atualizados a partir da compra (authPortalRegister)
 * e do backfill dos PortalUsers existentes.
 *
 * Campos de agendamento (nextCheckAt/lastCheckedAt) e de deduplicação
 * (notifiedSlots) vivem aqui — separados do PortalUser.portalPayload, que é
 * um blob Mixed impróprio para as consultas/mutações frequentes do worker.
 */
const alertSchema = new mongoose.Schema(
    {
        // Dono do alerta
        userEmail: { type: String, required: true, lowercase: true, trim: true, index: true },

        // Canais de notificação desejados
        channels: {
            email: { type: Boolean, default: true },
            whatsapp: { type: Boolean, default: false },
        },
        phones: { type: [String], default: [] },

        // Resort. No v1 só 'wdw' é monitorado de fato. Os demais ficam
        // registrados mas com status 'unsupported' para não sumirem.
        resort: {
            type: String,
            enum: ['wdw', 'disneyland', 'disneyland-paris', 'tokyo-disney'],
            default: 'wdw',
            index: true,
        },

        // Chave de parque vinda do frontend (ex.: 'walt-disney-world'). Informativo.
        parkKey: { type: String, default: '' },

        // Nome do restaurante escolhido pelo cliente. Fonte para casar com o
        // facilityId da Disney via catálogo.
        restaurantName: { type: String, required: true, trim: true },

        // ID de facility da Disney, resolvido pelo catálogo (cache). Pode ficar
        // vazio até o worker resolver na primeira execução.
        facilityId: { type: String, default: '', index: true },

        // Parâmetros da busca
        date: { type: String, required: true }, // 'YYYY-MM-DD'
        meal: { type: String, default: '' }, // 'Café da Manhã' | 'Almoço' | 'Jantar' (filtro opcional)
        partySize: { type: Number, default: 2, min: 1, max: 20 },

        // Ciclo de vida
        status: {
            type: String,
            enum: ['active', 'paused', 'cancelled', 'expired', 'fulfilled', 'unsupported'],
            default: 'active',
            index: true,
        },
        expiresAt: { type: Date }, // date + activeDays; após isso vira 'expired'

        // Agendamento do worker
        lastCheckedAt: { type: Date, default: null },
        nextCheckAt: { type: Date, default: () => new Date(), index: true },
        checkCount: { type: Number, default: 0 },
        lastError: { type: String, default: '' },

        // Deduplicação: slots (data+hora) já avisados, ex.: '2026-10-10 18:30'.
        // Evita reenviar o mesmo horário repetidamente.
        notifiedSlots: { type: [String], default: [] },
        lastNotifiedAt: { type: Date, default: null },

        // Idioma do cliente (define o idioma do e-mail/WhatsApp de vaga encontrada).
        lang: { type: String, enum: ['pt', 'en'], default: 'pt' },

        // Informativo / rastreabilidade
        planType: { type: String, default: '' },
        planName: { type: String, default: '' },
        sourceUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'PortalUser', default: null },
    },
    { timestamps: true }
);

// Um alerta é único por (usuário, restaurante, data, refeição, tamanho de grupo).
// Assim reimportar/backfill não duplica.
alertSchema.index(
    { userEmail: 1, resort: 1, restaurantName: 1, date: 1, meal: 1, partySize: 1 },
    { unique: true }
);

// Consulta principal do worker: alertas ativos de um resort prontos para checar.
alertSchema.index({ status: 1, resort: 1, nextCheckAt: 1 });

module.exports = mongoose.models.Alert || mongoose.model('Alert', alertSchema);
