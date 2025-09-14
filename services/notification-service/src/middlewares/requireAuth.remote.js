const fetch = require("node-fetch")
const {InternalServerError, Unauthorized, ServiceUnavailable} = require("@uzelac92/payment-models")

function requireAuthRemote({authBaseUrl, timeoutMs = 3000}) {
    if (!authBaseUrl) throw InternalServerError("requireAuthRemote: authBaseUrl is required");

    return async function (req, res, next) {
        try {
            const auth = req.headers.authorization || "";
            const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : null;
            if (!token) return res.status(401).json(Unauthorized("Invalid Credentials"));

            const controller = new AbortController();
            const t = setTimeout(() => controller.abort(), timeoutMs);

            const resp = await fetch(`${authBaseUrl}/auth/validate`, {
                method: "GET",
                headers: {Authorization: `Bearer ${token}`},
                signal: controller.signal,
            }).catch((e) => {
                if (e.name === "AbortError") throw InternalServerError("Auth service timeout");
                throw e;
            });

            clearTimeout(t);

            if (!resp.ok) {
                return res.status(401).json(Unauthorized("Invalid or wrong audience"));
            }

            const data = await resp.json();
            if (!data || !data.valid) {
                return res.status(401).json(Unauthorized("Invalid Credentials"));
            }

            req.auth = {
                claims: data.claims || {},
                audience: data.audience || null,
                token,
            };

            return next();
        } catch (err) {
            return res.status(503).json(ServiceUnavailable("Auth verification failed"));
        }
    };
}

module.exports = requireAuthRemote;