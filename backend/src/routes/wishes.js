const router = require('express').Router();
const path = require('path');
const fs = require('fs');
const Wish = require('../models/Wish');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');
const requireVerified = require('../middleware/requireVerified');
const { fetchProductInfo, safeParseUrl, downloadImage } = require('../utils/productFetcher');

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');
const ALLOWED_IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp']);
const CONTENT_TYPE_TO_EXT = {
  'image/jpeg': '.jpg',
  'image/png':  '.png',
  'image/gif':  '.gif',
  'image/webp': '.webp',
};

router.use(auth);

router.post('/fetch-product-info', async (req, res, next) => {
  try {
    const { url } = req.body;
    console.log(`[fetch-product-info] Request URL: ${url}`);

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ success: false, message: 'URL is required' });
    }
    if (!safeParseUrl(url)) {
      return res.status(400).json({ success: false, message: 'Invalid or blocked URL' });
    }

    const data = await fetchProductInfo(url);
    console.log(`[fetch-product-info] Result:`, { title: data.title, price: data.price, currency: data.currency, hasImage: !!data.imageUrl });

    if (!data.title && !data.price && !data.imageUrl) {
      return res.json({ success: false, message: 'Не вдалося отримати інформацію за посиланням' });
    }

    res.json({
      success: true,
      data: {
        title:      data.title      || null,
        price:      data.price      || null,
        currency:   data.currency   || null,
        imageUrl:   data.imageUrl   || null,
        sourceUrl:  data.sourceUrl  || null,
        sourceHost: data.sourceHost || null,
      },
    });
  } catch {
    res.json({ success: false, message: 'Не вдалося отримати інформацію за посиланням' });
  }
});

router.post('/proxy-image', async (req, res) => {
  try {
    const { url, referer } = req.body;
    console.log(`[proxy-image] Request URL: ${url}, referer: ${referer || 'none'}`);

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ success: false, message: 'URL is required' });
    }
    const parsed = safeParseUrl(url);
    if (!parsed) {
      return res.status(400).json({ success: false, message: 'Invalid or blocked URL' });
    }

    const safeReferer = (referer && typeof referer === 'string' && safeParseUrl(referer)) ? referer : null;
    const { buffer, contentType } = await downloadImage(url, 3, 10000, safeReferer);
    console.log(`[proxy-image] Downloaded ${buffer.length} bytes, contentType: ${contentType}`);

    const extFromCt = CONTENT_TYPE_TO_EXT[contentType] || null;
    const extFromUrl = path.extname(parsed.pathname).toLowerCase().replace(/[?#].*$/, '');
    const ext = (extFromCt && ALLOWED_IMAGE_EXTS.has(extFromCt)) ? extFromCt
              : (extFromUrl && ALLOWED_IMAGE_EXTS.has(extFromUrl)) ? extFromUrl
              : '.jpg';

    if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    fs.writeFileSync(path.join(UPLOAD_DIR, filename), buffer);

    const baseUrl = `http://localhost:${process.env.PORT || 5000}`;
    const imageUrl = `${baseUrl}/uploads/${filename}`;
    console.log(`[proxy-image] Saved as: ${imageUrl}`);

    res.json({ success: true, imageUrl });
  } catch (err) {
    console.error(`[proxy-image] Error: ${err.message}`);
    res.json({ success: false, message: 'Could not download image' });
  }
});

router.get('/', async (req, res, next) => {
  try {
    const wishes = await Wish.find({ user: req.userId }).sort({ createdAt: -1 });
    res.json(wishes);
  } catch (err) { next(err); }
});

router.post('/', requireVerified, async (req, res, next) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.userId).lean();
    const wishLimit = user?.premium ? Infinity : (user?.wishLimit || 5);
    const activeCount = await Wish.countDocuments({ user: req.userId, archived: { $ne: true } });
    if (activeCount >= wishLimit) {
      return res.status(403).json({
        error: 'Wish limit reached',
        code:  'WISH_LIMIT_REACHED',
        wishLimit,
        wishCount: activeCount,
      });
    }
    const weeks = req.body.aktualnostDuration ?? 1;
    const nextCheckAt = new Date(Date.now() + weeks * 60 * 1000);
    const wish = await Wish.create({ ...req.body, user: req.userId, nextCheckAt });
    res.status(201).json(wish);
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const wish = await Wish.findById(req.params.id).populate('user', 'name username avatar');
    if (!wish) return res.status(404).json({ error: 'Wish not found' });
    const ownerId = wish.user._id ? wish.user._id.toString() : wish.user.toString();
    if (ownerId !== req.userId && wish.visibility === 'private') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    res.json(wish);
  } catch (err) { next(err); }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const { likes, comments, reserved, reservedBy, user, ...updates } = req.body;
    const wish = await Wish.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    if (!wish) return res.status(404).json({ error: 'Wish not found' });
    res.json(wish);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const wish = await Wish.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!wish) return res.status(404).json({ error: 'Wish not found' });
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.patch('/:id/reserve', async (req, res, next) => {
  try {
    const wish = await Wish.findById(req.params.id);
    if (!wish) return res.status(404).json({ error: 'Wish not found' });
    if (wish.user.toString() === req.userId) {
      return res.status(400).json({ error: 'Cannot reserve your own wish' });
    }
    if (wish.reserved) return res.status(400).json({ error: 'Already reserved' });

    wish.reserved = true;
    wish.reservedBy = req.userId;
    await wish.save();

    await Notification.create({
      user: wish.user,
      type: 'reservation',
      message: 'Someone reserved your wish!',
      from: req.userId,
      wish: wish._id,
    });

    res.json(wish);
  } catch (err) { next(err); }
});

