const {Schema} = require('mongoose');

module.exports = function makeRefreshTokenModel(conn) {
    const RefreshTokenSchema = new Schema(
        {
            _id: {type: String, required: true},                 // jti
            userId: {type: String, required: true, index: true},
            aud: {type: String, required: true, enum: ['client', 'processing'], index: true},
            tokenHash: {type: String, required: true},
            // REMOVE inline index here to avoid duplicate index; TTL index below is enough
            expiresAt: {type: Date, required: true},
            createdAt: {type: Date, default: () => new Date()},
            createdByIp: {type: String},
            revokedAt: {type: Date, default: null},
            revokedByIp: {type: String, default: null},
            replacedBy: {type: String, default: null},
        },
        {collection: 'refresh_tokens', versionKey: false}
    );

    // Helpful query index
    RefreshTokenSchema.index({userId: 1, expiresAt: -1});

    // TTL: delete as soon as expiresAt is in the past
    RefreshTokenSchema.index({expiresAt: 1}, {expireAfterSeconds: 0});

    return conn.models.RefreshToken || conn.model('RefreshToken', RefreshTokenSchema);
};