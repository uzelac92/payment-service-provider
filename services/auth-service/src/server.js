require("dotenv").config();
const app = require("./app")
const {connectMongo} = require("./db/mongo")
const ctrl = require('./controllers/auth.controller');
const {makeRefreshTokenModel} = require('@uzelac92/payment-models');
const {resolveUserByEmail} = require("./clients/user.client");

const PORT = process.env.PORT || 4000;

(async () => {
    console.log("Starting auth-service...");
    console.log("Connecting to database...");
    const conn = await connectMongo();
    const RefreshToken = makeRefreshTokenModel(conn);
    console.log("Connected to database successfully!");

    console.log("Initializing controller...");
    ctrl.init({refreshToken: RefreshToken, resolveUserByEmail});

    app.listen(PORT, () => {
        console.log(`STARTED auth-service on port ${PORT}`);
    });
})().catch((e) => {
    console.error('auth-service failed to start', e);
    process.exit(1);
});
