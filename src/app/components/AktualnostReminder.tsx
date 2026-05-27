import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router';
import { Card } from './Card';
import { Button } from './Button';
import { Badge } from './Badge';
import { useApp, Wish } from '../store/AppStore';
import { useLanguage } from '../i18n/LanguageContext';
import { Clock, CheckCircle, Edit, Archive, Gift } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';

interface AktualnostReminderProps {
  open: boolean;
  onClose: () => void;
}

export function isOverdue(wish: Wish): boolean {
  if (!wish.nextCheckAt) return false;
  return Date.now() >= new Date(wish.nextCheckAt).getTime();
}

export function AktualnostReminder({ open, onClose }: AktualnostReminderProps) {
  const { wishes, markWishAsRelevant, archiveWish } = useApp();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);

  const overdueWishes = useMemo(
    () => wishes.filter(w => !w.archived && isOverdue(w)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [wishes]
  );

  const currentWish = overdueWishes[currentIndex];

  const advance = () => {
    if (currentIndex < overdueWishes.length - 1) {
      setCurrentIndex(i => i + 1);
    } else {
      setCurrentIndex(0);
      onClose();
    }
  };

  const handleKeep = async () => {
    if (currentWish) await markWishAsRelevant(currentWish.id);
    advance();
  };

  const handleEdit = () => {
    if (currentWish) {
      onClose();
      navigate(`/wishlist/edit/${currentWish.id}`);
    }
  };

  const handleArchive = async () => {
    if (currentWish) await archiveWish(currentWish.id);
    advance();
  };

  if (!open) return null;

  if (overdueWishes.length === 0) {
    return (
      <Dialog.Root open={open} onOpenChange={onClose}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md">
            <Card className="text-center py-12">
              <Dialog.Title className="sr-only">{t('aktualnostReminder.dialogTitle')}</Dialog.Title>
              <Dialog.Description className="sr-only">{t('aktualnostReminder.allFreshTitle')}</Dialog.Description>
              <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">{t('aktualnostReminder.allFreshTitle')}</h2>
              <p className="text-foreground/60 mb-6">{t('aktualnostReminder.allFreshSubtitle')}</p>
              <Button variant="primary" onClick={onClose}>{t('aktualnostReminder.done')}</Button>
            </Card>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    );
  }

  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentWish?.id}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="relative">
                {/* Progress bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-muted rounded-t-3xl overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
                    style={{ width: `${((currentIndex + 1) / overdueWishes.length) * 100}%` }}
                  />
                </div>

                <div className="pt-6">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent to-primary flex items-center justify-center">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <Dialog.Title className="text-xl font-bold">{t('aktualnostReminder.dialogTitle')}</Dialog.Title>
                      <Dialog.Description className="text-sm text-foreground/60">
                        {currentIndex + 1} {t('aktualnostReminder.progress1')} {overdueWishes.length} {t('aktualnostReminder.progress2')}
                      </Dialog.Description>
                    </div>
                  </div>

                  {/* Wish card */}
                  <div className="mb-6">
                    <div className="relative rounded-2xl overflow-hidden mb-4">
                      {currentWish?.image ? (
                        <img
                          src={currentWish.image}
                          alt={currentWish.title}
                          className="w-full h-48 object-cover"
                        />
                      ) : (
                        <div className="w-full h-48 bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                          <Gift className="w-16 h-16 text-primary/30" />
                        </div>
                      )}
                      <div className="absolute top-4 right-4">
                        <Badge variant="warning">{t('aktualnostReminder.reviewNeeded')}</Badge>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <h3 className="text-2xl font-bold mb-1">{currentWish?.title}</h3>
                        <p className="text-lg text-primary font-semibold">
                          {currentWish?.currency} {currentWish?.price}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-foreground/60">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>
                            {t('aktualnostReminder.checkEvery')} {currentWish?.aktualnostDuration ?? 1} {t('aktualnostReminder.weeks')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          <span>{currentWish?.confidence}{t('aktualnostReminder.confidence')}</span>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-accent/10 border border-accent/20">
                        <p className="text-sm text-foreground/80">
                          <strong>{t('aktualnostReminder.questionTitle')}</strong>
                          {' '}{!currentWish?.lastChecked
                            ? t('aktualnostReminder.neverChecked')
                            : t('aktualnostReminder.notRecently')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-3">
                    <Button variant="primary" className="w-full" onClick={handleKeep}>
                      <CheckCircle className="w-5 h-5" />
                      {t('aktualnostReminder.keepButton')}
                    </Button>

                    <div className="grid grid-cols-2 gap-3">
                      <Button variant="outline" onClick={handleEdit}>
                        <Edit className="w-4 h-4" />
                        {t('aktualnostReminder.updateButton')}
                      </Button>
                      <Button variant="ghost" onClick={handleArchive}>
                        <Archive className="w-4 h-4" />
                        {t('aktualnostReminder.removeButton')}
                      </Button>
                    </div>
                  </div>

                  <Dialog.Close asChild>
                    <button
                      onClick={onClose}
                      className="w-full text-center text-sm text-foreground/60 hover:text-foreground mt-4"
                    >
                      {t('aktualnostReminder.reviewLater')}
                    </button>
                  </Dialog.Close>
                </div>
              </Card>
            </motion.div>
          </AnimatePresence>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
