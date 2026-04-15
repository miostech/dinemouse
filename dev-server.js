/**
 * Servidor local: site estático + POST /api/contact-leads (MongoDB).
 * Em produção no Vercel: api/contact-leads.js. MONGODB_URI no .env.
 * Nome dev-server.js (evita server.js) para a Vercel não tratar o repo como app Express.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const { connectMongo } = require('./lib/mongo');
const ContactLead = require('./lib/ContactLead');

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('Defina MONGODB_URI no ambiente (ex.: ficheiro .env na raiz do projeto).');
    process.exit(1);
}

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: '32kb' }));
app.use(express.static(path.join(__dirname)));

app.post('/api/contact-leads', async (req, res) => {
    const { name, email, phone, dates, parks, restaurants, message } = req.body || {};

    if (!name || !email || !phone || !dates || !parks) {
        return res.status(400).json({ ok: false, error: 'missing_fields' });
    }

    try {
        const doc = await ContactLead.create({
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
