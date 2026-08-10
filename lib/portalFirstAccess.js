const { connectMongo } = require('./mongo');
const PendingOrder = require('./PendingOrder');

/**
 * Revelação ÚNICA da senha temporária logo após a compra, na tela de sucesso.
 *
 * Recebe o session_id da Stripe (que veio na success_url) e devolve as
 * credenciais UMA vez — depois limpa a senha do pedido. O session_id é um token
 * longo e não adivinhável que só o comprador tem (veio no redirect).
 *
 * Estados possíveis:
 *  - ready:false  -> pagamento ainda não processado (front deve tentar de novo).
 *  - ready:true, password:'...'  -> cliente novo: mostra a senha e faz login.
 *  - ready:true, password:null   -> cliente existente / já revelada: sem senha.
 */
async function portalFirstAccess(req, res) {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const sessionId = String(body.sessionId || body.session_id || '').trim();
    if (!sessionId) {
        return res.status(400).json({ ok: false, error: 'missing_session_id' });
    }

    try {
        await connectMongo();
        const pending = await PendingOrder.findOne({ stripeSessionId: sessionId });
        if (!pending) {
            return res.status(404).json({ ok: false, error: 'order_not_found' });
        }

        if (pending.status !== 'fulfilled') {
            // Webhook ainda não processou; o front tenta de novo em instantes.
            return res.status(200).json({ ok: true, ready: false });
        }

        const password = pending.firstAccessPassword || null;
        if (password) {
            // Revelação única: limpa a senha do pedido após entregá-la.
            pending.firstAccessPassword = null;
            await pending.save();
        }

        return res.status(200).json({ ok: true, ready: true, email: pending.email || '', password });
    } catch (err) {
        console.error('portal-first-access:', err);
        return res.status(500).json({ ok: false, error: 'server_error' });
    }
}

module.exports = { portalFirstAccess };
