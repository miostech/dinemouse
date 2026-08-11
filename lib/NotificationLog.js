const mongoose = require('mongoose');

/**
 * Registro de cada notificação de vaga enviada (ou tentada) a um cliente.
 * Alimenta o log de envios do painel de admin: data/hora, canal, status.
 */
const notificationLogSchema = new mongoose.Schema(
    {
        userEmail: { type: String, lowercase: true, trim: true, index: true },
        alertId: { type: mongoose.Schema.Types.ObjectId, ref: 'Alert', default: null },
        restaurantName: { type: String, default: '' },
        date: { type: String, default: '' }, // data da reserva 'YYYY-MM-DD'
        meal: { type: String, default: '' },
        partySize: { type: Number, default: 0 },
        slots: { type: [String], default: [] }, // horários avisados neste envio

        channel: { type: String, enum: ['email', 'whatsapp'], required: true, index: true },
        to: { type: String, default: '' }, // e-mail ou telefone destino
        status: { type: String, enum: ['sent', 'failed', 'skipped'], default: 'sent', index: true },
        reason: { type: String, default: '' }, // motivo em caso de falha/skip
        lang: { type: String, default: 'pt' },

        sentAt: { type: Date, default: () => new Date(), index: true },
    },
    { timestamps: true }
);

// Consulta principal do admin: mais recentes primeiro.
notificationLogSchema.index({ sentAt: -1 });

module.exports = mongoose.models.NotificationLog || mongoose.model('NotificationLog', notificationLogSchema);
