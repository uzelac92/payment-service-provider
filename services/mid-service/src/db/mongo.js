const mongoose = require('mongoose');

let midConn;

async function connectMidMongo(uri = process.env.MONGO_URI) {
    if (!uri) throw new Error("MongoDB URI is missing");
    if (midConn) return midConn;

    midConn = mongoose.createConnection(uri,{
        maxPoolSize: 20,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 20000
    })

    midConn.on('connected', () => console.log('[mid_db] connected'));
    midConn.on('disconnected', () => console.warn('[mid_db] disconnected'));
    midConn.on('error', (err) => console.error('[mid_db] error:', err));

    return midConn.asPromise();
}

function getMidConn() {
    return midConn;
}

module.exports = {connectMidMongo, getMidConn}