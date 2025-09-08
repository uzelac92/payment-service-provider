const {InternalServerError, BadRequest, NotFound, Unauthorized, Forbidden} = require("@uzelac92/payment-models")
const {verifyPasswordWithSecret} = require("../utils/password");
const {signAccess, verifyAccessFor} = require("../utils/jwt")
const {issueRefreshToken, rotateRefreshToken} = require("../services/token.service")
const bcrypt = require('bcryptjs');

let RefreshToken;

const allowedAud = new Set(
    process.env.JWT_AUDIENCES?.split(",").map(s => s.trim()).filter(Boolean)
)

let getUserByEmail = async (_email) => {
    throw InternalServerError("getUserByEmail not set")
}

function guardAudience(req, audience) {
    if (!allowedAud.has(audience)) return NotFound("Invalid Audience")
    if (audience === "processing") {
        const key = req.headers["x-audience-key"] || "";
        if (key !== (process.env.PAYMENT_AUDIENCE_KEY || "")) {
            return Forbidden("Forbidden Audience")
        }
    }
    return null
}

exports.init = ({refreshToken, resolveUserByEmail}) => {
    RefreshToken = refreshToken
    if (resolveUserByEmail) getUserByEmail = resolveUserByEmail;
}

exports.login = async (req, res) => {
    try {
        const {email, password, audience = 'client'} = req.body || {};
        if (!email || !password) {
            return res.status(400).json(BadRequest("Email and password are required"));
        }

        const guardErr = guardAudience(req, audience)
        if (guardErr != null) {
            return res.status(guardErr.status).json(guardErr)
        }

        const user = await getUserByEmail(String(email).toLowerCase())
        if (!user || !user.isActive) {
            return res.status(401).json(Unauthorized("Invalid credentials"))
        }

        const verifyErr = await verifyPasswordWithSecret(password, user.secret, user.password)
        if (verifyErr != null) {
            return res.status(verifyErr.status).json(verifyErr)
        }

        const accessToken = signAccess(
            {sub: user._id, email: user.email},
            audience
        );
        const {raw: refreshToken} = await issueRefreshToken({
            RefreshToken,
            userId: user._id,
            aud: audience,
            ip: req.ip
        });

        res.json({
            accessToken,
            refreshToken,
            audience,
            tokenType: 'Bearer',
            expiresIn: process.env.JWT_EXPIRES || '15m'
        });
    } catch (e) {
        console.error('[auth/login]', e);
        res.status(500).json({error: 'Authentication Failed'});
    }
}

exports.refresh = async (req, res) => {
    try {
        const {refreshToken} = req.body || {};
        if (!refreshToken) return res.status(401).json(BadRequest("Refresh Token required"));

        const {userId, aud, refreshRaw} = await rotateRefreshToken({
            RefreshToken,
            raw: refreshToken,
            ip: req.ip
        })

        const accessToken = signAccess({sub: userId}, aud)
        res.json({
            accessToken,
            refreshToken: refreshRaw,
            audience: aud,
            tokenType: 'Bearer',
            expiresIn: process.env.JWT_EXPIRES || '15m'
        })
    } catch (e) {
        console.error('[auth/refresh]', e);
        res.status(401).json(Unauthorized("Refresh Token invalid"));
    }
}

exports.validate = async (req, res) => {
    try {
        const aud = (req.query.aud || "").trim()
        const verify = verifyAccessFor(aud)

        const authorization = req.headers["authorization"] || ""
        const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : null;
        if (!token) return res.status(401).json(Unauthorized("Invalid Credentials"));

        const claims = verify(token);
        res.json({valid: true, claims, audience: aud});
    } catch (e) {
        res.status(401).json(Unauthorized("Invalid or wrong audience"));
    }
}

exports.logout = async (req, res) => {
    try {
        const {refreshToken} = req.body || {};
        if (!refreshToken) return res.status(400).json(BadRequest("Refresh Token required"));

        const now = new Date();
        const active = await RefreshToken.find({revokedAt: null, expiresAt: {$gt: now}});
        for (const t of active) {
            if (await bcrypt.compare(refreshToken, t.tokenHash)) {
                await RefreshToken.updateOne(
                    {_id: t._id},
                    {$set: {revokedAt: new Date(), revokedByIp: req.ip}}
                );
                break;
            }
        }
        res.json({ok: true});
    } catch (e) {
        res.status(500).json(InternalServerError("Logout Failed"));
    }
}