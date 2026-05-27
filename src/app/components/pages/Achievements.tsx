import React, { useEffect, useState } from 'react';
import { motion, type TargetAndTransition } from 'motion/react';
import { api } from '../../../api/client';
import { useApp } from '../../store/AppStore';
import { useLanguage } from '../../i18n/LanguageContext';
import { Card } from '../Card';
import { Button } from '../Button';
import { PremiumModal } from '../PremiumModal';
import {
  Star, Users, CheckCircle2, Crown, Lock, Sparkles, Zap, Trophy, Rocket,
} from 'lucide-react';

// ── Achievement display metadata ───────────────────────────────────────────────

type ConditionType = 'wish_count' | 'followers_count' | 'confirmed_wishes';

interface AchievementDef {
  id: string;
  Icon: React.ElementType;
  gradient: string;
  iconAnimation: TargetAndTransition;
  conditionType: ConditionType;
  conditionValue: number;
}

const ACHIEVEMENT_DEFS: AchievementDef[] = [
  {
    id: 'first_wish', Icon: Star, gradient: 'from-yellow-400 to-orange-400',
    iconAnimation: { rotate: [0, 20, -20, 0], scale: [1, 1.2, 1] },
    conditionType: 'wish_count', conditionValue: 1,
  },
  {
    id: 'social_butterfly', Icon: Users, gradient: 'from-purple-400 to-pink-500',
    iconAnimation: { y: [0, -4, 0], scale: [1, 1.1, 1] },
    conditionType: 'followers_count', conditionValue: 10,
  },
  {
    id: 'relevance_pro', Icon: CheckCircle2, gradient: 'from-green-400 to-teal-500',
    iconAnimation: { scale: [1, 1.25, 1], rotate: [0, 10, 0] },
    conditionType: 'confirmed_wishes', conditionValue: 5,
  },
  {
    id: 'top_curator', Icon: Crown, gradient: 'from-amber-400 to-yellow-500',
    iconAnimation: { y: [0, -3, 0], rotate: [-5, 5, -5, 0] },
    conditionType: 'wish_count', conditionValue: 20,
  },
];

const TITLE_KEY:  Record<string, string> = {
  first_wish:       'achievements.firstWish.title',
  social_butterfly: 'achievements.socialButterfly.title',
  relevance_pro:    'achievements.relevancePro.title',
  top_curator:      'achievements.topCurator.title',
};
const DESC_KEY:   Record<string, string> = {
  first_wish:       'achievements.firstWish.desc',
  social_butterfly: 'achievements.socialButterfly.desc',
  relevance_pro:    'achievements.relevancePro.desc',
  top_curator:      'achievements.topCurator.desc',
};
const REWARD_KEY: Record<string, string> = {
  first_wish:       'achievements.firstWish.reward',
  social_butterfly: 'achievements.socialButterfly.reward',
  relevance_pro:    'achievements.relevancePro.reward',
  top_curator:      'achievements.topCurator.reward',
};

// ── Backend response type ─────────────────────────────────────────────────────

