const nodemailer = require('nodemailer');
require('dotenv').config();

const host = process.env.SMTP_HOST || 'smtp.gmail.com';
const port = parseInt(process.env.SMTP_PORT) || 587;
const secure = process.env.SMTP_SECURE === 'true';
const user = process.env.SMTP_USER || 'ciperindicaters@gmail.com';
const pass = process.env.SMTP_PASS || 'kggzvzzqkhrdsetz';
const from = process.env.SMTP_FROM || 'ciperindicaters@gmail.com';

console.log('Using SMTP Settings:');
console.log('Host:', host);
console.log('Port:', port);
console.log('Secure:', secure);
console.log('User:', user);
console.log('From:', from);

const transporter = nodemailer.createTransport({
  host,
  port,
  secure,
  auth: { user, pass }
});

async function main() {
  try {
    console.log('Verifying connection...');
    await transporter.verify();
    console.log('Connection verified successfully!');

    console.log('Sending test mail...');
    const info = await transporter.sendMail({
      from: `"Ciper AI Test" <${from}>`,
      to: 'ciperindicaters@gmail.com',
      subject: 'Gmail SMTP Verification Test',
      text: 'This is a test email sent using Gmail SMTP settings.',
      html: '<h3>Gmail SMTP Verification Test</h3><p>This is a test email sent using Gmail SMTP settings.</p>'
    });
    console.log('Email sent successfully! MessageId:', info.messageId);
  } catch (err) {
    console.error('SMTP Connection/Sending failed:', err);
  }
}

main();
