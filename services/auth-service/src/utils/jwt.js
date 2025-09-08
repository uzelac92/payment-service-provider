const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || '';
const ISS = process.env.JWT_ISSUER || 'pacaria';
const EXP = process.env.JWT_EXPIRES || '15m';

if (!SECRET || SECRET.length < 32) {
    console.warn('[auth] JWT_SECRET should be >= 32 chars');
}

function signAccess(claims, aud) {
    return jwt.sign(claims, SECRET, {algorithm: 'HS256', issuer: ISS, audience: aud, expiresIn: EXP});
}

function verifyAccessFor(aud) {
    return (token) =>
        jwt.verify(token, SECRET, {algorithms: ['HS256'], issuer: ISS, audience: aud});
}

module.exports = {signAccess, verifyAccessFor};