const router = require('express').Router();
const Wish = require('../models/Wish');

function pageHtml(title, message) {
  return `<!DOCTYPE html>
<html lang="uk">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} — WishList</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #f5f0ff;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 16px;
    }
    .card {
      background: white; border-radius: 24px; padding: 48px 40px;
      text-align: center; max-width: 420px; width: 100%;
      box-shadow: 0 4px 32px rgba(180,130,255,.15);
    }
    .logo {
      background: linear-gradient(135deg,#F2A6C8,#CDB8FF,#FF8E8E);
      border-radius: 16px; padding: 10px 20px; display: inline-block;
      margin-bottom: 28px; font-size: 20px; font-weight: 800; color: white;
    }
    h1 { margin-bottom: 12px; font-size: 26px; color: #111827; }
    p { font-size: 15px; color: #6b7280; line-height: 1.7; }
    strong { color: #374151; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">&#10084; WishList</div>
    <h1>${title}</h1>
    <p>${message}</p>
  </div>
</body>
</html>`;
}

// GET /api/aktualnost/confirm?token=xxx
router.get('/confirm', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).send(pageHtml('Помилка', 'Токен не надано.'));

    const wish = await Wish.findOne({ reminderToken: token });
    if (!wish) {
      return res.send(pageHtml('Посилання недійсне', 'Це посилання вже було використано або є недійсним.'));
    }

    const now = new Date();
    const mins = wish.aktualnostDuration ?? 1;
    const nextCheckAt = new Date(now.getTime() + mins * 60 * 1000);

    wish.lastConfirmedAt = now;
    wish.lastChecked = now;
    wish.nextCheckAt = nextCheckAt;
    wish.reminderToken = null;
    await wish.save();

    const nextDate = nextCheckAt.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' });
    res.send(pageHtml('Чудово! ✓', `Бажання <strong>"${wish.title}"</strong> підтверджено як актуальне.<br/><br/>Наступна перевірка: ${nextDate}.`));
  } catch (err) {
    console.error('[Aktualnost] confirm error:', err);
    res.status(500).send(pageHtml('Помилка', 'Щось пішло не так. Спробуйте пізніше.'));
  }
});

// GET /api/aktualnost/archive?token=xxx
router.get('/archive', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).send(pageHtml('Помилка', 'Токен не надано.'));

    const wish = await Wish.findOne({ reminderToken: token });
    if (!wish) {
      return res.send(pageHtml('Посилання недійсне', 'Це посилання вже було використано або є недійсним.'));
    }

    wish.archived = true;
    wish.archivedAt = new Date();
    wish.reminderToken = null;
    await wish.save();

    res.send(pageHtml('Зрозуміло!', `Бажання <strong>"${wish.title}"</strong> переміщено в архів.<br/><br/>Ви завжди можете відновити його у своєму профілі.`));
  } catch (err) {
    console.error('[Aktualnost] archive error:', err);
    res.status(500).send(pageHtml('Помилка', 'Щось пішло не так. Спробуйте пізніше.'));
  }
});

module.exports = router;