router.patch('/:id/unreserve', async (req, res, next) => {
  try {
    const wish = await Wish.findById(req.params.id);
    if (!wish) return res.status(404).json({ error: 'Wish not found' });
    if (!wish.reservedBy || wish.reservedBy.toString() !== req.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    wish.reserved = false;
    wish.reservedBy = undefined;
    await wish.save();
    res.json(wish);
  } catch (err) { next(err); }
});

router.patch('/:id/fulfill', async (req, res, next) => {
  try {
    const wish = await Wish.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { fulfilled: true, fulfilledAt: new Date() },
      { new: true }
    );
    if (!wish) return res.status(404).json({ error: 'Wish not found' });
    res.json(wish);
  } catch (err) { next(err); }
});

router.patch('/:id/unfulfill', async (req, res, next) => {
  try {
    const wish = await Wish.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { fulfilled: false, $unset: { fulfilledAt: 1 } },
      { new: true }
    );
    if (!wish) return res.status(404).json({ error: 'Wish not found' });
    res.json(wish);
  } catch (err) { next(err); }
});

router.patch('/:id/relevant', async (req, res, next) => {
  try {
    const found = await Wish.findOne({ _id: req.params.id, user: req.userId });
    if (!found) return res.status(404).json({ error: 'Wish not found' });
    const now = new Date();
    const mins = found.aktualnostDuration ?? 1;
    const nextCheckAt = new Date(now.getTime() + mins * 60 * 1000);
    const wish = await Wish.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { lastChecked: now, lastConfirmedAt: now, nextCheckAt, $unset: { reminderToken: 1 } },
      { new: true }
    );
    res.json(wish);
  } catch (err) { next(err); }
});

router.post('/:id/like', async (req, res, next) => {
  try {
    const wish = await Wish.findById(req.params.id);
    if (!wish) return res.status(404).json({ error: 'Wish not found' });

    const idx = wish.likes.findIndex(id => id.toString() === req.userId);
    if (idx === -1) {
      wish.likes.push(req.userId);
      if (wish.user.toString() !== req.userId) {
        await Notification.create({
          user: wish.user,
          type: 'like',
          message: 'Someone liked your wish!',
          from: req.userId,
          wish: wish._id,
        });
      }
    } else {
      wish.likes.splice(idx, 1);
    }
    await wish.save();
    res.json(wish);
  } catch (err) { next(err); }
});

router.post('/:id/copy', requireVerified, async (req, res, next) => {
  try {
    const original = await Wish.findById(req.params.id);
    if (!original || original.visibility !== 'public') {
      return res.status(404).json({ error: 'Wish not found or not public' });
    }
    if (original.user.toString() === req.userId) {
      return res.status(400).json({ error: 'Cannot copy your own wish' });
    }
    const copy = await Wish.create({
      user:               req.userId,
      title:              original.title,
      image:              original.image,
      price:              original.price,
      currency:           original.currency,
      link:               original.link,
      tags:               [...original.tags],
      priority:           original.priority,
      confidence:         50,
      aktualnostDuration: original.aktualnostDuration,
      context:            original.context,
      visibility:         'friends',
    });
    res.status(201).json(copy);
  } catch (err) { next(err); }
});

router.post('/:id/comments', async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Comment text is required' });

    const wish = await Wish.findById(req.params.id);
    if (!wish) return res.status(404).json({ error: 'Wish not found' });

    wish.comments.push({ user: req.userId, text });
    await wish.save();

    if (wish.user.toString() !== req.userId) {
      await Notification.create({
        user: wish.user,
        type: 'comment',
        message: 'Someone commented on your wish!',
        from: req.userId,
        wish: wish._id,
      });
    }

    res.json(wish);
  } catch (err) { next(err); }
});

module.exports = router;
