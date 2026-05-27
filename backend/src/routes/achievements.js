const router = require('express').Router();
const auth   = require('../middleware/auth');
const User   = require('../models/User');
const {
  ACHIEVEMENTS,
  checkAndGrantAchievements,
  getUserStats,
} = require('../utils/achievements');

router.use(auth);

// GET /api/achievements — current user's achievement status + progress stats
router.get('/', async (req, res, next) => {
  try {
    await checkAndGrantAchievements(req.userId);
    const user  = await User.findById(req.userId).lean();
    const stats = await getUserStats(req.userId);

    res.json({
      premium:          user.premium      || false,
      wishLimit:        user.wishLimit    || 5,
      userAchievements: user.achievements || [],
      progress: stats,
    });
  } catch (err) { next(err); }
});

// POST /api/achievements/check — trigger achievement evaluation
// Called from the frontend after relevant user actions.
router.post('/check', async (req, res, next) => {
  try {
    const newlyGranted = await checkAndGrantAchievements(req.userId);
    const user         = await User.findById(req.userId).lean();

    res.json({
      newlyGranted,
      wishLimit:        user.wishLimit    || 5,
      userAchievements: user.achievements || [],
    });
  } catch (err) { next(err); }
});

module.exports = router;
