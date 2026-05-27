const router = require('express').Router();
const auth   = require('../middleware/auth');
const User   = require('../models/User');
const { ALL_FEATURES } = require('../utils/achievements');

router.use(auth);

// POST /api/premium/activate — grant premium to current user
router.post('/activate', async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.premium   = true;
    user.wishLimit = 999;
    await user.save();

    res.json({
      premium:   true,
      wishLimit: user.wishLimit,
      features:  ALL_FEATURES,
    });
  } catch (err) { next(err); }
});

// GET /api/premium/status
router.get('/status', async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).lean();
    res.json({ premium: user?.premium || false, wishLimit: user?.wishLimit || 5 });
  } catch (err) { next(err); }
});

module.exports = router;
