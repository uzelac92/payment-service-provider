require('dotenv').config();
const app = require('./app');
const {connectUserMongo, getUserConn} = require('./db/mongo');
const userCtrl = require('./controllers/user.controller');
const {makeUserModel} = require('@uzelac92/payment-models');

const PORT = process.env.PORT || 4001;

(async () => {
    await connectUserMongo();

    const userConn = getUserConn();
    const User = makeUserModel(userConn);

    await userCtrl.init({user: User});

    app.listen(PORT, () => {
        console.log(`Starting user-service on port: ${PORT}`);
    });
})().catch((e) => {
    console.error('user-service failed to start', e);
    process.exit(1);
});