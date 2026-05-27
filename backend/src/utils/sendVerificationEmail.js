const transporter = require('../config/mailer');

// ── Validate SMTP config — call once at startup ───────────────────────────────
function checkSmtpConfig() {
  if (process.env.EMAIL_VERIFICATION_DEV_MODE === 'true') {
    console.log('[Email] DEV mode — emails will be printed to console, not sent via SMTP');
    return;
  }

  const required = {
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    EMAIL_FROM: process.env.EMAIL_FROM || process.env.SMTP_FROM,
    APP_URL:    process.env.APP_URL    || process.env.CLIENT_URL,
  };

  const placeholders = ['your@gmail.com', 'your-app-password'];
  let allOk = true;

  for (const [key, val] of Object.entries(required)) {
    if (!val || placeholders.includes(val)) {
      console.error(`[Email] Missing SMTP config: ${key}`);
      allOk = false;
    }
  }

  if (allOk) {
    console.log(`[Email] SMTP ready — host: ${process.env.SMTP_HOST}:${process.env.SMTP_PORT}, user: ${process.env.SMTP_USER}`);
  } else {
    console.error('[Email] SMTP is not fully configured — email sending will fail until all variables are set');
  }
}

// ── Guard: check env vars have real values ────────────────────────────────────
function isSmtpConfigured() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  return (
    user && pass &&
    user !== 'your@gmail.com' &&
    pass !== 'your-app-password'
  );
}

// ── Classify raw nodemailer errors into clean codes ───────────────────────────
function classifySmtpError(err) {
  const msg  = (err.message  || '').toLowerCase();
  const code = (err.code     || '').toUpperCase();
  const rc   = err.responseCode || 0;

  if (
    code === 'EAUTH' ||
    msg.includes('missing credentials') ||
    msg.includes('credentials for plain') ||
    msg.includes('authentication') ||
    msg.includes('username and password')
  ) {
    return 'smtp_not_configured';
  }

  if (
    rc === 550 ||
    msg.includes('550') ||
    msg.includes('5.1.1') ||
    msg.includes('does not exist') ||
    msg.includes('user unknown') ||
    msg.includes('no such user') ||
    msg.includes('nosuchuser') ||
    msg.includes('invalid address') ||
    msg.includes('recipient address rejected') ||
    msg.includes('address rejected')
  ) {
    return 'email_not_found';
  }

  return 'email_send_failed';
}

// ── HTML template ─────────────────────────────────────────────────────────────
function buildEmailHtml(name, otp) {
  const digits = String(otp).split('').map(d =>
    `<td style="width:48px;height:56px;border:2px solid #e5e7eb;border-radius:12px;text-align:center;vertical-align:middle;font-size:28px;font-weight:800;color:#374151;background:#f9fafb;">${d}</td>`
  ).join('<td style="width:8px;"></td>');

  return `<!DOCTYPE html>
<html lang="uk">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Код підтвердження — WishList</title>
</head>
<body style="margin:0;padding:0;background:#f5f0ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0ff;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 32px rgba(180,130,255,.15);">
          <tr>
            <td style="background:linear-gradient(135deg,#F2A6C8 0%,#CDB8FF 50%,#FF8E8E 100%);padding:36px 40px;text-align:center;">
              <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="background:rgba(255,255,255,.25);border-radius:16px;padding:10px 14px;">
                    <span style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">&#10084; WishList</span>
                  </td>
                </tr>
              </table>
              <p style="margin:16px 0 0;font-size:28px;font-weight:700;color:#ffffff;">Ласкаво просимо!</p>
              <p style="margin:6px 0 0;font-size:15px;color:rgba(255,255,255,.85);">Один крок до вашого списку бажань</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 40px 32px;">
              <p style="margin:0 0 8px;font-size:16px;color:#374151;">Привіт, <strong>${name}</strong>!</p>
              <p style="margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.6;">
                Дякуємо за реєстрацію у <strong>WishList</strong>. Введіть цей код підтвердження у форму реєстрації:
              </p>
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
                <tr>${digits}</tr>
              </table>
              <p style="margin:0 0 24px;font-size:13px;color:#9ca3af;text-align:center;">
                Або введіть код вручну: <strong style="color:#374151;font-size:20px;letter-spacing:4px;">${otp}</strong>
              </p>
              <hr style="border:none;border-top:1px solid #f3f4f6;margin:0 0 20px;" />
              <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.5;">
                Код дійсний протягом <strong>24 годин</strong>. Якщо ви не реєструвалися у WishList — просто проігноруйте цей лист.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#fafafa;padding:20px 40px;text-align:center;border-top:1px solid #f3f4f6;">
              <p style="margin:0;font-size:12px;color:#d1d5db;">© 2025 WishList. Усі права захищено.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── Dev mode: print OTP to console instead of sending ────────────────────────
function sendDevEmail(email, otp) {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║  [DEV] EMAIL VERIFICATION — no SMTP needed               ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log(`║  To:   ${email}`);
  console.log(`║  OTP:  ${otp}`);
  console.log('╚══════════════════════════════════════════════════════════╝\n');
}

// ── Main export ───────────────────────────────────────────────────────────────
async function sendVerificationEmail(email, name, otp) {
  if (process.env.EMAIL_VERIFICATION_DEV_MODE === 'true') {
    sendDevEmail(email, otp);
    return;
  }

  if (!isSmtpConfigured()) {
    console.error('[Email] Email sending failed: SMTP credentials are not configured');
    const err = new Error('smtp_not_configured');
    err.smtpCode = 'smtp_not_configured';
    throw err;
  }

  const from = process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.SMTP_USER;

  console.log(`[Email] Sending verification OTP to: ${email}`);

  try {
    await transporter.sendMail({
      from: `"WishList" <${from}>`,
      to: email,
      subject: 'Ваш код підтвердження — WishList',
      html: buildEmailHtml(name, otp),
      text: `Привіт, ${name}!\n\nВаш код підтвердження: ${otp}\n\nКод дійсний 24 години.`,
    });
    console.log(`[Email] OTP sent successfully to: ${email}`);
  } catch (raw) {
    const code = classifySmtpError(raw);
    console.error(`[Email] Email sending failed: ${raw.message}`);
    const err = new Error(code);
    err.smtpCode = code;
    throw err;
  }
}

module.exports = sendVerificationEmail;
module.exports.checkSmtpConfig = checkSmtpConfig;
