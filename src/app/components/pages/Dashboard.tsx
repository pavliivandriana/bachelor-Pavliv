import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router';
import { Card } from '../Card';
import { Button } from '../Button';
import { Badge } from '../Badge';
import { useApp } from '../../store/AppStore';
import { useLanguage } from '../../i18n/LanguageContext';
import { AktualnostReminder, isOverdue } from '../AktualnostReminder';
import {
  Plus,
  TrendingUp,
  Users,
  Gift,
  Clock,
  Star,
  Heart,
  AlertCircle,
  MessageCircle,
  UserPlus,
  X,
} from 'lucide-react';

export function Dashboard() {
  const { currentUser, wishes, notifications } = useApp();
  const { t, timeAgo } = useLanguage();
  const navigate = useNavigate();
  const [showReminder, setShowReminder] = useState(false);
  const [reminderDismissed, setReminderDismissed] = useState(false);

  const totalWishes = wishes.length;
  const reservedCount = wishes.filter(w => w.reserved).length;
  const avgAktualnost = wishes.length > 0
    ? Math.round(wishes.reduce((acc, w) => acc + w.confidence, 0) / wishes.length)
    : 0;

  const overdueCount = wishes.filter(w => !w.archived && !w.fulfilled && isOverdue(w)).length;
  const recentWishes = wishes.slice(0, 3);

  type Activity = { icon: React.ElementType; title: string; description: string; time: string; gradient: string };
  const activities: Activity[] = [];

  for (const w of wishes.slice(0, 3)) {
    activities.push({
      icon: Gift,
      title: t('dashboard.actWishAdded'),
      description: w.title,
      time: timeAgo(w.createdAt),
      gradient: 'from-primary to-accent',
    });
  }

  const activityMap: Record<string, { icon: React.ElementType; gradient: string; titleKey: string }> = {
    reservation: { icon: Gift,          gradient: 'from-secondary to-primary', titleKey: 'dashboard.actGiftReserved' },
    like:        { icon: Heart,         gradient: 'from-accent to-primary',    titleKey: 'dashboard.actLiked' },
    comment:     { icon: MessageCircle, gradient: 'from-primary to-secondary', titleKey: 'dashboard.actComment' },
    follow:      { icon: UserPlus,      gradient: 'from-secondary to-accent',  titleKey: 'dashboard.actFollower' },
    aktualnost:  { icon: Clock,         gradient: 'from-accent to-secondary',  titleKey: 'dashboard.actAktualnost' },
  };

  for (const n of notifications.slice(0, 4)) {
    const m = activityMap[n.type] ?? activityMap.aktualnost;
    activities.push({ icon: m.icon, gradient: m.gradient, title: t(m.titleKey), description: n.message, time: timeAgo(n.createdAt) });
  }

  const visibleActivities = activities.slice(0, 4);

  const wishCount = (n: number) => {
    if (n === 1) return `1 ${t('dashboard.wish1')}`;
    if (n < 5) return `${n} ${t('dashboard.wish2to4')}`;
    return `${n} ${t('dashboard.wish5plus')}`;
  };

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">{t('dashboard.welcome')}, {currentUser?.name?.split(' ')[0]}!</h1>
          <p className="text-foreground/60">{t('dashboard.subtitle')}</p>
        </div>
        <Button variant="primary" className="mt-4 md:mt-0" onClick={() => navigate('/wishlists')}>
          <Plus className="w-5 h-5" />
          {t('dashboard.addWish')}
        </Button>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full blur-2xl" />
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <Gift className="w-5 h-5 text-foreground/60" />
                <Badge variant="success">+12%</Badge>
              </div>
              <p className="text-3xl font-bold mb-1">{totalWishes}</p>
              <p className="text-sm text-foreground/60">{t('dashboard.statWishes')}</p>
            </div>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full blur-2xl" />
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <Heart className="w-5 h-5 text-foreground/60" />
                <Badge variant="primary">{t('common.live')}</Badge>
              </div>
              <p className="text-3xl font-bold mb-1">{reservedCount}</p>
              <p className="text-sm text-foreground/60">{t('dashboard.statReserved')}</p>
            </div>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full blur-2xl" />
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-5 h-5 text-foreground/60" />
                <Badge variant="success">+8%</Badge>
              </div>
              <p className="text-3xl font-bold mb-1">{currentUser?.followers.length || 0}</p>
              <p className="text-sm text-foreground/60">{t('dashboard.statFollowers')}</p>
            </div>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full blur-2xl" />
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-5 h-5 text-foreground/60" />
                <Badge variant="primary">{avgAktualnost}%</Badge>
              </div>
              <p className="text-3xl font-bold mb-1">{avgAktualnost}%</p>
              <p className="text-sm text-foreground/60">{t('dashboard.statAktualnost')}</p>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Актуальність Alerts */}
      {overdueCount > 0 && !reminderDismissed && (
        <Card className="mb-8 bg-gradient-to-br from-accent/10 to-primary/10 border-accent/20">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-accent" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-2">{t('dashboard.aktualnostAlert')}</h3>
              <p className="text-sm text-foreground/70 mb-4">
                {wishCount(overdueCount)} {t('dashboard.aktualnostAlertSuffix')}
              </p>
              <Button variant="outline" size="sm" onClick={() => setShowReminder(true)}>
                {t('dashboard.review')}
              </Button>
            </div>
            <button
              onClick={() => setReminderDismissed(true)}
              className="text-foreground/40 hover:text-foreground/70 transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </Card>
      )}
      <AktualnostReminder open={showReminder} onClose={() => setShowReminder(false)} />

      {/* Recent Wishes */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">{t('dashboard.recentWishes')}</h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('/wishlists')}>
            {t('dashboard.viewAll')}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recentWishes.length > 0 ? recentWishes.map((wish, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card hover className="group cursor-pointer" onClick={() => navigate(`/wishes/${wish.id}`)}>
                <div className="relative mb-4">
                  {wish.image ? (
                    <img
                      src={wish.image}
                      alt={wish.title}
                      className="w-full h-48 object-cover rounded-xl"
                    />
                  ) : (
                    <div className="w-full h-48 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                      <Gift className="w-12 h-12 text-primary/30" />
                    </div>
                  )}
                  {wish.reserved && (
                    <Badge variant="success" className="absolute top-3 right-3">
                      {t('common.reserved')}
                    </Badge>
                  )}
                </div>
                <h3 className="font-semibold mb-2 truncate">{wish.title}</h3>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg font-bold text-primary">{wish.currency} {wish.price}</span>
                  <div className="flex items-center gap-1 text-sm text-foreground/60">
                    <Star className="w-4 h-4 text-accent fill-accent" />
                    <span>{wish.priority}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground/60">{t('common.confidence')}</span>
                    <Badge variant="primary">{wish.confidence}%</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground/60">{t('common.added')}</span>
                    <span className="text-foreground/70">{timeAgo(wish.createdAt)}</span>
                  </div>
                </div>
              </Card>
            </motion.div>
          )) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-3 text-center py-8"
            >
              <Gift className="w-12 h-12 text-foreground/20 mx-auto mb-3" />
              <p className="text-foreground/60">{t('dashboard.noWishes')}</p>
              <Button variant="primary" size="sm" className="mt-4" onClick={() => navigate('/wishlists')}>
                <Plus className="w-4 h-4" />
                {t('dashboard.addFirst')}
              </Button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-bold mb-6">{t('dashboard.activityTimeline')}</h2>
          <Card>
            {visibleActivities.length > 0 ? (
              <div className="space-y-6">
                {visibleActivities.map((activity, index) => (
                  <div key={index} className="flex gap-4">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${activity.gradient} flex items-center justify-center flex-shrink-0`}>
                      <activity.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium mb-1">{activity.title}</p>
                      <p className="text-sm text-foreground/60">{activity.description}</p>
                      <p className="text-xs text-foreground/50 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="w-10 h-10 text-foreground/20 mx-auto mb-3" />
                <p className="text-sm text-foreground/50">{t('dashboard.noActivity')}</p>
              </div>
            )}
          </Card>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-6">{t('dashboard.followingActivity')}</h2>
          <Card>
            {currentUser && currentUser.following.length > 0 ? (
              <div className="text-center py-8">
                <Users className="w-10 h-10 text-foreground/20 mx-auto mb-3" />
                <p className="text-sm text-foreground/50 mb-4">{t('dashboard.goToFeed')}</p>
                <Button variant="outline" size="sm" onClick={() => navigate('/social')}>
                  <Users className="w-4 h-4" />
                  {t('dashboard.toFeed')}
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="w-10 h-10 text-foreground/20 mx-auto mb-3" />
                <p className="text-sm text-foreground/50 mb-4">{t('dashboard.followPeople')}</p>
                <Button variant="outline" size="sm" onClick={() => navigate('/users/search')}>
                  {t('dashboard.findPeople')}
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
