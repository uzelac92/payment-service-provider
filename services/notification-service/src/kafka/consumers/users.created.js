const axios = require("axios");
const {sendMail} = require("../../email/sendgrid");

const svcKey = process.env.AUTH_SERVICE_KEY || "";

async function handleUserCreated(evt) {
    await axios.post(`${process.env.AUTH_BASE_URL}/auth/verification`, {
        user_id: evt.user_id,
        email: evt.email,
    }, {
        headers: {"x-internal-key": svcKey},
    })

    const link = `${process.env.AUTH_PUBLIC_URL}/auth/verify?userId=${encodeURIComponent(evt.user_id)}`;

    await sendMail({
        to: evt.email,
        subject: "Confirm your account",
        html: `
      <p>Welcome to ${process.env.FROM_NAME || "our app"}!</p>
      <p>Click the button below and enter the code we sent you to verify your email.</p>
      <p>
        <a href="${link}" 
           style="display:inline-block;padding:10px 16px;border-radius:8px;background:#111;color:#fff;text-decoration:none">
           Verify Email
        </a>
      </p>
      <p>If the button doesn't work, copy this link into your browser:</p>
      <p>${link}</p>
    `,
    });
}

module.exports = {handleUserCreated};