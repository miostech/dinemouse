const Alert = require('./Alert');
const NotificationLog = require('./NotificationLog');

/**
 * Enriquece e reconcilia os alertas do portalPayload com as coleções que o
 * worker mantém (fonte da verdade do monitoramento):
 *
 *  - notificationsCount: nº de notificações de vaga que o cliente recebeu
 *    (do NotificationLog, deduplicando e-mail + WhatsApp do MESMO envio para
 *    não contar em dobro).
 *  - lastNotifiedAt: data/hora da última notificação (do Alert).
 *  - status: reconcilia para 'expired' quando a data da reserva já passou
 *    (o worker faz isso na coleção Alert; aqui refletimos no blob do portal).
 *
 * O portalPayload.alerts é um blob de exibição; a coleção Alert é a que o
 * worker consulta. Casamos por (restaurante, data, refeição, nº de pessoas).
 *
 * @returns {{ alerts: Array, changed: boolean }} alerts enriquecidos e se o
 *   status de algum alerta mudou (para o chamador persistir o blob).
 */
async function enrichAndReconcileAlerts(email, portalPayload) {
    const pp = portalPayload && typeof portalPayload === 'object' ? portalPayload : {};
    const alerts = Array.isArray(pp.alerts) ? pp.alerts : [];
    if (alerts.length === 0) return { alerts, changed: false };

    const userEmail = String(email || '').toLowerCase().trim();
    const key = (r, d, p, m) => `${String(r || '').trim()}|${String(d || '').trim()}|${Number(p) || 0}|${String(m || '').trim()}`;

    // Coleção Alert (status atual + última notificação), por alerta.
    const alertDocs = await Alert.find({ userEmail })
        .select('restaurantName date meal partySize status lastNotifiedAt')
        .lean()
        .catch(() => []);
    const docByKey = new Map();
    for (const d of alertDocs) docByKey.set(key(d.restaurantName, d.date, d.partySize, d.meal), d);

    // Contagem de notificações: 1 evento por (alerta + minuto), somando e-mail e
    // WhatsApp do mesmo disparo como UMA notificação só.
    const events = await NotificationLog.aggregate([
        { $match: { userEmail, status: 'sent' } },
        {
            $group: {
                _id: {
                    r: '$restaurantName',
                    d: '$date',
                    p: '$partySize',
                    m: '$meal',
                    t: { $dateToString: { format: '%Y-%m-%dT%H:%M', date: '$sentAt' } },
                },
            },
        },
        { $group: { _id: { r: '$_id.r', d: '$_id.d', p: '$_id.p', m: '$_id.m' }, n: { $sum: 1 } } },
    ]).catch(() => []);
    const countByKey = new Map();
    for (const e of events) countByKey.set(key(e._id.r, e._id.d, e._id.p, e._id.m), e.n);

    /** Data 'YYYY-MM-DD' já passou? (fim do dia no fuso da Flórida, igual ao worker.) */
    function isPast(dateString) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dateString || ''))) return false;
        const end = new Date(`${dateString}T23:59:59-04:00`);
        return !Number.isNaN(end.getTime()) && Date.now() > end.getTime();
    }

    let changed = false;
    const enriched = alerts.map((a) => {
        if (!a || typeof a !== 'object') return a;
        const k = key(a.restaurant, a.date, a.partySize, a.meal);
        const doc = docByKey.get(k);
        const notificationsCount = countByKey.get(k) || 0;
        const lastNotifiedAt = doc && doc.lastNotifiedAt ? doc.lastNotifiedAt : null;

        // Reconcilia status: se a data passou e o alerta ainda estava ativo/pausado,
        // vira 'expired'. Cancelado/expirado permanecem. Respeita também o worker.
        let status = a.status;
        const workerExpired = doc && doc.status === 'expired';
        if ((status === 'active' || status === 'paused') && (workerExpired || isPast(a.date))) {
            status = 'expired';
        }
        if (status !== a.status) changed = true;

        return { ...a, status, notificationsCount, lastNotifiedAt };
    });

    return { alerts: enriched, changed };
}

module.exports = { enrichAndReconcileAlerts };
