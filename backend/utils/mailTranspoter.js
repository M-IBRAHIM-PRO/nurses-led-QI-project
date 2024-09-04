const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: "gmail",
    port: 465,
    secure: true, // Use TLS if port is 587, SSL if port is 465
    auth: {
        user: process.env.SMTP_USER, // Your email address
        pass: process.env.SMTP_PASS  // Your email password or app password
    }
});

module.exports={
    transporter
}