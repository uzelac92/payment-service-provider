// Factory: makeUserModel(conn) ➜ conn.model('User', schema)
const {Schema} = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const SALT_ROUNDS = 12;

module.exports = function makeUserModel(conn) {
    // Use Types from the same connection to avoid cross-connection issues
    const {Types} = conn.base;

    const UserSchema = new Schema(
        {
            _id: {type: Schema.Types.ObjectId, default: () => new Types.ObjectId()},

            name: {
                type: String,
                required: true,
                trim: true,
                validate: {
                    validator: (v) => {
                        if (v == null || v === '') return true; // 'required' handles empties
                        return v.length >= 2 && v.length <= 100;
                    },
                    message: 'Name must be 2-100 characters long',
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
                    message: 'Invalid email format',
                },
            },

            password: {type: String, required: true, trim: true, select: false},
            secret: {type: String, required: true, select: false},

            role: {type: String, enum: ['User', 'Merchant', 'Admin'], default: 'User'},

            isActive: {type: Boolean, default: false, index: true},

            resetPasswordCode: {type: String, select: false},
            resetPasswordCodeExpiry: {type: Date, select: false},

            lastLoginAt: {type: Date, default: Date.now},
        },
        {
            collection: 'users',
            timestamps: true,
            versionKey: false,
            toJSON: {
                virtuals: true,
                transform(_doc, ret) {
                    ret.id = ret._id.toString();
                    delete ret._id;

                    delete ret.password;
                    delete ret.secret;
                    delete ret.resetPasswordCode;
                    delete ret.resetPasswordCodeExpiry;
                    return ret;
                },
            },
        }
    );

    // Optional: case-insensitive unique for email (Mongo 3.4+)
    // Keep the simple { unique: true } above, and add a collation-aware unique index:
    UserSchema.index({email: 1}, {unique: true, collation: {locale: 'en', strength: 2}});

    // Hash password+secret before save
    UserSchema.pre('save', async function (next) {
        try {
            if (this.isNew || !this.secret) {
                this.secret = crypto.randomBytes(16).toString('hex');
            }
            if (this.isModified('password')) {
                const combined = String(this.password) + String(this.secret);
                this.password = await bcrypt.hash(combined, SALT_ROUNDS);
            }
            next();
        } catch (err) {
            next(err);
        }
    });

    // Instance method: compare raw password with stored hash
    UserSchema.methods.comparePassword = async function (password) {
        if (!this.password || !this.secret) {
            throw new Error('comparePassword requires password + secret selected');
        }
        const combined = String(password) + String(this.secret);
        return bcrypt.compare(combined, this.password);
    };

    // Avoid recompiling if already attached on this conn
    return conn.models.User || conn.model('User', UserSchema);
};