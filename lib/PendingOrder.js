const mongoose = require('mongoose');

/**
 * Pedido pendente: guarda os dados do carrinho entre "criar checkout" e a
 * confirmação do pagamento (webhook). O fulfillment (criar usuário + alertas)
 * só acontece quando a Stripe confirma — nunca antes.
 */
const pendingOrderSchema = new mongoose.Schema(
    {
        // Pode vir vazio (concierge não coleta e-mail); o webhook preenche pelo Stripe.
        email: { type: String, default: '', lowercase: true, trim: true, index: true },
        planType: { type: String, required: true },
        // userData no formato portalPayload (com alerts[]) p/ syncAlertsFromUser.
        userData: { type: mongoose.Schema.Types.Mixed, default: {} },
        amountTotalCents: { type: Number, default: 0 },
        currency: { type: String, default: 'brl' },
        stripeSessionId: { type: String, index: true },
        // Senha temporária para REVELAÇÃO ÚNICA na tela de sucesso (cliente novo).
        // É limpa assim que exibida uma vez. Vai também por e-mail.
        firstAccessPassword: { type: String, default: null },
        status: {
            type: String,
            enum: ['pending', 'paid', 'fulfilled', 'failed'],
            default: 'pending',
            index: true,
        },
        fulfilledAt: { type: Date, default: null },
    },
    { timestamps: true }
);

module.exports = mongoose.models.PendingOrder || mongoose.model('PendingOrder', pendingOrderSchema);
