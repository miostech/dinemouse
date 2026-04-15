const mongoose = require('mongoose');

async function connectMongo() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        throw new Error('MONGODB_URI não definido');
    }
    if (mongoose.connection.readyState === 1) {
        return;
    }
    await mongoose.connect(uri);
}

module.exports = { connectMongo };
