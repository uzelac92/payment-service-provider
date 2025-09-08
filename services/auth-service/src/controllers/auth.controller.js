const {InternalServerError, BadRequest, NotFound} = require("../error")
const {verifyPasswordWithSecret} = require("../utils/password");
const {signAccess, verifyAccessFor} = require("../utils/jwt")
const {issueRefreshToken} = require("../services/token.service")

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
            return NotFound("Forbidden Audience")
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
            return res.status(401).json(BadRequest("Invalid credentials"))
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

