function parseJsonBody(req) {
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

module.exports = { parseJsonBody };
