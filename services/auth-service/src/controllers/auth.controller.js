const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const {InternalServerError, BadRequest, Unauthorized, Forbidden} = require("@uzelac92/payment-models")
const {verifyPasswordWithSecret} = require("../utils/password");
const {signAccess, verifyAccessFor} = require("../utils/jwt")
const {issueRefreshToken, rotateRefreshToken} = require("../services/token.service")
const {createCode, verifyCode} = require("../services/verification.service");
const {publish} = require("../kafka/producer");

let RefreshToken;
let AuthCredential;
let VerificationCode;

const allowedAud = new Set(
    process.env.JWT_AUDIENCES?.split(",").map(s => s.trim()).filter(Boolean)
)

let getUserByEmail = async (_email) => {
    throw InternalServerError("getUserByEmail not set")
}

function guardAudience(req, audience) {
    if (!allowedAud.has(audience)) return Forbidden("Invalid Audience")
    if (audience === "processing") {
        const key = req.headers["x-audience-key"] || "";
        if (key !== (process.env.PAYMENT_AUDIENCE_KEY || "")) {
            return Forbidden("Forbidden Audience")
        }
    }
    return null
}

exports.init = ({refreshToken, resolveUserByEmail, AuthCredentialModel, VerificationCodeModel}) => {
    if (resolveUserByEmail) getUserByEmail = resolveUserByEmail;
    RefreshToken = refreshToken;
    AuthCredential = AuthCredentialModel;
    VerificationCode = VerificationCodeModel;
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
        if (!user || !user._id || !user.isActive) {
            return res.status(401).json(Unauthorized("Invalid credentials"))
        }

        const cred = await AuthCredential.findOne({userId: user._id}).lean();
        if (!cred) return res.status(401).json(Unauthorized("Invalid credentials"));

        const verifyErr = await verifyPasswordWithSecret(password, cred.secret, cred.passwordHash);
        if (verifyErr) return res.status(verifyErr.status).json(verifyErr);

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
        if (!refreshToken) return res.status(400).json(BadRequest("Refresh Token required"));

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

        const fp = crypto.createHash("sha256").update(refreshToken, "utf8").digest("base64");
        const t = await RefreshToken.findOne({fingerprint: fp, revokedAt: null, expiresAt: {$gt: new Date()}});
        if (t && await bcrypt.compare(refreshToken, t.tokenHash)) {
            await RefreshToken.updateOne(
                {_id: t._id},
                {$set: {revokedAt: new Date(), revokedByIp: req.ip}}
            );
        }
        res.json({ok: true});
    } catch (e) {
        console.error("[auth/logout]", e);
        res.status(500).json(InternalServerError("Logout Failed"));
    }
}

exports.changePassword = async (req, res) => {
    try {
        const {userId, newPassword} = req.body || {};
        if (!userId || !newPassword || String(newPassword).length < 8) {
            return res.status(400).json(BadRequest("userId and newPassword (>=8 chars) required"));
        }

        // verify short-lived verification/reset session (NOT access token)
        const authz = req.headers.authorization || "";
        const token = authz.startsWith("Bearer ") ? authz.slice(7) : null;
        if (!token) return res.status(401).json(Unauthorized("Invalid Credentials"));

        let claims;
        try {
            claims = jwt.verify(token, process.env.JWT_SECRET);
        } catch {
            return res.status(401).json(Unauthorized("Invalid or expired session"));
        }

        if (!claims?.sub || claims.sub !== userId || !["email-verify", "password-reset"].includes(claims.scope)) {
            return res.status(403).json(Forbidden("Not allowed"));
        }

        // Load or init credentials
        let cred = await AuthCredential.findOne({userId}).lean();
        const rounds = Number((cred && cred.rounds) || process.env.BCRYPT_ROUNDS || 12);

        // Choose (server-side) secret: keep existing or rotate on reset; rotating is safer
        const secret = cred?.secret || crypto.randomBytes(16).toString("hex");

        // Enforce history (compare (newPassword+secret) vs current + last 3)
        const combinedNew = String(newPassword) + String(secret);

        if (cred?.passwordHash && await bcrypt.compare(combinedNew, cred.passwordHash)) {
            return res.status(400).json(BadRequest("New password must differ from current"));
        }

        const last3 = (cred?.passwordHistory || []).slice(-3);
        for (const old of last3) {
            const reused = await bcrypt.compare(combinedNew, old.hash);
            if (reused) return res.status(400).json(BadRequest("Password was recently used"));
        }

        const newHash = await bcrypt.hash(combinedNew, rounds);
        const nextHistory = cred?.passwordHash ? [...last3, {hash: cred.passwordHash, changedAt: new Date()}] : last3;
        while (nextHistory.length > 3) nextHistory.shift();

        await AuthCredential.updateOne(
            {userId},
            {
                $set: {
                    userId,
                    secret, // keep or rotate; shown here keeping existing/created
                    passwordHash: newHash,
                    passwordUpdatedAt: new Date(),
                    rounds,
                    passwordHistory: nextHistory,
                },
                $setOnInsert: {migratedFromUserService: false},
            },
            {upsert: true}
        );

        return res.sendStatus(204); // or res.redirect(302, "https://google.com")
    } catch (e) {
        console.error("[auth/change-password]", e);
        res.status(500).json(InternalServerError("Change password failed"));
    }
};

