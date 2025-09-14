const axios = require("axios");

const base = process.env.USER_SERVICE_BASE_URL;
const svcKey = process.env.USER_SERVICE_KEY || "";

async function resolveUserByEmail(email) {
    const res = await axios.get(`${base}/internal/users/resolve-by-email`, {
        params: {email: String(email).toLowerCase()},
        headers: {"x-internal-key": svcKey},
    });
    return res.data || null;
}

module.exports = {resolveUserByEmail};