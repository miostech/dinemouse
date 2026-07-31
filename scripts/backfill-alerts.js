#!/usr/bin/env node
/**
 * Backfill: varre todos os PortalUsers existentes e materializa os alertas
 * guardados em portalPayload.alerts[] na coleção Alert.
 *
 * Idempotente — pode rodar quantas vezes quiser (upsert por chave única).
 *
 * Uso:
 *   node scripts/backfill-alerts.js
 */
require('dotenv').config();

const { connectMongo } = require('../lib/mongo');
const PortalUser = require('../lib/PortalUser');
const { syncAlertsFromUser } = require('../lib/syncAlertsFromUser');

async function main() {
    await connectMongo();

    const users = await PortalUser.find({}).lean();
    console.log(`[backfill] ${users.length} usuário(s) encontrados.`);

    let totalUpserted = 0;
    let totalSkipped = 0;

    for (const user of users) {
        const { upserted, skipped } = await syncAlertsFromUser({
            email: user.email,
            portalPayload: user.portalPayload,
            userId: user._id,
        });
        totalUpserted += upserted;
        totalSkipped += skipped;
        if (upserted || skipped) {
            console.log(`[backfill] ${user.email}: +${upserted} alerta(s), ${skipped} ignorado(s)`);
        }
    }

    console.log(`[backfill] Concluído. ${totalUpserted} alerta(s) sincronizado(s), ${totalSkipped} ignorado(s).`);
    process.exit(0);
}

main().catch((err) => {
    console.error('[backfill] Erro:', err);
    process.exit(1);
});
