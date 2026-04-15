const mongoose = require('mongoose');

const portalUserSchema = new mongoose.Schema(
    {
        email: { type: String, required: true, lowercase: true, trim: true, unique: true, index: true },
        passwordHash: { type: String, required: true },
        portalPayload: { type: mongoose.Schema.Types.Mixed, default: {} },
    },
    { timestamps: true }
);

module.exports = mongoose.models.PortalUser || mongoose.model('PortalUser', portalUserSchema);
