require('dotenv').config();
const app = require('./app');
const {connectMondo} = require('./db/mongo');
const userCtrl = require('./controllers/user.controller');
const {makeUserModel} = require('@uzelac92/payment-models');

const PORT = process.env.PORT || 4001;

(async () => {
    console.log("Starting user-service...");
    console.log("Connecting to database...");
    const conn = await connectMondo();
    const User = makeUserModel(conn);
    console.log("Connected to database successfully!");

    console.log("Initializing controller...");
    await userCtrl.init({user: User});

    app.listen(PORT, () => {
        console.log(`STARTED user-service on port ${PORT}`);
    });
})().catch((e) => {
    console.error('user-service failed to start', e);
    process.exit(1);
});