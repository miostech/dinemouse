const { connectMongo } = require('../lib/mongo');
const ContactLead = require('../lib/ContactLead');

function parseBody(req) {
    const b = req.body;
    if (b && typeof b === 'object' && !Buffer.isBuffer(b)) {
        return b;
    }
    if (typeof b === 'string') {
        try {
            return JSON.parse(b);
        } catch {
            return null;
        }
    }
    return null;
}

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ ok: false, error: 'method_not_allowed' });
    }

    const body = parseBody(req);
    if (!body) {
        return res.status(400).json({ ok: false, error: 'invalid_body' });
    }

    const { name, email, phone, dates, parks, restaurants, message } = body;

    if (!name || !email || !phone || !dates || !parks) {
        return res.status(400).json({ ok: false, error: 'missing_fields' });
    }

    try {
        await connectMongo();
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
};
