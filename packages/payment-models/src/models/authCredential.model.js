const {Schema} = require("mongoose");

module.exports = function makeAuthCredentialModel(conn) {
    const AuthCredentialSchema = new Schema(
        {
            userId: {type: String, required: true, unique: true, index: true},

            // current password
            passwordHash: {type: String, required: true},
            secret: {type: String, required: true}, // if you keep “secret + password” combo
            passwordUpdatedAt: {type: Date, default: () => new Date()},

            // optional hardening / future-proofing
            algo: {type: String, default: "bcrypt"},
            rounds: {type: Number, default: 12},

            // optional: keep last N hashes for policy (don’t allow reuse)
            passwordHistory: [
                {
                    hash: String,
                    changedAt: {type: Date, default: () => new Date()},
                },
            ],

            migratedFromUserService: {type: Boolean, default: false},
        },
        {collection: "auth_credentials", versionKey: false}
    );

    // If you want a compound unique, this is already unique via userId.
    // AuthCredentialSchema.index({ userId: 1 }, { unique: true });

    return (
        conn.models.AuthCredential ||
        conn.model("AuthCredential", AuthCredentialSchema)
    );
};