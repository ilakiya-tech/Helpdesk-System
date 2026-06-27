// services/emailService.js – Nodemailer OTP sender
// If EMAIL_USER is not configured, OTPs are logged to console instead.

const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return null;
  transporter = nodemailer.createTransport({
    host:   process.env.EMAIL_HOST || 'smtp.gmail.com',
    port:   parseInt(process.env.EMAIL_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  return transporter;
}

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendOTP(email, otp, purpose = 'register') {
  const subject = purpose === 'forgot'
    ? 'Carbochem Helpdesk – Password Reset OTP'
    : 'Carbochem Helpdesk – Email Verification OTP';

  const html = `
    <div style="font-family:Inter,sans-serif;max-width:500px;margin:auto;padding:30px;border-radius:10px;border:1px solid #e0e0e0;">
      <h2 style="color:#1a5f9e;">Carbochem Helpdesk</h2>
      <p>Your OTP for <strong>${purpose === 'forgot' ? 'password reset' : 'account verification'}</strong> is:</p>
      <div style="font-size:36px;font-weight:bold;color:#1a5f9e;letter-spacing:8px;text-align:center;padding:20px;background:#f0f4f8;border-radius:8px;margin:20px 0;">${otp}</div>
      <p style="color:#666;">This OTP is valid for <strong>10 minutes</strong>. Do not share it with anyone.</p>
      <hr style="border:none;border-top:1px solid #eee;margin:20px 0;">
      <p style="color:#999;font-size:12px;">Carbochem Helpdesk System</p>
    </div>
  `;

  const t = getTransporter();
  if (!t) {
    // No email configured — log to console for development
    console.log(`\n[OTP] Email: ${email} | OTP: ${otp} | Purpose: ${purpose}\n`);
    return { success: true, dev: true };
  }

  await t.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to:   email,
    subject,
    html,
  });
  return { success: true };
}

module.exports = { generateOTP, sendOTP };
