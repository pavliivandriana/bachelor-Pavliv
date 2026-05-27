const crypto = require('crypto');

async function runAktualnostScheduler() {
  try {
    const Wish = require('./models/Wish');
    const User = require('./models/User');
    const { sendAktualnostReminder } = require('./utils/sendAktualnostReminder');

    const now = new Date();
    const apiUrl = process.env.API_URL || `http://localhost:${process.env.PORT || 5000}`;

    // Wishes where nextCheckAt has passed and no reminder sent for this cycle yet
    const overdueWishes = await Wish.find({
      archived:   { $ne: true },
      fulfilled:  { $ne: true },
      nextCheckAt: { $lte: now },
      $or: [
        { lastReminderSentAt: { $exists: false } },
        { lastReminderSentAt: null },
        { $expr: { $lt: ['$lastReminderSentAt', '$nextCheckAt'] } },
      ],
    }).limit(50);

    if (overdueWishes.length > 0) {
      console.log(`[Scheduler] Found ${overdueWishes.length} wish(es) needing aktualnost reminders`);
    }

    for (const wish of overdueWishes) {
      try {
        const user = await User.findById(wish.user).select('name email');
        if (!user || !user.email) continue;

        const token = crypto.randomBytes(32).toString('hex');
        const confirmUrl = `${apiUrl}/api/aktualnost/confirm?token=${token}`;
        const archiveUrl = `${apiUrl}/api/aktualnost/archive?token=${token}`;

        wish.reminderToken = token;
        wish.lastReminderSentAt = now;
        await wish.save();

        await sendAktualnostReminder({
          email: user.email,
          userName: user.name,
          wish,
          confirmUrl,
          archiveUrl,
        });
      } catch (err) {
        console.error(`[Scheduler] Failed to process wish ${wish._id}:`, err.message);
      }
    }
  } catch (err) {
    console.error('[Scheduler] Run error:', err.message);
  }
}

function startScheduler() {
  const intervalMs = parseInt(process.env.SCHEDULER_INTERVAL_MS) || 60_000;
  console.log(`[Scheduler] Aktualnost scheduler started (interval: ${intervalMs / 1000}s)`);
  setInterval(runAktualnostScheduler, intervalMs);
  // First run after 5s so the DB connection is settled
  setTimeout(runAktualnostScheduler, 5000);
}

module.exports = { startScheduler };
