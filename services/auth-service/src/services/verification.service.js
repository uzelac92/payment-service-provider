const {Unauthorized} = require("@uzelac92/payment-models")
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const ROUNDS = Number(process.env.BCRYPT_ROUNDS || 10);

const sha256b64 = s => crypto.createHash("sha256").update(String(s).toLowerCase().trim(), "utf8").digest("base64");
const genCode = () => String(Math.floor(Math.random() * 1000000)).padStart(6, "0");

exports.createCode = async ({VerificationCode, userId, email, purpose, ttlMin = 15, maxAttempts = 5}) => {
    const code = genCode();
    const codeHash = await bcrypt.hash(code, ROUNDS);
    const emailHash = sha256b64(email);
    const expiresAt = new Date(Date.now() + ttlMin * 60 * 1000);

    await VerificationCode.updateMany(
        {userId, purpose, consumedAt: null, expiresAt: {$gt: new Date()}},
        {$set: {consumedAt: new Date()}}
    );

    await VerificationCode.create({userId, emailHash, purpose, codeHash, expiresAt, maxAttempts});
    return {code, ttlMin};
};

exports.verifyCode = async ({VerificationCode, userId, email, purpose, code}) => {
    const rec = await VerificationCode
        .findOne({userId, purpose, consumedAt: null, expiresAt: {$gt: new Date()}})
        .sort({createdAt: -1});

    if (!rec) return Unauthorized("Invalid or expired")
    if (sha256b64(email) !== rec.emailHash) return Unauthorized("Email changed")
    if (rec.attempts >= rec.maxAttempts) return Unauthorized("Too many attempts");

    const ok = await bcrypt.compare(String(code), rec.codeHash);
    if (!ok) {
        await VerificationCode.updateOne({_id: rec._id}, {$inc: {attempts: 1}});
        return Unauthorized("Invalid code");
    }

    await VerificationCode.updateOne({_id: rec._id}, {$set: {consumedAt: new Date()}});
    return null;
};