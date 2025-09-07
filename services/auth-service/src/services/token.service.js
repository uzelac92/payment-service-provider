const {v4: uuid} = require('uuid/v4');
const bcrypt = require('bcryptjs');
const dayjs = require('dayjs')
const RefreshToken = require("@uzelac92/payment-models");

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