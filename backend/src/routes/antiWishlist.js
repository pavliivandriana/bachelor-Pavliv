const router = require('express').Router();
const AntiWishItem = require('../models/AntiWishItem');
const auth = require('../middleware/auth');
const requireVerified = require('../middleware/requireVerified');

router.use(auth);

router.get('/', async (req, res, next) => {
  try {
    const items = await AntiWishItem.find({ user: req.userId }).sort({ createdAt: -1 });
    res.json(items);
  } catch (err) { next(err); }
});

router.post('/', requireVerified, async (req, res, next) => {
  try {
    const { category, item, reason } = req.body;
    if (!category || !item) {
      return res.status(400).json({ error: 'Category and item are required' });
    }
    const antiItem = await AntiWishItem.create({ user: req.userId, category, item, reason });
    res.status(201).json(antiItem);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const antiItem = await AntiWishItem.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!antiItem) return res.status(404).json({ error: 'Item not found' });
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
