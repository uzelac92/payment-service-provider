const axios = require("axios");
const {sendMail} = require("../../email/sendgrid");

const svcKey = process.env.NOTIFICATION_SERVICE_KEY || "";

async function handleUserCreated(evt) {
    await axios.post(`${process.env.AUTH_BASE_URL}/api/client/auth/verification`, {
        user_id: evt.user_id,
        email: evt.email,
    }, {
        headers: {"x-internal-key": svcKey},
    })

    const link = `${process.env.AUTH_PUBLIC_URL}/api/client/auth/verify?userId=${encodeURIComponent(evt.user_id)}&email=${encodeURIComponent(evt.email)}&purpose=email_verify`;
    const code = resp?.data?.code;

    await sendMail({
        to: evt.email,
        subject: "Confirm your account",
        html: `
      <p>Welcome to ${process.env.FROM_NAME || "our app"}!</p>
      <p>Click the button below and enter your code to verify your email.</p>
      <p><a href="${link}" style="display:inline-block;padding:10px 16px;border-radius:8px;background:#111;color:#fff;text-decoration:none">Verify Email</a></p>
      ${code ? `<p><strong>Dev-only code:</strong> ${code}</p>` : ""}
      <p>If the button doesn't work, copy this link into your browser:</p>
      <p>${link}</p>
    `,
    });
}

module.exports = {handleUserCreated};