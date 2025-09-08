const {Schema} = require("mongoose");

module.exports = function makeVerificationCodeModel(conn) {
    const s = new Schema({
        userId: {type: String, required: true, index: true},
        emailHash: {type: String, required: true}, // sha256(lowercase(email))
        purpose: {type: String, enum: ["email_verify", "password_reset"], required: true, index: true},

        codeHash: {type: String, required: true}, // bcrypt/argon hash of 6-digit code
        attempts: {type: Number, default: 0},
        maxAttempts: {type: Number, default: 5},

        expiresAt: {type: Date, required: true, index: true},
        consumedAt: {type: Date, default: null},
        createdAt: {type: Date, default: () => new Date()},
    }, {collection: "verification_codes", versionKey: false});

    // TTL delete when past expiry
    s.index({expiresAt: 1}, {expireAfterSeconds: 0});

    return conn.models.VerificationCode || conn.model("VerificationCode", s);
};