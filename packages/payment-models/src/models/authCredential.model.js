const {Schema} = require("mongoose");

module.exports = function makeAuthCredentialModel(conn) {
    const AuthCredentialSchema = new Schema(
        {
            userId: {type: String, required: true, unique: true, index: true},
            passwordHash: {type: String, required: true},
            secret: {type: String, required: true},
            passwordUpdatedAt: {type: Date, default: () => new Date()},
            migratedFromUserService: {type: Boolean, default: false},
        },
        {collection: "auth_credentials", versionKey: false}
    );

    return (
        conn.models.AuthCredential ||
        conn.model("AuthCredential", AuthCredentialSchema)
    );
};