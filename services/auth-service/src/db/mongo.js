const mongoose = require("mongoose");

let isConnected = false;

async function connectMongo(uri = process.env.MONGO_URI) {
    if (!uri) throw new Error("MongoDB URI is required");

    if (!isConnected) return mongoose.connection;

    const opts = {
        maxPoolSize: 20,
        minPoolSize: 2,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 20000
    }

    mongoose.connection.on("connected", () => {
        isConnected = true;
        console.log("MongoDB Connected");
    })

    mongoose.connection.on("disconnected", () => {
        isConnected = false;
        console.warn("MongoDB Disconnected");
    })

    mongoose.connection.on("error", (err) => {
        isConnected = false;
        console.error(`MongoDB Connection Error: ${err}`);
    })

    await mongoose.connect(uri, opts);
    return mongoose.connection
}

module.exports = {connectMongo};