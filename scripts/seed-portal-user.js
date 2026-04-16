#!/usr/bin/env node
/**
 * Cria ou atualiza um utilizador do portal no MongoDB (coleção portalusers).
 *
 * Uso:
 *   node scripts/seed-portal-user.js
 *   node scripts/seed-portal-user.js camilamayaramota@gmail.com
 *   node scripts/seed-portal-user.js camilamayaramota@gmail.com "A_sua_senha_forte"
 *
 * Requer MONGODB_URI no .env na raiz do projeto.
 * Se não passar senha no 2.º argumento, usa SEED_PORTAL_PASSWORD no .env ou a senha temporária por defeito (altere depois do login).
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { connectMongo } = require('../lib/mongo');
const PortalUser = require('../lib/PortalUser');

const DEFAULT_EMAIL = 'camilamayaramota@gmail.com';
const DEFAULT_PASSWORD = 'DineMouse2026!Cadastro';

const email = String(process.argv[2] || DEFAULT_EMAIL)
    .trim()
    .toLowerCase();
const password = String(process.argv[3] || process.env.SEED_PORTAL_PASSWORD || DEFAULT_PASSWORD);

function buildUserData() {
    return {
        email,
        password,
        name: 'Camila',
        isFirstAccess: true,
        activationDate: null,
        createdAt: new Date().toISOString(),
        plan: {
            type: 'alerts',
            name: 'Plano Individual - Alertas',
            price: 45,
            alerts: 1,
            conciergeName: null,
            conciergeRestaurants: [],
        },
        alerts: [],
    };
}

async function main() {
    if (!email.includes('@')) {
        console.error('E-mail inválido.');
        process.exit(1);
    }
    if (password.length < 8) {
        console.error('A senha deve ter pelo menos 8 caracteres.');
        process.exit(1);
    }

    const userData = buildUserData();
    const portalPayload = JSON.parse(JSON.stringify(userData));
    delete portalPayload.password;

    await connectMongo();
    const passwordHash = await bcrypt.hash(password, 10);

    await PortalUser.findOneAndUpdate(
        { email },
        { $set: { email, passwordHash, portalPayload } },
        { upsert: true, returnDocument: 'after' }
    );

    console.log('');
    console.log('Conta criada/atualizada no MongoDB.');
    console.log('  E-mail:', email);
    console.log('  Senha:', password);
    console.log('');
    console.log('Pode entrar no portal com estes dados ou usar «Recuperar senha».');
    console.log('');

    await mongoose.disconnect();
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
