// routes/auth.js – Authentication: login, register, OTP, forgot password

const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const User    = require('../models/User');
const OTP     = require('../models/OTP');
const { generateOTP, sendOTP } = require('../services/emailService');

const JWT_SECRET  = () => process.env.JWT_SECRET || 'carbochem_secret';
const JWT_EXPIRES = '24h';

function makeToken(user) {
  return jwt.sign(
    { userId: user._id, username: user.username, role: user.role, email: user.email },
    JWT_SECRET(),
    { expiresIn: JWT_EXPIRES }
  );
}

// ── POST /api/auth – Login (accepts username OR email) ─────────────────────
router.post('/auth', async (req, res) => {
  try {
    const { username, password, email } = req.body;
    const loginField = username || email;
    if (!loginField || !password)
      return res.status(400).json({ success: false, message: 'Credentials required' });

    // Find by username OR email
    const user = await User.findOne({
      isActive: true,
      $or: [
        { username: loginField.toLowerCase() },
        { email:    loginField.toLowerCase() }
      ]
    });

    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const token = makeToken(user);
    res.json({
      success: true,
      token,
      user: user.toSafeObject()
    });
  } catch (err) {
    console.error('[auth]', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── POST /api/register-admin – Register admin with secret key ───────────────
router.post('/register-admin', async (req, res) => {
  try {
    const { username, name, email, password, secretKey } = req.body;
    const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY || 'CARBOCHEM2024';

    if (!username || !password || !name)
      return res.status(400).json({ success: false, message: 'name, username, password required' });
    if (secretKey !== ADMIN_SECRET)
      return res.status(403).json({ success: false, message: 'Invalid secret key' });

    const exists = await User.findOne({
      $or: [{ username: username.toLowerCase() }, { email: (email || '').toLowerCase() }]
    });
    if (exists)
      return res.status(400).json({ success: false, message: 'Username or email already exists' });

    const user = await User.create({
      name,
      username: username.toLowerCase(),
      email: (email || `${username}@carbochem.com`).toLowerCase(),
      password,
      role: 'admin',
      department: 'Administration',
      isVerified: true,
    });

    res.status(201).json({
      success: true,
      user: user.toSafeObject(),
      message: 'Admin account created successfully'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/register – Register new user (admin creates staff/client) ────
// Also allows self-registration for clients (OTP optional)
router.post('/register', async (req, res) => {
  try {
    const { username, name, email, password, phone, role, category } = req.body;

    if (!username || !password || !role)
      return res.status(400).json({ success: false, message: 'username, password, role required' });

    const exists = await User.findOne({
      $or: [{ username: username.toLowerCase() }, { email: (email||'').toLowerCase() }]
    });
    if (exists)
      return res.status(400).json({ success: false, message: 'Username or email already exists' });

    const user = await User.create({
      name:     name || username,
      username: username.toLowerCase(),
      email:    (email || `${username}@carbochem.com`).toLowerCase(),
      password,
      phone:    phone || '',
      role:     role  || 'client',
      category: category || '',
      isVerified: true,
    });

    // Send welcome OTP if email configured and email provided
    if (email && process.env.EMAIL_USER) {
      const otp = generateOTP();
      await OTP.create({ email, otp, purpose: 'register', expiresAt: new Date(Date.now() + 10*60*1000) });
      await sendOTP(email, otp, 'register');
    }

    res.status(201).json({
      success: true,
      user: user.toSafeObject(),
      message: `User ${username} registered successfully`
    });
  } catch (err) {
    console.error('[register]', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/verify-otp ──────────────────────────────────────────────────
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp, purpose } = req.body;
    if (!email || !otp)
      return res.status(400).json({ success: false, message: 'Email and OTP required' });

    const record = await OTP.findOne({
      email: email.toLowerCase(), otp, purpose: purpose || 'register',
      used: false, expiresAt: { $gt: new Date() }
    });

    if (!record)
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });

    record.used = true;
    await record.save();

    await User.updateOne({ email: email.toLowerCase() }, { isVerified: true });
    res.json({ success: true, message: 'OTP verified' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/forgot-password ─────────────────────────────────────────────
// Supports: (1) username + newPassword – simple reset, (2) username only – verify user exists,
// (3) email – legacy OTP flow
router.post('/forgot-password', async (req, res) => {
  try {
    const { email, username, newPassword } = req.body;

    // Simple username-based reset (no OTP)
    if (username) {
      const user = await User.findOne({ username: username.toLowerCase() });
      if (!user)
        return res.status(404).json({ success: false, message: 'Username not found' });

      if (!newPassword)
        return res.json({ success: true, message: 'User found. You may set a new password.', found: true });

      if (newPassword.length < 6)
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });

      user.password = newPassword;
      await user.save();
      return res.json({ success: true, message: 'Password reset successfully' });
    }

    // Legacy email OTP flow
    if (!email) return res.status(400).json({ success: false, message: 'Username or email required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.json({ success: true, message: 'If that email exists, OTP has been sent' });

    const otp = generateOTP();
    await OTP.deleteMany({ email: email.toLowerCase(), purpose: 'forgot' });
    await OTP.create({ email: email.toLowerCase(), otp, purpose: 'forgot', expiresAt: new Date(Date.now() + 10*60*1000) });
    await sendOTP(email, otp, 'forgot');

    res.json({ success: true, message: 'OTP sent to email (check console if email not configured)' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/reset-password ──────────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword)
      return res.status(400).json({ success: false, message: 'All fields required' });

    const record = await OTP.findOne({
      email: email.toLowerCase(), otp, purpose: 'forgot',
      used: false, expiresAt: { $gt: new Date() }
    });
    if (!record)
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });

    record.used = true;
    await record.save();

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.password = newPassword; // pre-save hook will hash
    await user.save();

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
