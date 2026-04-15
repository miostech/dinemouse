const mongoose = require('mongoose');

const b2bLeadSchema = new mongoose.Schema(
    {
        companyName: { type: String, required: true, trim: true },
        contactName: { type: String, required: true, trim: true },
        email: { type: String, required: true, trim: true },
        phone: { type: String, required: true, trim: true },
        country: { type: String, required: true, trim: true },
        website: { type: String, default: '', trim: true },
        monthlyVolume: { type: String, required: true, trim: true },
        message: { type: String, default: '', trim: true },
    },
    { timestamps: true }
);

module.exports = mongoose.models.B2BLead || mongoose.model('B2BLead', b2bLeadSchema);