interface AchievementsData {
  premium:          boolean;
  wishLimit:        number;
  userAchievements: string[];
  progress: {
    wishCount:        number;
    followersCount:   number;
    confirmedWishes:  number;
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getStatValue(type: ConditionType, progress: AchievementsData['progress']): number {
  switch (type) {
    case 'wish_count':       return progress.wishCount;
    case 'followers_count':  return progress.followersCount;
    case 'confirmed_wishes': return progress.confirmedWishes;
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function WishSlotsCard({ data, wishes }: { data: AchievementsData; wishes: { archived?: boolean }[] }) {
  const { t } = useLanguage();
  const activeWishes = wishes.filter(w => !w.archived).length;
  const pct = Math.min((activeWishes / data.wishLimit) * 100, 100);
  const isPremium = data.premium;

  return (
    <Card className="mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Zap className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">{t('achievements.wishLimitLabel')}</h3>
          <p className="text-xs text-foreground/60">{t('achievements.wishLimitDesc')}</p>
        </div>
        {isPremium && (
          <span className="ml-auto px-2.5 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-amber-400 to-yellow-500 text-white shadow">
            {t('achievements.premiumBadge')}
          </span>
        )}
      </div>

      <div className="flex items-end justify-between mb-2">
        <span className="text-3xl font-bold text-primary">{activeWishes}</span>
        <span className="text-foreground/50 text-sm">
          {t('achievements.progressOf')} {isPremium ? '∞' : data.wishLimit}
        </span>
      </div>

      <div className="h-2.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full rounded-full ${pct >= 100 ? 'bg-gradient-to-r from-rose-400 to-pink-500' : 'bg-gradient-to-r from-primary to-accent'}`}
        />
      </div>

      {!isPremium && pct >= 100 && (
        <p className="mt-3 text-xs text-rose-500 font-medium">{t('achievements.limitReachedDesc')}</p>
      )}
    </Card>
  );
}

function PremiumCard({ isPremium, onUpgrade }: { isPremium: boolean; onUpgrade: () => void }) {
  const { t } = useLanguage();

  if (isPremium) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl p-5 mb-6 bg-gradient-to-br from-amber-400/20 via-yellow-300/10 to-orange-400/20 border border-amber-400/30"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-lg">
            <motion.div
              animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.15, 1] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Sparkles className="w-6 h-6 text-white" />
            </motion.div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-amber-600 dark:text-amber-400">{t('achievements.premiumTitle')}</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-400 text-white">{t('achievements.premiumBadge')}</span>
            </div>
            <p className="text-sm text-foreground/70 mt-0.5">{t('achievements.allFeaturesForPremium')}</p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl p-5 mb-6 bg-gradient-to-br from-primary/5 to-accent/10 border border-primary/20"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg flex-shrink-0">
            <motion.div
              animate={{ y: [0, -4, 0], rotate: [-8, 8, -8, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Rocket className="w-6 h-6 text-white" />
            </motion.div>
          </div>
          <div>
            <p className="font-bold">{t('achievements.premiumCta')}</p>
            <p className="text-xs text-foreground/60 mt-0.5">{t('achievements.premiumCtaDesc')}</p>
          </div>
        </div>
        <Button variant="primary" size="sm" className="flex-shrink-0" onClick={onUpgrade}>
          <Sparkles className="w-3.5 h-3.5" />
          Premium
        </Button>
      </div>
    </motion.div>
  );
}

function AchievementCard({
  def,
  unlocked,
  current,
  isPremium,
  index,
}: {
  def: AchievementDef;
  unlocked: boolean;
  current: number;
  isPremium: boolean;
  index: number;
}) {
  const { t } = useLanguage();
  const isUnlocked = unlocked || isPremium;
  const pct = Math.min((current / def.conditionValue) * 100, 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.07 }}
    >
      <Card className={`relative overflow-hidden transition-all duration-300 ${isUnlocked ? 'ring-1 ring-primary/20' : 'opacity-80'}`}>
        {/* Top gradient bar */}
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${isUnlocked ? def.gradient : 'from-muted to-muted-foreground/20'}`} />

        <div className="pt-2">
          {/* Header row */}
          <div className="flex items-start gap-3 mb-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-md flex-shrink-0 ${
              isUnlocked
                ? `bg-gradient-to-br ${def.gradient}`
                : 'bg-muted'
            }`}>
              {isUnlocked ? (
                <motion.div
                  animate={def.iconAnimation}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: index * 0.3 }}
                >
                  <def.Icon className="w-6 h-6 text-white" />
                </motion.div>
              ) : (
                <Lock className="w-5 h-5 text-foreground/30" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-sm">{t(TITLE_KEY[def.id])}</h3>
                {isUnlocked && (
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r ${def.gradient} text-white`}>
                    <CheckCircle2 className="w-3 h-3" />
                    {isPremium && !unlocked ? t('achievements.premiumBadge') : t('achievements.unlocked')}
                  </span>
                )}
              </div>
              <p className="text-xs text-foreground/60 mt-0.5 line-clamp-2">{t(DESC_KEY[def.id])}</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-3">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-foreground/50">{t('achievements.progressOf')} {def.conditionValue}</span>
              <span className={`font-semibold ${isUnlocked ? 'text-primary' : 'text-foreground/50'}`}>
                {Math.min(current, def.conditionValue)} / {def.conditionValue}
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${isUnlocked ? 100 : pct}%` }}
                transition={{ duration: 0.8, delay: index * 0.07 + 0.2, ease: 'easeOut' }}
                className={`h-full rounded-full bg-gradient-to-r ${isUnlocked ? def.gradient : 'from-foreground/20 to-foreground/10'}`}
              />
            </div>
          </div>

          {/* Reward */}
          <div className={`rounded-xl px-3 py-2 text-xs ${isUnlocked ? 'bg-primary/5 border border-primary/10' : 'bg-muted'}`}>
            <span className={`font-semibold ${isUnlocked ? 'text-primary' : 'text-foreground/40'}`}>
              {t('achievements.rewardLabel')}:&nbsp;
            </span>
            <span className={isUnlocked ? 'text-foreground/80' : 'text-foreground/30'}>
              {t(REWARD_KEY[def.id])}
            </span>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export function Achievements() {
  const { wishes, currentUser } = useApp();
  const { t }      = useLanguage();
  const [data, setData]             = useState<AchievementsData | null>(null);
  const [loading, setLoading]       = useState(true);
  const [showPremium, setShowPremium] = useState(false);

  useEffect(() => {
    api.get<AchievementsData>('/achievements')
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Sync premium status from store into local data when user upgrades
  useEffect(() => {
    if (currentUser?.premium && data && !data.premium) {
      setData(d => d ? { ...d, premium: true, wishLimit: 999 } : d);
    }
  }, [currentUser?.premium]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg flex-shrink-0">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{t('achievements.title')}</h1>
            <p className="text-foreground/60 text-sm">{t('achievements.subtitle')}</p>
          </div>
        </motion.div>

        {/* Wish slots */}
        <WishSlotsCard data={data} wishes={wishes} />

        {/* Premium banner */}
        <PremiumCard isPremium={data.premium} onUpgrade={() => setShowPremium(true)} />

        {/* Achievement grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {ACHIEVEMENT_DEFS.map((def, i) => (
            <AchievementCard
              key={def.id}
              def={def}
              unlocked={data.userAchievements.includes(def.id)}
              current={getStatValue(def.conditionType, data.progress)}
              isPremium={data.premium}
              index={i}
            />
          ))}
        </div>

      </div>
      <PremiumModal open={showPremium} onClose={() => setShowPremium(false)} />
    </div>
  );
}
