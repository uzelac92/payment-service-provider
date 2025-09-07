const {Schema} = require('mongoose');
const mongoose = require("mongoose");

const RefreshTokenSchema = new Schema({
        _id: {type: String, required: true},                // jti
        userId: {type: String, required: true, index: true},
        aud: {type: String, required: true, enum: ['client', 'processing'], index: true},
        tokenHash: {type: String, required: true},          // bcrypt hash of raw refresh token
        expiresAt: {type: Date, required: true, index: true},
        createdAt: {type: Date, default: () => new Date()},
        createdByIp: {type: String},
        revokedAt: {type: Date, default: null},
        revokedByIp: {type: String, default: null},
        replacedBy: {type: String, default: null}
    },
    {
        collection: 'refresh_tokens', versionKey: false
    }
)

RefreshTokenSchema.index({userId: 1, expiresAt: -1})

RefreshTokenSchema.index({expiresAt: 1}, {expireAfterSeconds: 0});

module.exports = mongoose.model('RefreshToken', RefreshTokenSchema);