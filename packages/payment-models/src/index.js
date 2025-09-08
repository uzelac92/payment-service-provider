// packages/payment-models/src/index.js
module.exports = {
    makeUserModel: require('./models/user.model'),
    makeRefreshTokenModel: require('./models/refreshToken.model'),
    ...require('./shared/error'),
};