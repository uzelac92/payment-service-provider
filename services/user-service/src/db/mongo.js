const mongoose = require('mongoose');

let userConn;

async function connectUserMongo(uri = process.env.MONGO_URI) {
    if (!uri) throw new Error('MONGO_URI is required for user-service');
    if (userConn) return userConn;

    userConn = mongoose.createConnection(uri, {
        maxPoolSize: 20,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 20000,
    });

    userConn.on('connected', () => console.log('[user_db] connected'));
    userConn.on('disconnected', () => console.warn('[user_db] disconnected'));
    userConn.on('error', (err) => console.error('[user_db] error:', err));

    return userConn.asPromise();
}

function getUserConn() {
    return userConn;
}

module.exports = {connectUserMongo, getUserConn};