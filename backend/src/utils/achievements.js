const User         = require('../models/User');
const Wish         = require('../models/Wish');
const Notification = require('../models/Notification');

// ── Achievement definitions ────────────────────────────────────────────────────
// condition.type: 'wish_count' | 'followers_count' | 'confirmed_wishes'
// condition.value: number threshold
// rewards.wishLimit: new cap (replaces if higher)
// rewards.features: array of feature-flag IDs unlocked

const ACHIEVEMENTS = [
  {
    id: 'first_wish',
    condition: { type: 'wish_count', value: 1 },
    rewards:   { wishLimit: 10, features: ['wish_categories'] },
  },
  {
    id: 'social_butterfly',
    condition: { type: 'followers_count', value: 10 },
    rewards:   { features: ['custom_profile', 'avatar_frame', 'animated_badge'] },
  },
  {
    id: 'relevance_pro',
    condition: { type: 'confirmed_wishes', value: 5 },
    rewards:   { features: ['smart_reminders', 'auto_checking', 'priority_notifications'] },
  },
  {
    id: 'top_curator',
    condition: { type: 'wish_count', value: 20 },
    rewards:   { wishLimit: 20, features: ['pin_wish', 'advanced_categories'] },
  },
];

// All features that can be unlocked (for premium bypass reference)
const ALL_FEATURES = [
  'wish_categories', 'custom_profile', 'avatar_frame', 'animated_badge',
  'smart_reminders', 'auto_checking', 'priority_notifications',
  'pin_wish', 'advanced_categories',
];

// ── Stats collector ────────────────────────────────────────────────────────────

async function getUserStats(userId) {
  const user = await User.findById(userId).lean();
  const [wishCount, confirmedWishes] = await Promise.all([
    Wish.countDocuments({ user: userId }),
    Wish.countDocuments({ user: userId, lastConfirmedAt: { $exists: true, $ne: null } }),
  ]);
  return {
    wishCount,
    followersCount: (user?.followers ?? []).length,
    confirmedWishes,
  };
}

// ── Condition evaluator ────────────────────────────────────────────────────────

function meetsCondition(condition, stats) {
  switch (condition.type) {
    case 'wish_count':       return stats.wishCount       >= condition.value;
    case 'followers_count':  return stats.followersCount  >= condition.value;
    case 'confirmed_wishes': return stats.confirmedWishes >= condition.value;
    default: return false;
  }
}

// ── Achievement granter ────────────────────────────────────────────────────────
// Checks all achievements for userId, grants any newly earned ones, and
// creates in-app notifications.  Returns array of newly granted IDs.

async function checkAndGrantAchievements(userId) {
  const user = await User.findById(userId);
  if (!user) return [];

  const stats        = await getUserStats(userId);
  const newlyGranted = [];

  for (const ach of ACHIEVEMENTS) {
    if ((user.achievements || []).includes(ach.id)) continue;
    if (!meetsCondition(ach.condition, stats)) continue;

    user.achievements.push(ach.id);

    // Bump wishLimit if this achievement raises it
    if (ach.rewards.wishLimit && ach.rewards.wishLimit > (user.wishLimit || 5)) {
      user.wishLimit = ach.rewards.wishLimit;
    }

    newlyGranted.push(ach.id);

    await Notification.create({
      user:    userId,
      type:    'achievement',
      message: `achievement:${ach.id}`,
      read:    false,
    });
  }

  if (newlyGranted.length > 0) await user.save();
  return newlyGranted;
}

// ── Feature-access helper ──────────────────────────────────────────────────────
// Call canUseFeature(user, 'feature_id') wherever you need to gate a feature.

function canUseFeature(user, featureName) {
  if (user.premium) return true;
  const unlockedFeatures = new Set();
  for (const ach of ACHIEVEMENTS) {
    if ((user.achievements || []).includes(ach.id)) {
      (ach.rewards.features || []).forEach(f => unlockedFeatures.add(f));
    }
  }
  return unlockedFeatures.has(featureName);
}

module.exports = {
  ACHIEVEMENTS,
  ALL_FEATURES,
  checkAndGrantAchievements,
  canUseFeature,
  getUserStats,
};
