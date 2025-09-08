const {BadRequest} = require("@uzelac92/payment-models")

async function verifyPasswordWithSecret(rawPassword, userSecret, storedHash) {
    if (!rawPassword || !userSecret || !storedHash) {
        return BadRequest('Password, Secret and stored data are required');
    }
    return null
}

module.exports = {verifyPasswordWithSecret}