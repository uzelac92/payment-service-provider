const {Schema, model} = require('mongoose');

const UserSchema = new Schema(
    {
        name: {type: String, trim: true},
        email: {type: String, required: true, unique: true, trim: true},
        password: {type: String, required: true, trim: true},
        secret: {type: String, required: true},
        role: {type: String, required: true, enum: ['Admin', 'Merchant'], default: 'Merchant'},
        isActive: {type: Boolean, default: false},
        resetPasswordCode: {type: String},
        resetPasswordCodeExpiry: {type: Date}
    },
    {timestamps: true}
)

module.exports = model('User', UserSchema);