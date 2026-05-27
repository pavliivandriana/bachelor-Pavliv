import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router';
import { Card } from '../Card';
import { Button } from '../Button';
import { Badge } from '../Badge';
import { useApp } from '../../store/AppStore';
import { useLanguage } from '../../i18n/LanguageContext';
import { Archive, RotateCcw, Trash2, Gift, Calendar } from 'lucide-react';

export function WishArchive() {
  const { wishes, restoreWish, deleteWish } = useApp();
  const { t, timeAgo } = useLanguage();
  const navigate = useNavigate();

  const archivedWishes = wishes.filter(w => w.archived);

  const handleRestore = async (id: string) => {
    await restoreWish(id);
  };

  const handleDeleteForever = async (id: string) => {
    if (!confirm(t('archive.deleteConfirm'))) return;
    await deleteWish(id);
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Badge variant="secondary" className="mb-4 inline-flex">
            <Archive className="w-3 h-3" />
            {t('archive.badge')}
          </Badge>
          <h1 className="text-3xl font-bold mb-2">{t('archive.title')}</h1>
          <p className="text-foreground/60">{t('archive.subtitle')}</p>
        </motion.div>

        {/* Count */}
        {archivedWishes.length > 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-foreground/50 mb-6"
          >
            {archivedWishes.length} {t('archive.count')}
          </motion.p>
        )}

        {/* Grid */}
        <AnimatePresence mode="popLayout">
          {archivedWishes.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {archivedWishes.map((wish, index) => (
                <motion.div
                  key={wish.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -20 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  layout
                >
                  <Card className="relative overflow-hidden group hover:shadow-lg transition-shadow duration-300">
                    {/* Top accent bar */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gray-300 to-gray-400 rounded-t-3xl" />

                    {/* Image */}
                    <div className="relative mb-4 pt-1">
                      {wish.image ? (
                        <img
                          src={wish.image}
                          alt={wish.title}
                          className="w-full h-44 object-cover rounded-2xl grayscale-[20%] opacity-80 group-hover:opacity-90 transition-all duration-300"
                        />
                      ) : (
                        <div className="w-full h-44 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                          <Gift className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                      <div className="absolute top-3 right-3">
                        <Badge variant="secondary" className="bg-card/90 text-muted-foreground border-border shadow-sm text-xs">
                          <Archive className="w-3 h-3" />
                          {t('archive.archivedBadge')}
                        </Badge>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-foreground/80 line-clamp-2 leading-snug">{wish.title}</h3>
                        <p className="text-primary font-bold mt-1">
                          {wish.currency} {wish.price.toLocaleString()}
                        </p>
                      </div>

                      {/* Archive date */}
                      {wish.archivedAt && (
                        <div className="flex items-center gap-1.5 text-xs text-foreground/50">
                          <Calendar className="w-3.5 h-3.5 shrink-0" />
                          {t('archive.archivedAt')}: {timeAgo(wish.archivedAt)}
                        </div>
                      )}

                      {/* Tags */}
                      {wish.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {wish.tags.slice(0, 3).map((tag, i) => (
                            <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-sm"
                          onClick={() => handleRestore(wish.id)}
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          {t('archive.restore')}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteForever(wish.id)}
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          title={t('archive.deleteForever')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-24"
            >
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mx-auto mb-6">
                <Archive className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-foreground/70">{t('archive.empty')}</h3>
              <p className="text-foreground/50 mb-8 max-w-sm mx-auto leading-relaxed">{t('archive.emptyDesc')}</p>
              <Button variant="outline" onClick={() => navigate('/wishlists')}>
                {t('nav.myWishes')}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
