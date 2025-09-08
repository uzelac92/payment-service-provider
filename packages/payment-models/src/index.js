// packages/payment-models/src/index.js
module.exports = {
    makeUserModel: require('./models/User.model'),
    makeRefreshTokenModel: require('./models/RefreshToken.model'),
    makeAuthCredentialModel: require('./models/AuthCredential.model'),
    ...require('./shared/error'),
};