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
                    validator: (v) => (v == null || v === "") || (v.length >= 2 && v.length <= 100),
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
            emailVerifiedAt: {type: Date, default: null},   // optional if you want to track
            resetPasswordCode: {type: String, select: false},   // (optional) if user-service sends emails for reset
            resetPasswordCodeExpiry: {type: Date, select: false},

            lastLoginAt: {type: Date, default: Date.now},   // optional; can also be in auth
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

                    // ensure no legacy leakage
                    delete ret.password;
                    delete ret.secret;
                    delete ret.resetPasswordCode;
                    delete ret.resetPasswordCodeExpiry;
                    return ret;
                },
            },
        }
    );

    // keep collation-aware unique index
    UserSchema.index({email: 1}, {unique: true, collation: {locale: "en", strength: 2}});

    return conn.models.User || conn.model("User", UserSchema);
};