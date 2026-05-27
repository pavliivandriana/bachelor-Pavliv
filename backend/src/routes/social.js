const router = require('express').Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const Wish = require('../models/Wish');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');
const requireVerified = require('../middleware/requireVerified');

router.use(auth);

// ── Public discovery feed ─────────────────────────────────────────────────────
router.get('/discovery', async (req, res, next) => {
  try {
    const { search, tag, sort = 'new', page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page) - 1) * Math.min(parseInt(limit) || 20, 50);
    const lim  = Math.min(parseInt(limit) || 20, 50);

    // Exclude wishes from users with private profiles
    const privateUsers = await User.find({ profileVisibility: 'private' }).select('_id').lean();
    const privateIds = privateUsers.map(u => u._id);

    const matchStage = {
      visibility: 'public',
      archived:   { $ne: true },
      fulfilled:  { $ne: true },
      user:       { $ne: new mongoose.Types.ObjectId(req.userId), $nin: privateIds },
    };

    if (tag) matchStage.tags = tag;
    if (search) {
      matchStage.$or = [
        { title:   { $regex: search, $options: 'i' } },
        { context: { $regex: search, $options: 'i' } },
        { tags:    { $regex: search, $options: 'i' } },
      ];
    }

    const sortStage =
      sort === 'popular'     ? { likesCount: -1, createdAt: -1 } :
      sort === 'recommended' ? { priority: -1, likesCount: -1, createdAt: -1 } :
                               { createdAt: -1 };

    const pipeline = [
      { $match: matchStage },
      { $addFields: { likesCount: { $size: { $ifNull: ['$likes', []] } } } },
      { $sort: sortStage },
      { $facet: {
        wishes: [
          { $skip: skip },
          { $limit: lim },
          { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'userArr' } },
          { $unwind: '$userArr' },
          { $addFields: {
            user: {
              id:       { $toString: '$userArr._id' },
              name:     '$userArr.name',
              username: '$userArr.username',
              avatar:   '$userArr.avatar',
            },
          }},
          { $project: { userArr: 0, __v: 0 } },
        ],
        total: [{ $count: 'n' }],
      }},
    ];

    const [{ wishes, total }] = await Wish.aggregate(pipeline);
    const totalCount = total[0]?.n ?? 0;

    const result = wishes.map(w => ({
      ...w,
      id:       w._id.toString(),
      likes:    (w.likes    || []).map(id => id.toString()),
      comments: (w.comments || []).map(c => ({
        id:        c._id ? c._id.toString() : '',
        user:      c.user ? c.user.toString() : '',
        text:      c.text,
        createdAt: c.createdAt,
      })),
    }));

    res.json({ wishes: result, total: totalCount, hasMore: skip + result.length < totalCount });
  } catch (err) { next(err); }
});

// ── Friends feed (followed users only) ────────────────────────────────────────
router.get('/feed', async (req, res, next) => {
  try {
    const me = await User.findById(req.userId);
    if (!me.following.length) return res.json([]);

    const myFollowerIds = (me.followers || []).map(id => id.toString());

    // Get followed users — exclude private profiles; for 'friends' check mutual follow
    const followedUsers = await User.find({ _id: { $in: me.following } })
      .select('_id profileVisibility followers').lean();

    const allowedIds = followedUsers
      .filter(u => {
        const vis = u.profileVisibility ?? 'public';
        if (vis === 'private') return false;
        if (vis === 'friends') {
          // mutual: they must also follow me
          return (u.followers || []).some(id => id.toString() === req.userId);
        }
        return true;
      })
      .map(u => u._id);

    if (!allowedIds.length) return res.json([]);

    const wishes = await Wish.find({
      user:       { $in: allowedIds },
      visibility: { $in: ['public', 'friends'] },
      archived:   { $ne: true },
      fulfilled:  { $ne: true },
    })
      .populate('user', 'name username avatar')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(wishes);
  } catch (err) { next(err); }
});

router.get('/users/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isSelf = req.params.id === req.userId;

    if (!isSelf) {
      const visibility = user.profileVisibility ?? 'public';
      if (visibility === 'private') {
        return res.status(403).json({ error: 'Profile is private' });
      }
      if (visibility === 'friends') {
        const me = await User.findById(req.userId).select('following');
        const iFollow = me?.following?.some(id => id.toString() === req.params.id);
        const theyFollow = user.followers?.some(id => id.toString() === req.userId);
        if (!iFollow || !theyFollow) {
          return res.status(403).json({ error: 'Profile is friends only' });
        }
      }
    }

    const wishFilter = { user: req.params.id, archived: { $ne: true }, fulfilled: { $ne: true } };
    if (!isSelf) {
      wishFilter.visibility = 'public';
    }
    const wishes = await Wish.find(wishFilter).sort({ createdAt: -1 });

    res.json({ user, wishes });
  } catch (err) { next(err); }
});

router.post('/users/:id/follow', requireVerified, async (req, res, next) => {
  try {
    if (req.params.id === req.userId) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }
    const [me, target] = await Promise.all([
      User.findById(req.userId),
      User.findById(req.params.id),
    ]);
    if (!target) return res.status(404).json({ error: 'User not found' });

    const alreadyFollowing = me.following.some(id => id.toString() === req.params.id);
    if (!alreadyFollowing) {
      me.following.push(req.params.id);
      target.followers.push(req.userId);
      await Promise.all([me.save(), target.save()]);

      await Notification.create({
        user: req.params.id,
        type: 'follow',
        message: `${me.name} started following you`,
        from: req.userId,
      });
    }

    res.json({ following: me.following.map(id => id.toString()) });
  } catch (err) { next(err); }
});

router.delete('/users/:id/follow', async (req, res, next) => {
  try {
    const [me, target] = await Promise.all([
      User.findById(req.userId),
      User.findById(req.params.id),
    ]);
    if (!target) return res.status(404).json({ error: 'User not found' });

    me.following = me.following.filter(id => id.toString() !== req.params.id);
    target.followers = target.followers.filter(id => id.toString() !== req.userId);
    await Promise.all([me.save(), target.save()]);

    res.json({ following: me.following.map(id => id.toString()) });
  } catch (err) { next(err); }
});

module.exports = router;
