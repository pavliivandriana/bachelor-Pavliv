const router = require('express').Router();
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', async (req, res, next) => {
  try {
    const notifications = await Notification.find({ user: req.userId }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) { next(err); }
});

router.patch('/:id/read', async (req, res, next) => {
  try {
    const n = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { read: true },
      { new: true }
    );
    if (!n) return res.status(404).json({ error: 'Notification not found' });
    res.json(n);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const n = await Notification.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!n) return res.status(404).json({ error: 'Notification not found' });
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.delete('/', async (req, res, next) => {
  try {
    await Notification.deleteMany({ user: req.userId });
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
