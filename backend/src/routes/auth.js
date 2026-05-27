const router      = require('express').Router();
const bcrypt      = require('bcryptjs');
const jwt         = require('jsonwebtoken');
const crypto      = require('crypto');
const User        = require('../models/User');
const auth        = require('../middleware/auth');
const sendVerificationEmail = require('../utils/sendVerificationEmail');

const VERIFY_TTL_MS  = 24 * 60 * 60 * 1000; // 24 hours
const RESEND_COOLDOWN_MS = 60 * 1000;        // 60 seconds

const sign = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

function generateToken() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// ── Register ──────────────────────────────────────────────────────────────────
router.post('/register', async (req, res, next) => {
  try {
    const { name, password } = req.body;
    const email = (req.body.email || '').trim().toLowerCase();
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      if (existing.emailVerified) {
        return res.status(409).json({ error: 'email_already_in_use' });
      }

      // Unverified account — check if cooldown is still active
      const sentAt = existing.verificationTokenExpiry
        ? existing.verificationTokenExpiry.getTime() - VERIFY_TTL_MS
        : 0;
      const elapsed = Date.now() - sentAt;

      if (elapsed < RESEND_COOLDOWN_MS) {
        // Recently sent: redirect to verify screen — DO NOT regenerate code
        const waitSeconds = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
        console.log(`[OTP] Pending account for ${email} — cooldown active, ${waitSeconds}s remaining, stored code: ${existing.verificationToken}`);
        return res.status(409).json({ error: 'email_pending_verification', waitSeconds });
      }

      // Cooldown expired: regenerate code and resend
      const newToken  = generateToken();
      const newExpiry = new Date(Date.now() + VERIFY_TTL_MS);
      console.log(`[OTP] Regenerating code for ${email}: old=${existing.verificationToken} new=${newToken}`);
      await User.updateOne(
        { _id: existing._id },
        { $set: { verificationToken: newToken, verificationTokenExpiry: newExpiry } }
      );
      // Confirm what was actually written
      const saved = await User.findById(existing._id).select('verificationToken').lean();
      console.log(`[OTP] Code confirmed in DB for ${email}: ${saved && saved.verificationToken}`);

      try {
        await sendVerificationEmail(email, existing.name, newToken);
        return res.status(202).json({ needsVerification: true, email });
      } catch (emailErr) {
        const code = emailErr.smtpCode || 'email_send_failed';
        return res.status(400).json({ error: code });
      }
    }

    const base          = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
    const username      = base + Math.floor(Math.random() * 9000 + 1000);
    const password_hash = await bcrypt.hash(password, 10);
    const token         = generateToken();
    const expiry        = new Date(Date.now() + VERIFY_TTL_MS);

    console.log(`[OTP] Generated code for new user ${email}: ${token}`);

    const user = await User.create({
      name,
      username,
      email,
      password: password_hash,
      emailVerified: false,
      verificationToken: token,
      verificationTokenExpiry: expiry,
    });

    // Re-read from DB to confirm what was actually persisted
    const confirmed = await User.findById(user._id).select('verificationToken').lean();
    console.log(`[OTP] Code confirmed in DB for ${email}: ${confirmed && confirmed.verificationToken}`);

    try {
      await sendVerificationEmail(email, name, token);
    } catch (emailErr) {
      await User.findByIdAndDelete(user._id);
      const code = emailErr.smtpCode || 'email_send_failed';
      return res.status(400).json({ error: code });
    }

    res.status(201).json({ needsVerification: true, email });
  } catch (err) { next(err); }
});

// ── Login ─────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res, next) => {
  try {
    const { password } = req.body;
    const email = (req.body.email || '').trim().toLowerCase();
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.emailVerified) {
      return res.status(403).json({
        error: 'Email not verified',
        needsVerification: true,
        email: user.email,
      });
    }

    res.json({ token: sign(user._id), user });
  } catch (err) { next(err); }
});

