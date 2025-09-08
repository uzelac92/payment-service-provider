const mongoose = require("mongoose");

let authConn;
let userConn;

async function connectAuthMongo(uri = process.env.MONGO_URI) {
    if (!uri) throw new Error("MongoDB URI is required");

    if (authConn) return authConn;

    const opts = {
        maxPoolSize: 20,
        minPoolSize: 2,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 20000
    }

    authConn = mongoose.createConnection(uri, opts)

    authConn.on("connected", () => {
        console.log("MongoDB Connected");
    })

    authConn.on("disconnected", () => {
        console.warn("MongoDB Disconnected");
    })

    authConn.on("error", (err) => {
        console.error(`MongoDB Connection Error: ${err}`);
    })

    return authConn.asPromise()
}

async function connectUserMongo(uri = process.env.USER_DB_URL) {
    if (!uri) throw new Error("MongoDB URI is required");

    if (userConn) return userConn;

    const opts = {
        maxPoolSize: 20,
        minPoolSize: 2,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 20000
    }

    userConn = mongoose.createConnection(uri, opts)

    userConn.on("connected", () => {
        console.log("MongoDB Connected");
    })

    userConn.on("disconnected", () => {
        console.warn("MongoDB Disconnected");
    })

    userConn.on("error", (err) => {
        console.error(`MongoDB Connection Error: ${err}`);
    })

    return userConn.asPromise()
}

function getAuthConn() {
    return authConn;
}

function getUserConn() {
    return userConn;
}

module.exports = {connectAuthMongo, connectUserMongo, getAuthConn, getUserConn};