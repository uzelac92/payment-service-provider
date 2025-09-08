const sg = require("@sendgrid/mail");

function initEmail() {
    if (!process.env.SENDGRID_API_KEY) {
        console.warn("[notification] SENDGRID_API_KEY not set — emails will fail");
    } else {
        sg.setApiKey(process.env.SENDGRID_API_KEY);
    }
}

async function sendMail({to, subject, html}) {
    return sg.send({
        to,
        from: {email: process.env.FROM_EMAIL, name: process.env.FROM_NAME},
        subject,
        html,
    });
}

module.exports = {initEmail, sendMail};