const {Schema} = require("mongoose");

module.exports = function makeUserModel(conn) {
    const {Types} = conn.base;

    const UserSchema = new Schema(
        {
            _id: {type: Schema.Types.ObjectId, default: () => new Types.ObjectId()},

            name: {
                type: String,
                required: true,
                trim: true,
                validate: {
                    validator: (v) => typeof v === "string" && v.length >= 2 && v.length <= 100,
                    message: "Name must be 2-100 characters long",
                },
            },

            email: {
                type: String,
                required: true,
                unique: true,
                index: true,
                trim: true,
                lowercase: true,
                validate: {
                    validator: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
                    message: "Invalid email format",
                },
            },

            isActive: {type: Boolean, default: false, index: true},
            emailVerifiedAt: {type: Date, default: null},

            // Optional, only if you want to track it here; otherwise move to auth
            lastLoginAt: {type: Date, default: Date.now},
        },
        {
            collection: "users",
            timestamps: true,
            versionKey: false,
            toJSON: {
                virtuals: true,
                transform(_doc, ret) {
                    ret.id = ret._id.toString();
                    delete ret._id;
                    return ret;
                },
            },
        }
    );

    // Case-insensitive unique email
    UserSchema.index({email: 1}, {unique: true, collation: {locale: "en", strength: 2}});

    UserSchema.statics.findByEmailNormalized = function (email) {
        const trimmed = String(email || "").toLowerCase().trim();
        return this.findOne({email: trimmed}).collation({locale: "en", strength: 2});
    };

    return conn.models.User || conn.model("User", UserSchema);
};