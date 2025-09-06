const {Schema, model} = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const SALT_ROUNDS = 12;

const UserSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            validate: {
                validator: (v) => {
                    if (v == null || v === '') return true;
                    return v.length >= 2 && v.length <= 100;
                },
                message: "Name must be 2-100 characters long"
            }
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
                message: 'Invalid email format'
            }
        },
        password: {type: String, required: true, trim: true, select: false},
        secret: {type: String, required: true, select: false},
        isActive: {type: Boolean, default: false, index: true},
        resetPasswordCode: {type: String, select: false},
        resetPasswordCodeExpiry: {type: Date, select: false},
        lastLoginAt: {type: Date, default: Date.now},
    },
    {
        timestamps: true,
        versionKey: false,
        toJSON: {
            transform(_doc, ret) {
                delete ret.password;
                delete ret.secret;
                delete ret.resetPasswordCode;
                delete ret.resetPasswordCodeExpiry;
                return ret;
            }
        },
    }
)

UserSchema.pre("save", async function (next) {
    try {
        if (this.isNew || !this.secret) {
            this.secret = crypto.randomBytes(16).toString('hex');
        }

        if (this.isModified("password")) {
            const combined = this.password + this.secret;
            this.password = await bcrypt.hash(combined, SALT_ROUNDS);
        }

        next();
    } catch (err) {
        next(err);
    }
})

UserSchema.methods.comparePassword = async function (password) {
    if (!this.password || !this.secret) {
        throw new Error('comparePassword requires password + secret selected');
    }
    const combined = password + this.secret;
    return bcrypt.compare(combined, this.password);
};

module.exports = model('User', UserSchema);