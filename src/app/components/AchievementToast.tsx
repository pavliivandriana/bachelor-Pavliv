import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Users, CheckCircle2, Crown, X, Sparkles } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

const ACHIEVEMENT_META: Record<string, { emoji: string; Icon: React.ElementType; color: string }> = {
  first_wish:        { emoji: '⭐', Icon: Star,          color: 'from-yellow-400 to-orange-400' },
  social_butterfly:  { emoji: '🦋', Icon: Users,         color: 'from-purple-400 to-pink-500' },
  relevance_pro:     { emoji: '✅', Icon: CheckCircle2,  color: 'from-green-400 to-teal-500' },
  top_curator:       { emoji: '👑', Icon: Crown,         color: 'from-amber-400 to-yellow-500' },
};

const TITLE_KEYS: Record<string, string> = {
  first_wish:       'achievements.firstWish.title',
  social_butterfly: 'achievements.socialButterfly.title',
  relevance_pro:    'achievements.relevancePro.title',
  top_curator:      'achievements.topCurator.title',
};

const REWARD_KEYS: Record<string, string> = {
  first_wish:       'achievements.firstWish.reward',
  social_butterfly: 'achievements.socialButterfly.reward',
  relevance_pro:    'achievements.relevancePro.reward',
  top_curator:      'achievements.topCurator.reward',
};

interface Props {
  achievementId: string;
  onDismiss: () => void;
}

export function AchievementToast({ achievementId, onDismiss }: Props) {
  const { t } = useLanguage();
  const meta  = ACHIEVEMENT_META[achievementId] ?? ACHIEVEMENT_META.first_wish;
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence onExitComplete={onDismiss}>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 80, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[200] w-80 max-w-[90vw]"
        >
          <div className="relative overflow-hidden rounded-2xl shadow-2xl bg-card border border-border">
            {/* Gradient header strip */}
            <div className={`h-1.5 w-full bg-gradient-to-r ${meta.color}`} />

            <div className="p-4">
              {/* Dismiss button */}
              <button
                onClick={() => setVisible(false)}
                className="absolute top-3 right-3 w-6 h-6 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
              >
                <X className="w-3.5 h-3.5 text-foreground/50" />
              </button>

              {/* Icon + headline */}
              <div className="flex items-center gap-3 mb-3">
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.15, type: 'spring', stiffness: 500, damping: 20 }}
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${meta.color} flex items-center justify-center text-2xl shadow-lg flex-shrink-0`}
                >
                  {meta.emoji}
                </motion.div>
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wide mb-0.5">
                    <Sparkles className="w-3 h-3" />
                    {t('achievements.toastTitle')}
                  </div>
                  <p className="font-bold text-sm leading-tight">
                    {t(TITLE_KEYS[achievementId] ?? 'achievements.firstWish.title')}
                  </p>
                </div>
              </div>

              {/* Reward */}
              <div className="bg-muted rounded-xl px-3 py-2 text-xs text-foreground/70">
                <span className="font-semibold text-foreground/90">{t('achievements.rewardLabel')}: </span>
                {t(REWARD_KEYS[achievementId] ?? 'achievements.firstWish.reward')}
              </div>
            </div>

            {/* Auto-dismiss progress bar */}
            <motion.div
              className={`h-0.5 bg-gradient-to-r ${meta.color}`}
              initial={{ scaleX: 1, originX: 0 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: 4, ease: 'linear' }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Container that queues multiple achievement toasts one at a time
interface QueueProps {
  achievementIds: string[];
  onClear: (id: string) => void;
}

export function AchievementToastQueue({ achievementIds, onClear }: QueueProps) {
  if (achievementIds.length === 0) return null;
  return (
    <AchievementToast
      key={achievementIds[0]}
      achievementId={achievementIds[0]}
      onDismiss={() => onClear(achievementIds[0])}
    />
  );
}