exports.verifyCodeEndpoint = async (req, res) => {
    try {
        const {user_id, email, purpose, code} = req.body || {};
        if (!user_id || !email || !code || !["email_verify", "password_reset"].includes(purpose)) {
            return res.status(400).json(BadRequest("Bad Request"));
        }

        const result = await verifyCode({
            VerificationCode,
            userId: user_id,
            email,
            purpose,
            code,
        });
        if (!result.ok) {
            return res.status(400).json(BadRequest(result.error));
        }

        const expiresMin = Number(process.env.VERIF_SESSION_MIN || 10);
        const emailHash = crypto.createHash("sha256").update(String(email).toLowerCase().trim(), "utf8").digest("base64");

        const session_token = jwt.sign(
            {
                sub: String(user_id),
                scope: purpose === "email_verify" ? "email-verify" : "password-reset",
                eh: emailHash, // bind to current email
            },
            process.env.JWT_SECRET,
            {expiresIn: mins(expiresMin)}
        );

        return res.json({session_token, expires_in_min: expiresMin});
    } catch (e) {
        console.error("[auth/verify-code]", e);
        return res.status(500).json({error: "verify_code_failed"});
    }
};

exports.renderVerifyPage = (req, res) => {
    const userId = String(req.query.userId || "");
    const email = String(req.query.email || "");
    const purpose = (req.query.purpose === "password_reset") ? "password_reset" : "email_verify";

    if (!userId || !email) {
        return res.status(400).send("<h3>Missing userId or email</h3>");
    }

    const html = `
        <!doctype html>
        <html lang="en">
          <head>
            <meta charset="utf-8"/>
            <meta name="viewport" content="width=device-width,initial-scale=1"/>
            <title>Verify</title>
          </head>
          <body style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu;max-width:560px;margin:40px auto;padding:0 16px">
            <h2>Email ${purpose === "email_verify" ? "Verification" : "Password Reset"}</h2>
        
            <div style="border:1px solid #ddd;border-radius:12px;padding:16px">
              <div style="margin:12px 0;display:flex;gap:8px"><label style="width:120px">User ID</label><input id="uid" value="${userId}" readonly/></div>
              <div style="margin:12px 0;display:flex;gap:8px"><label style="width:120px">Email</label><input id="eml" value="${email}" readonly/></div>
              <div style="margin:12px 0;display:flex;gap:8px"><label style="width:120px">Code</label><input id="code" placeholder="6-digit code"/></div>
              <div style="margin:12px 0;display:flex;gap:8px"><button id="verifyBtn" style="font-size:16px;padding:10px;border-radius:8px;border:0;background:#111;color:#fff;cursor:pointer">Verify code</button></div>
              <div id="verifyMsg"></div>
            </div>
        
            <div id="pwBox" style="display:none;border:1px solid #ddd;border-radius:12px;padding:16px;margin-top:16px">
              <div style="margin:12px 0;display:flex;gap:8px"><label style="width:120px">New password</label><input id="pwd" type="password" placeholder="min 8 chars"/></div>
              <div style="margin:12px 0;display:flex;gap:8px"><button id="commitBtn" style="font-size:16px;padding:10px;border-radius:8px;border:0;background:#111;color:#fff;cursor:pointer">Set password</button></div>
              <div id="pwMsg"></div>
            </div>
        
            <script>
              window.__VERIFY_PURPOSE__ = ${JSON.stringify(purpose)};
            </script>
            <script src="/static/verify.js" defer></script>
          </body>
        </html>
  `;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
};

exports.createVerification = async (req, res) => {
    if (req.headers["x-internal-key"] !== process.env.NOTIFICATION_SERVICE_KEY
        && req.headers["x-internal-key"] !== process.env.USER_SERVICE_KEY) {
        return res.status(403).json(Forbidden("Invalid internal key"));
    }
    const {user_id, email, purpose = "email_verify"} = req.body || {};
    if (!user_id || !email || !["email_verify", "password_reset"].includes(purpose)) {
        return res.status(400).json(BadRequest("Bad Request"));
    }

    const {code, ttlMin} = await createCode({
        VerificationCode,
        userId: user_id,
        email,
        purpose,
        ttlMin: Number(process.env.CODE_TTL_MIN || 15)
    });

    if (process.env.NODE_ENV === "development") {
        return res.status(201).json({ok: true, code, ttlMin, purpose});
    }
    return res.sendStatus(204);
};

exports.requestPasswordReset = async (req, res) => {
    try {
        const email = String(req.body?.email || "").trim().toLowerCase();
        if (!email) return res.sendStatus(204);

        let user;
        try {
            user = await getUserByEmail(email);
        } catch {
            return res.sendStatus(204);
        }
        if (!user || !user._id) return res.sendStatus(204);

        const {code, ttlMin} = await createCode({
            VerificationCode,
            userId: user._id,
            email: user.email,
            purpose: "password_reset",
            ttlMin: Number(process.env.CODE_TTL_MIN || 15),
        });

        // Emit event for notification-service
        try {
            await publish("auth.password_reset.requested.v1", {
                event: "auth.password_reset.requested",
                user_id: String(user._id),
                email: user.email,
                // In prod, you can omit raw code if you prefer; your current pattern is to have
                // notification-service call /auth/verification itself. If you keep this, include:
                code,               // keep for simplicity now; safe because it stays internal
                ttlMin,
                requestedAt: new Date().toISOString(),
            }, user._id);
        } catch (e) {
            // don’t fail user flow if Kafka is down
            console.error("[auth] publish reset event failed:", e.message);
        }

        if (process.env.NODE_ENV === "development") {
            return res.status(201).json({ok: true, code, ttlMin, purpose: "password_reset"});
        }
        return res.sendStatus(204);
    } catch (e) {
        console.error("[auth/password-reset/request]", e);
        return res.sendStatus(204);
    }
};