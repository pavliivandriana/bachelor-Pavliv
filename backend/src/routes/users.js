const router = require('express').Router();
const User = require('../models/User');
const Wish = require('../models/Wish');
const AntiWishItem = require('../models/AntiWishItem');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/search', async (req, res, next) => {
  try {
    const { q } = req.query;
    const filter = q && q.trim().length >= 2
      ? { $or: [{ name: { $regex: q.trim(), $options: 'i' } }, { username: { $regex: q.trim(), $options: 'i' } }] }
      : {};
    const users = await User.find({ ...filter, _id: { $ne: req.userId }, searchVisible: { $ne: false } })
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(30);
    res.json(users);
  } catch (err) { next(err); }
});

router.get('/me/followers', async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).populate('followers', '-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user.followers);
  } catch (err) { next(err); }
});

router.get('/me/following', async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).populate('following', '-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user.following);
  } catch (err) { next(err); }
});

router.get('/me', async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) { next(err); }
});

router.patch('/me', async (req, res, next) => {
  try {
    const { password, email, followers, following, ...updates } = req.body;
    const user = await User.findByIdAndUpdate(req.userId, updates, { new: true, runValidators: true });
    res.json(user);
  } catch (err) { next(err); }
});

router.delete('/me', async (req, res, next) => {
  try {
    const userId = req.userId;
    await Promise.all([
      Wish.deleteMany({ user: userId }),
      AntiWishItem.deleteMany({ user: userId }),
      Notification.deleteMany({ $or: [{ user: userId }, { from: userId }] }),
      User.updateMany(
        { $or: [{ followers: userId }, { following: userId }] },
        { $pull: { followers: userId, following: userId } }
      ),
    ]);
    await User.findByIdAndDelete(userId);
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
