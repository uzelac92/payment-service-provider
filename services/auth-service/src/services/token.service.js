const {v4: uuid} = require('uuid/v4');
const bcrypt = require('bcryptjs');
const dayjs = require('dayjs')

const RT_ROUNDS = 10;

async function issueRefreshToken({RefreshToken, userId, aud, ip}) {
    const raw = uuid() + '.' + uuid(); // opaque string
    const tokenHash = await bcrypt.hash(raw, RT_ROUNDS)
    const expiresAt = dayjs().add(Number(process.env.REFRESH_TTL_DAYS || 30), 'day').toDate()
    const jti = uuid();

    await RefreshToken.create({
        _id: jti,
        userId,
        aud,
        tokenHash,
        expiresAt,
        createdByIp: ip
    })

    return {raw, jti, aud, expiresAt}
}

async function rotateRefreshToken({RefreshToken, raw, ip}) {
    const now = new Date();
    const candidates = await RefreshToken.find({revokedAt: null, expiresAt: {$gte: now}}).lean();
    let current = null;
    for (const doc of candidates) {
        if (await bcrypt.compare(raw, doc.tokenHash)) {
            current = doc;
            break;
        }
    }
    if (!current) {
        throw new Error('Invalid refresh token.');
    }

    await RefreshToken.updateOne({_id: current._id}, {$set: {revokedAt: now, revokedByIp: ip}});

    const next = await issueRefreshToken({
        RefreshToken,
        userId: current.userId,
        aud: current.aud,
        ip
    })
    await RefreshToken.updateOne({_id: current._id}, {$set: {replacedBy: next.jti}})

    return {userId: current.userId, aud: current.aud, refreshRaw: next.raw};
}

module.exports = {issueRefreshToken, rotateRefreshToken};