// ── Verify OTP ────────────────────────────────────────────────────────────────
router.post('/verify', async (req, res, next) => {
  try {
    const enteredOtp = String(req.body.otp || '').trim();
    const email      = (req.body.email || '').trim().toLowerCase();

    console.log(`[OTP] Verify attempt — email: "${email}", entered: "${enteredOtp}"`);

    if (!email || !enteredOtp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    // First fetch the user to give specific error messages
    const userByEmail = await User.findOne({ email }).lean();

    if (!userByEmail) {
      console.log(`[OTP] No user found for email: "${email}"`);
      return res.status(400).json({ error: 'invalid_token' });
    }

    if (userByEmail.emailVerified) {
      console.log(`[OTP] Account already verified: ${email}`);
      return res.status(400).json({ error: 'already_verified' });
    }

    if (!userByEmail.verificationTokenExpiry || userByEmail.verificationTokenExpiry < new Date()) {
      console.log(`[OTP] Code expired for ${email} — expiry: ${userByEmail.verificationTokenExpiry}`);
      return res.status(400).json({ error: 'token_expired' });
    }

    const storedOtp = String(userByEmail.verificationToken || '').trim();
    console.log(`[OTP] Stored: "${storedOtp}" | Entered: "${enteredOtp}" | Match: ${storedOtp === enteredOtp}`);

    if (storedOtp !== enteredOtp) {
      console.log(`[OTP] Mismatch — stored len=${storedOtp.length}, entered len=${enteredOtp.length}`);
      return res.status(400).json({ error: 'invalid_token' });
    }

    // Mark verified directly in DB — bypass any Mongoose transformation
    await User.updateOne(
      { _id: userByEmail._id },
      { $set: { emailVerified: true }, $unset: { verificationToken: '', verificationTokenExpiry: '' } }
    );

    const verifiedUser = await User.findById(userByEmail._id);
    console.log(`[OTP] Email verified successfully: ${email}`);
    res.json({ token: sign(userByEmail._id), user: verifiedUser });
  } catch (err) { next(err); }
});

// ── Resend verification email ─────────────────────────────────────────────────
router.post('/resend-verification', async (req, res, next) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal whether account exists
      return res.json({ success: true });
    }

    if (user.emailVerified) {
      return res.status(400).json({ error: 'already_verified' });
    }

    // Cooldown check — was a token sent in the last 60 s?
    if (user.verificationTokenExpiry) {
      const sentAt = user.verificationTokenExpiry.getTime() - VERIFY_TTL_MS;
      const elapsed = Date.now() - sentAt;
      if (elapsed < RESEND_COOLDOWN_MS) {
        const waitSeconds = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
        return res.status(429).json({ error: 'cooldown', waitSeconds });
      }
    }

    const token  = generateToken();
    const expiry = new Date(Date.now() + VERIFY_TTL_MS);
    console.log(`[OTP] Resend — new code for ${email}: ${token}`);
    await User.updateOne(
      { _id: user._id },
      { $set: { verificationToken: token, verificationTokenExpiry: expiry } }
    );
    const saved = await User.findById(user._id).select('verificationToken').lean();
    console.log(`[OTP] Resend — code confirmed in DB for ${email}: ${saved && saved.verificationToken}`);

    try {
      await sendVerificationEmail(user.email, user.name, token);
    } catch (emailErr) {
      const code = emailErr.smtpCode || 'email_send_failed';
      return res.status(400).json({ error: code });
    }

    res.json({ success: true });
  } catch (err) { next(err); }
});

// ── Test email delivery ───────────────────────────────────────────────────────
router.post('/test-email', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email address is required' });
  try {
    await sendVerificationEmail(email, 'Test', 'test-token-' + Date.now());
    res.json({ success: true, message: `Test email sent to ${email}` });
  } catch (err) {
    res.status(500).json({ error: err.smtpCode || err.message });
  }
});

// ── Get current user ──────────────────────────────────────────────────────────
router.get('/me', auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) { next(err); }
});

module.exports = router;
