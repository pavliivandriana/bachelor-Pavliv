const transporter = require('../config/mailer');

function isSmtpConfigured() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  return user && pass && user !== 'your@gmail.com' && pass !== 'your-app-password';
}

function buildAktualnostEmail({ userName, wish, confirmUrl, archiveUrl }) {
  const imageBlock = wish.image
    ? `<img src="${wish.image}" alt="" style="width:100%;max-height:220px;object-fit:cover;border-radius:12px;margin-bottom:20px;" />`
    : '';
  const priceStr = wish.price != null ? `${wish.currency ?? ''} ${wish.price.toLocaleString('uk-UA')}`.trim() : '';

  return `<!DOCTYPE html>
<html lang="uk">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Перевірка актуальності — WishList</title>
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
              <p style="margin:16px 0 0;font-size:28px;font-weight:700;color:#ffffff;">Перевірка актуальності</p>
              <p style="margin:6px 0 0;font-size:15px;color:rgba(255,255,255,.85);">Чи ще актуальне це бажання?</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px 28px;">
              <p style="margin:0 0 20px;font-size:16px;color:#374151;">Привіт, <strong>${userName}</strong>!</p>
              ${imageBlock}
              <div style="background:#f9fafb;border-radius:16px;padding:20px;margin-bottom:24px;">
                <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111827;">${wish.title}</h2>
                ${priceStr ? `<p style="margin:0;font-size:22px;font-weight:800;color:#8B5CF6;">${priceStr}</p>` : ''}
              </div>
              <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
                Ви додали це бажання до свого списку. Воно ще актуальне? Натисніть одну з кнопок нижче.
              </p>
              <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:16px;">
                <tr>
                  <td style="padding-right:8px;">
                    <a href="${confirmUrl}" style="display:block;background:linear-gradient(135deg,#8B5CF6,#EC4899);color:#ffffff;text-decoration:none;text-align:center;padding:14px 20px;border-radius:12px;font-weight:700;font-size:15px;">
                      ✓ Так, ще актуально!
                    </a>
                  </td>
                  <td style="padding-left:8px;">
                    <a href="${archiveUrl}" style="display:block;background:#f3f4f6;color:#6b7280;text-decoration:none;text-align:center;padding:14px 20px;border-radius:12px;font-weight:700;font-size:15px;border:1px solid #e5e7eb;">
                      Більше не актуально
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
                Ці посилання одноразові та дійсні протягом 30 днів.
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

async function sendAktualnostReminder({ email, userName, wish, confirmUrl, archiveUrl }) {
  if (process.env.EMAIL_VERIFICATION_DEV_MODE === 'true') {
    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║  [DEV] AKTUALNOST REMINDER EMAIL                         ║');
    console.log('╠══════════════════════════════════════════════════════════╣');
    console.log(`║  To:      ${email}`);
    console.log(`║  Wish:    ${wish.title}`);
    console.log(`║  Confirm: ${confirmUrl}`);
    console.log(`║  Archive: ${archiveUrl}`);
    console.log('╚══════════════════════════════════════════════════════════╝\n');
    return;
  }

  if (!isSmtpConfigured()) {
    console.warn('[Email] Skipping aktualnost reminder — SMTP not configured');
    return;
  }

  const from = process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.SMTP_USER;

  try {
    await transporter.sendMail({
      from: `"WishList" <${from}>`,
      to: email,
      subject: `Перевірка актуальності: ${wish.title}`,
      html: buildAktualnostEmail({ userName, wish, confirmUrl, archiveUrl }),
      text: `Привіт, ${userName}!\n\nЧи ще актуальне бажання "${wish.title}"?\n\nТак: ${confirmUrl}\n\nАрхівувати: ${archiveUrl}`,
    });
    console.log(`[Email] Aktualnost reminder sent to: ${email} for wish: ${wish.title}`);
  } catch (err) {
    console.error(`[Email] Failed to send aktualnost reminder: ${err.message}`);
  }
}

module.exports = { sendAktualnostReminder };
