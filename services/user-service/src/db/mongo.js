const mongoose = require('mongoose');

let isConnected = false;

async function connectMondo(uri = process.env.MONGO_URI) {
    if (!uri) throw new Error('MONGO_URI is required for user-service');
    if (isConnected) return mongoose.connection;

    const opts = {
        maxPoolSize: 20,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 20000,
    };

    mongoose.connection.on('connected', () => {
        isConnected = true;
        console.log('[user_db] connected');
    });
    mongoose.connection.on('disconnected', () => {
        isConnected = false;
        console.warn('[user_db] disconnected')
    });
    mongoose.connection.on('error', (err) => {
        isConnected = false;
        console.error('[user_db] error:', err)
    });

    await mongoose.connect(uri, opts)
    return mongoose.connection;
}


module.exports = {connectMondo};