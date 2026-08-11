/**
 * Servidor local: estático + API (leads, portal/auth: registo, login, recuperar senha).
 * Em produção no Vercel: api/*.js. MONGODB_URI no .env.
 * Nome dev-server.js (evita server.js) para a Vercel não tratar o repo como app Express.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const { connectMongo } = require('./lib/mongo');
const ContactLead = require('./lib/ContactLead');
const B2BLead = require('./lib/B2BLead');
const { authPortalRegister } = require('./lib/authPortalRegister');
const { authLogin } = require('./lib/authLogin');
const { authForgotPassword } = require('./lib/authForgotPassword');
const { authResetPassword } = require('./lib/authResetPassword');
const { changePassword } = require('./lib/authChangePassword');
const { updateAlertStatus } = require('./lib/portalAlertStatus');
const { addAlert } = require('./lib/portalAddAlert');
const { portalFirstAccess } = require('./lib/portalFirstAccess');
const { adminData } = require('./lib/adminData');
const { createCheckout } = require('./lib/stripeCheckout');
const { stripeWebhook } = require('./lib/stripeWebhook');
const { createPortalSession } = require('./lib/stripePortal');
const { listReceipts } = require('./lib/stripeReceipts');

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('Defina MONGODB_URI no ambiente (ex.: ficheiro .env na raiz do projeto).');
    process.exit(1);
}

const app = express();
app.use(cors({ origin: true }));

// Webhook da Stripe ANTES do parser JSON: precisa do corpo cru p/ a assinatura.
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

app.use(express.json({ limit: '1mb' }));

// Rotas da API antes do static (evita ambiguidade e garante POST em /api/*)
app.post('/api/contact-leads', async (req, res) => {
    const { name, email, phone, dates, parks, restaurants, message, source } = req.body || {};

    if (!name || !email || !phone || !dates || !parks) {
        return res.status(400).json({ ok: false, error: 'missing_fields' });
    }

    const sourceNorm = source === 'help' ? 'help' : 'modal';

    try {
        const doc = await ContactLead.create({
            source: sourceNorm,
            name,
            email,
            phone,
            dates,
            parks,
            restaurants: restaurants ?? '',
            message: message ?? '',
        });
        return res.status(201).json({ ok: true, id: String(doc._id) });
    } catch (err) {
        console.error('contact-leads:', err);
        return res.status(500).json({ ok: false, error: 'server_error' });
    }
});

app.post('/api/b2b-leads', async (req, res) => {
    const { companyName, contactName, email, phone, country, website, monthlyVolume, message } =
        req.body || {};

    if (!companyName || !contactName || !email || !phone || !country || !monthlyVolume) {
        return res.status(400).json({ ok: false, error: 'missing_fields' });
    }

    try {
        const doc = await B2BLead.create({
            companyName,
            contactName,
            email,
            phone,
            country,
            website: website ?? '',
            monthlyVolume,
            message: message ?? '',
        });
        return res.status(201).json({ ok: true, id: String(doc._id) });
    } catch (err) {
        console.error('b2b-leads:', err);
        return res.status(500).json({ ok: false, error: 'server_error' });
    }
});

app.post('/api/portal/register', authPortalRegister);
app.post('/api/stripe/create-checkout', createCheckout);
app.post('/api/stripe/portal', createPortalSession);
app.post('/api/stripe/receipts', listReceipts);
app.post('/api/auth/login', authLogin);
app.post('/api/auth/forgot-password', authForgotPassword);
app.post('/api/auth/reset-password', authResetPassword);
app.post('/api/auth/change-password', changePassword);
app.post('/api/portal/alert-status', updateAlertStatus);
app.post('/api/portal/add-alert', addAlert);
app.post('/api/portal/first-access', portalFirstAccess);
app.post('/api/admin/data', adminData);

const testePagePath = path.join(__dirname, 'teste.html');
const sendTestePage = (req, res) => {
    res.sendFile(testePagePath);
};
app.get('/teste', sendTestePage);
app.get('/teste/', sendTestePage);

const portalPagePath = path.join(__dirname, 'portal.html');
const sendPortalPage = (req, res) => {
    res.sendFile(portalPagePath);
};
app.get('/portal', sendPortalPage);
app.get('/portal/', sendPortalPage);

const recuperarPagePath = path.join(__dirname, 'recuperar-senha.html');
const sendRecuperarPage = (req, res) => {
    res.sendFile(recuperarPagePath);
};
app.get('/recuperar-senha', sendRecuperarPage);
app.get('/recuperar-senha/', sendRecuperarPage);

app.use(express.static(path.join(__dirname)));

connectMongo()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Servidor em http://localhost:${PORT} (MongoDB ligado)`);
        });
    })
    .catch((err) => {
        console.error('Falha ao ligar ao MongoDB:', err);
        process.exit(1);
    });
