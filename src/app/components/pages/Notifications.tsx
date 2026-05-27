import React from 'react';
import { motion } from 'motion/react';
import { Card } from '../Card';
import { Button } from '../Button';
import { useApp } from '../../store/AppStore';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  Bell,
  Gift,
  Heart,
  Users,
  Clock,
  Trash2,
  MessageCircle,
  X,
} from 'lucide-react';

export function Notifications() {
  const { notifications, markNotificationRead, dismissNotification, clearNotifications } = useApp();
  const { t, timeAgoShort } = useLanguage();

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'reservation': return Gift;
      case 'aktualnost': return Clock;
      case 'follow': return Users;
      case 'comment': return MessageCircle;
      case 'like': return Heart;
      default: return Bell;
    }
  };

  const getGradient = (type: string) => {
    switch (type) {
      case 'reservation': return 'from-primary to-accent';
      case 'aktualnost': return 'from-accent to-secondary';
      case 'follow': return 'from-secondary to-primary';
      case 'comment': return 'from-primary to-secondary';
      case 'like': return 'from-accent to-primary';
      default: return 'from-primary to-accent';
    }
  };

  const unreadLabel = unreadCount > 0
    ? `${unreadCount} ${t('notifications.unread')}`
    : t('notifications.allRead');

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">{t('notifications.title')}</h1>
            <p className="text-foreground/60">{unreadLabel}</p>
          </div>
          {notifications.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearNotifications}>
              <Trash2 className="w-4 h-4" />
              {t('notifications.clearAll')}
            </Button>
          )}
        </div>

        {/* Notifications List */}
        {notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((notification, index) => {
              const Icon = getIcon(notification.type);
              const gradient = getGradient(notification.type);

              return (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    className={`transition-colors ${!notification.read ? 'bg-primary/5 border-primary/20' : 'opacity-70'}`}
                  >
                    <div className="flex items-start gap-4">
                      <button
                        className="flex items-start gap-4 flex-1 min-w-0 text-left"
                        onClick={() => markNotificationRead(notification.id)}
                      >
                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm mb-1">{notification.message}</p>
                          <p className="text-xs text-foreground/50">
                            {timeAgoShort(notification.createdAt)}
                          </p>
                        </div>
                      </button>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        {!notification.read && (
                          <div className="w-2 h-2 rounded-full bg-primary" />
                        )}
                        <button
                          onClick={() => dismissNotification(notification.id)}
                          className="w-7 h-7 rounded-full hover:bg-muted flex items-center justify-center text-foreground/40 hover:text-foreground/70 transition-colors"
                          title={t('notifications.hide')}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-6">
              <Bell className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">{t('notifications.empty')}</h3>
            <p className="text-foreground/60">{t('notifications.emptyDesc')}</p>
          </motion.div>
        )}

        {/* Notification Settings */}
        {notifications.length > 0 && (
          <Card className="mt-8 bg-gradient-to-br from-muted/50 to-background">
            <div className="flex items-center gap-3 mb-4">
              <Bell className="w-5 h-5 text-foreground/70" />
              <h3 className="font-semibold">{t('notifications.settingsTitle')}</h3>
            </div>
            <div className="space-y-3">
              {[
                { label: t('notifications.prefGift'), desc: t('notifications.prefGiftDesc') },
                { label: t('notifications.prefAktualnost'), desc: t('notifications.prefAktualnostDesc') },
                { label: t('notifications.prefFollowers'), desc: t('notifications.prefFollowersDesc') },
                { label: t('notifications.prefSocial'), desc: t('notifications.prefSocialDesc') }
              ].map((pref, index) => (
                <label
                  key={index}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-muted cursor-pointer transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium">{pref.label}</p>
                    <p className="text-xs text-foreground/60">{pref.desc}</p>
                  </div>
                  <input type="checkbox" defaultChecked className="rounded" />
                </label>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
