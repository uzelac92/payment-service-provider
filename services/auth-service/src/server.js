require("dotenv").config();
const app = require("./app")
const {connectAuthMongo, connectUserMongo, getUserConn, getAuthConn} = require("./db/mongo")
const ctrl = require('./controllers/auth.controller');
const {makeRefreshTokenModel, makeUserModel} = require('@uzelac92/payment-models');

const PORT = process.env.PORT || 4000;

(async () => {
    await connectAuthMongo();
    await connectUserMongo();

    const authConn = getAuthConn();
    const userConn = getUserConn();

    const RefreshToken = makeRefreshTokenModel(authConn);
    const User = userConn ? makeUserModel(userConn) : null;

    const resolveUserByEmail = async (email) => {
        if (!User) return null;
        return User.findOne({email: String(email).toLowerCase()})
            .select('+password +secret')
            .lean(false);
    };

    ctrl.init({refreshTokenModel: RefreshToken, resolveUserByEmail});

    app.listen(PORT, () => {
        console.log(`Starting auth-service on port ${PORT}`);
    });
})();