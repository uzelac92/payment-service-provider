const axios = require("axios");
const {sendMail} = require("../../email/sendgrid");

const svcKey = process.env.NOTIFICATION_SERVICE_KEY || ""; // make sure this matches auth controller

async function handlePasswordResetRequested(evt) {
    // 1) Ask auth to create a password_reset code (internal call)
    let code;
    try {
        const resp = await axios.post(
            `${process.env.AUTH_BASE_URL}/api/client/auth/verification`,
            {
                user_id: evt.user_id,
                email: evt.email,
                purpose: "password_reset",
            },
            {
                headers: {"x-internal-key": svcKey},
                timeout: 5000,
            }
        );
        code = resp?.data?.code;
    } catch (e) {
        console.error(
            "[notification] create verification failed:",
            e?.response?.status,
            e?.response?.data || e.message
        );
    }

    // 2) Build reset link (PUBLIC url!)
    const link =
        `${process.env.AUTH_PUBLIC_URL}/api/client/auth/verify` +
        `?userId=${encodeURIComponent(evt.user_id)}` +
        `&email=${encodeURIComponent(evt.email)}` +
        `&purpose=password_reset`;

    // 3) Email the user
    const codeBlock = code
        ? `<p><strong>Dev-only code:</strong> ${code}</p>`
        : `<p>On the page, enter the 6-digit code we sent.</p>`;

    await sendMail({
        to: evt.email,
        subject: "Reset your password",
        html: `
      <p>You requested a password reset.</p>
      <p>Use this link to continue: <a href="${link}">Reset Password</a></p>
      ${codeBlock}
      <p>If the button doesn't work, copy this link into your browser:</p>
      <p>${link}</p>
    `,
    });
}

module.exports = {handlePasswordResetRequested};