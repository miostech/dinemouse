const mongoose = require('mongoose');

const contactLeadSchema = new mongoose.Schema(
    {
        source: {
            type: String,
            enum: ['modal', 'help'],
            default: 'modal',
            trim: true,
        },
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, trim: true },
        phone: { type: String, required: true, trim: true },
        dates: { type: String, required: true, trim: true },
        parks: { type: String, required: true, trim: true },
        restaurants: { type: String, default: '', trim: true },
        message: { type: String, default: '', trim: true },
    },
    { timestamps: true }
);

module.exports = mongoose.models.ContactLead || mongoose.model('ContactLead', contactLeadSchema);
