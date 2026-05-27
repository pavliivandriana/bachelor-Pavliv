import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../store/AppStore';
import { useLanguage } from '../i18n/LanguageContext';
import { Button } from './Button';
import {
  X, Sparkles, Star, Users,
  Pin, Infinity as InfinityIcon, Rocket,
} from 'lucide-react';

const FEATURES = [
  { icon: InfinityIcon, key: 'premium.featureWishes' },
  { icon: Star,         key: 'premium.featureCategories' },
  { icon: Users,        key: 'premium.featureProfile' },
  { icon: Sparkles,     key: 'premium.featureBadge' },
  { icon: Pin,          key: 'premium.featurePin' },
];

interface PremiumModalProps {
  open: boolean;
  onClose: () => void;
}

export function PremiumModal({ open, onClose }: PremiumModalProps) {
  const { currentUser, activatePremium } = useApp();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const isPremium = currentUser?.premium;

  const handleActivate = async () => {
    setLoading(true);
    try {
      await activatePremium();
      setDone(true);
      setTimeout(onClose, 1800);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-background rounded-3xl shadow-2xl w-full max-w-md pointer-events-auto overflow-hidden">

              {/* Header gradient */}
              <div className="relative bg-gradient-to-br from-primary to-accent px-6 pt-8 pb-10">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>

                <div className="flex items-center gap-4 mb-3">
                  <motion.div
                    animate={{ y: [0, -5, 0], rotate: [-8, 8, -8, 0] }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                    className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shadow-lg"
                  >
                    <Rocket className="w-7 h-7 text-white" />
                  </motion.div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-bold text-white">{t('premium.title')}</h2>
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-white/25 text-white">
                        {t('achievements.premiumBadge')}
                      </span>
                    </div>
                    <p className="text-white/80 text-sm mt-0.5">{t('premium.subtitle')}</p>
                  </div>
                </div>
              </div>

              {/* Feature list */}
              <div className="px-6 -mt-4">
                <div className="bg-background rounded-2xl border border-border shadow-sm p-4 space-y-3">
                  {FEATURES.map(({ icon: Icon, key }) => (
                    <div key={key} className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <span className="text-sm text-foreground/80">{t(key)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action */}
              <div className="px-6 py-5">
                {isPremium || done ? (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-amber-400/20 to-yellow-300/20 border border-amber-400/40"
                  >
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    <span className="font-bold text-amber-600 dark:text-amber-400">
                      {t('premium.activeLabel')}
                    </span>
                  </motion.div>
                ) : (
                  <Button
                    variant="primary"
                    className="w-full justify-center py-3 text-base font-bold"
                    onClick={handleActivate}
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        {t('premium.activateButton')}
                      </>
                    )}
                  </Button>
                )}
                <p className="text-center text-xs text-foreground/40 mt-3">{t('premium.disclaimer')}</p>
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
