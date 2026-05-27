import React from 'react';
import { motion } from 'motion/react';
import { Card } from '../Card';
import { Badge } from '../Badge';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  Smartphone,
  Home,
  Heart,
  Bell,
  User,
  Plus,
  Search,
  Menu,
  Gift,
  TrendingUp
} from 'lucide-react';

export function MobileShowcase() {
  const { t } = useLanguage();

  const mobileFeatures = [
    { icon: Smartphone, title: t('mobileShowcase.mf1Title'), description: t('mobileShowcase.mf1Desc'), gradient: 'from-primary to-accent' },
    { icon: Bell,       title: t('mobileShowcase.mf2Title'), description: t('mobileShowcase.mf2Desc'), gradient: 'from-secondary to-primary' },
    { icon: Menu,       title: t('mobileShowcase.mf3Title'), description: t('mobileShowcase.mf3Desc'), gradient: 'from-accent to-secondary' },
    { icon: Heart,      title: t('mobileShowcase.mf4Title'), description: t('mobileShowcase.mf4Desc'), gradient: 'from-primary to-secondary' },
  ];

  return (
    <div className="min-h-screen py-12 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <Badge variant="primary" className="mb-4">
            <Smartphone className="w-3 h-3" />
            {t('mobileShowcase.badge')}
          </Badge>
          <h1 className="text-4xl font-bold mb-4">{t('mobileShowcase.title')}</h1>
          <p className="text-lg text-foreground/70 max-w-2xl mx-auto">{t('mobileShowcase.subtitle')}</p>
        </motion.div>

        {/* Mobile Mockups */}
        <div className="grid md:grid-cols-3 gap-8">
          {/* Mobile Dashboard */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="text-center mb-4">
              <h3 className="font-semibold text-lg">{t('mobileShowcase.scr1Title')}</h3>
              <p className="text-sm text-foreground/60">{t('mobileShowcase.scr1Sub')}</p>
            </div>
            <div className="w-full max-w-[320px] mx-auto">
              <div className="bg-white rounded-[3rem] p-4 shadow-2xl border-8 border-foreground">
                <div className="bg-background rounded-[2rem] overflow-hidden">
                  <div className="bg-white px-6 py-2 flex items-center justify-between text-xs">
                    <span>9:41</span>
                    <div className="flex gap-1">
                      <div className="w-4 h-2 bg-foreground rounded-sm" />
                      <div className="w-4 h-2 bg-foreground rounded-sm" />
                      <div className="w-4 h-2 bg-foreground/30 rounded-sm" />
                    </div>
                  </div>
                  <div className="p-4 space-y-4 min-h-[600px]">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-bold">{t('mobileShowcase.dashTitle')}</h2>
                        <p className="text-xs text-foreground/60">{t('mobileShowcase.welcomeBack')}</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white rounded-2xl p-3 shadow-sm">
                        <Gift className="w-5 h-5 text-primary mb-2" />
                        <p className="text-xl font-bold">24</p>
                        <p className="text-xs text-foreground/60">{t('mobileShowcase.wishes')}</p>
                      </div>
                      <div className="bg-white rounded-2xl p-3 shadow-sm">
                        <Heart className="w-5 h-5 text-accent mb-2" />
                        <p className="text-xl font-bold">12</p>
                        <p className="text-xs text-foreground/60">{t('mobileShowcase.reserved')}</p>
                      </div>
                    </div>
                    <div className="bg-white rounded-2xl p-3 shadow-sm">
                      <div className="h-32 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl mb-3" />
                      <h4 className="font-semibold text-sm mb-1">{t('mobileShowcase.vintage')}</h4>
                      <div className="flex items-center justify-between">
                        <Badge variant="primary" className="text-xs">$249</Badge>
                        <span className="text-xs text-foreground/60">{t('mobileShowcase.highPriority')}</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm mb-3">{t('mobileShowcase.recentActivity')}</h3>
                      <div className="space-y-2">
                        {[1, 2].map((i) => (
                          <div key={i} className="flex items-center gap-3 p-2 bg-white rounded-xl">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-secondary to-primary" />
                            <div className="flex-1">
                              <p className="text-xs font-medium">{t('mobileShowcase.giftReserved')}</p>
                              <p className="text-xs text-foreground/60">{t('mobileShowcase.hoursAgo')}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="bg-white border-t border-border px-6 py-3 flex items-center justify-around">
                    <Home className="w-6 h-6 text-primary" />
                    <Search className="w-6 h-6 text-foreground/40" />
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center -mt-8 shadow-xl">
                      <Plus className="w-6 h-6 text-white" />
                    </div>
                    <Bell className="w-6 h-6 text-foreground/40" />
                    <User className="w-6 h-6 text-foreground/40" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Mobile Wishlist Detail */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="text-center mb-4">
              <h3 className="font-semibold text-lg">{t('mobileShowcase.scr2Title')}</h3>
              <p className="text-sm text-foreground/60">{t('mobileShowcase.scr2Sub')}</p>
            </div>
            <div className="w-full max-w-[320px] mx-auto">
              <div className="bg-white rounded-[3rem] p-4 shadow-2xl border-8 border-foreground">
                <div className="bg-background rounded-[2rem] overflow-hidden">
                  <div className="bg-white px-6 py-2 flex items-center justify-between text-xs">
                    <span>9:41</span>
                    <div className="flex gap-1">
                      <div className="w-4 h-2 bg-foreground rounded-sm" />
                      <div className="w-4 h-2 bg-foreground rounded-sm" />
                      <div className="w-4 h-2 bg-foreground/30 rounded-sm" />
                    </div>
                  </div>
                  <div className="min-h-[600px]">
                    <div className="relative h-64 bg-gradient-to-br from-secondary/30 to-accent/30">
                      <Badge variant="success" className="absolute top-4 right-4 text-xs">
                        95% {t('mobileShowcase.confidence')}
                      </Badge>
                    </div>
                    <div className="p-4 space-y-4">
                      <div>
                        <h2 className="text-xl font-bold mb-2">{t('mobileShowcase.polaroid')}</h2>
                        <p className="text-2xl font-bold text-primary mb-2">$249</p>
                        <p className="text-sm text-foreground/70">{t('mobileShowcase.cameraDesc')}</p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between py-2 border-b border-border">
                          <span className="text-xs text-foreground/60">{t('mobileShowcase.priority')}</span>
                          <Badge variant="primary" className="text-xs">{t('mobileShowcase.high')}</Badge>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-border">
                          <span className="text-xs text-foreground/60">{t('mobileShowcase.confidence')}</span>
                          <Badge variant="secondary" className="text-xs">95%</Badge>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-border">
                          <span className="text-xs text-foreground/60">{t('mobileShowcase.added')}</span>
                          <span className="text-xs">{t('mobileShowcase.daysAgo')}</span>
                        </div>
                      </div>
                      <div className="space-y-2 pt-4">
                        <button className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-medium">
                          {t('mobileShowcase.reserveGift')}
                        </button>
                        <button className="w-full py-3 rounded-xl border-2 border-primary text-primary font-medium">
                          {t('mobileShowcase.share')}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Mobile Profile */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <div className="text-center mb-4">
              <h3 className="font-semibold text-lg">{t('mobileShowcase.scr3Title')}</h3>
              <p className="text-sm text-foreground/60">{t('mobileShowcase.scr3Sub')}</p>
            </div>
            <div className="w-full max-w-[320px] mx-auto">
              <div className="bg-white rounded-[3rem] p-4 shadow-2xl border-8 border-foreground">
                <div className="bg-background rounded-[2rem] overflow-hidden">
                  <div className="bg-white px-6 py-2 flex items-center justify-between text-xs">
                    <span>9:41</span>
                    <div className="flex gap-1">
                      <div className="w-4 h-2 bg-foreground rounded-sm" />
                      <div className="w-4 h-2 bg-foreground rounded-sm" />
                      <div className="w-4 h-2 bg-foreground/30 rounded-sm" />
                    </div>
                  </div>
                  <div className="p-4 space-y-4 min-h-[600px]">
                    <div className="text-center">
                      <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-accent mx-auto mb-3" />
                      <h2 className="text-lg font-bold">Sarah Johnson</h2>
                      <p className="text-xs text-foreground/60 mb-3">@sarahj</p>
                      <button className="px-6 py-2 rounded-xl bg-primary/10 text-primary text-sm font-medium">
                        {t('mobileShowcase.editProfile')}
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <p className="text-xl font-bold">24</p>
                        <p className="text-xs text-foreground/60">{t('mobileShowcase.wishesLabel')}</p>
                      </div>
                      <div>
                        <p className="text-xl font-bold">156</p>
                        <p className="text-xs text-foreground/60">{t('mobileShowcase.followers')}</p>
                      </div>
                      <div>
                        <p className="text-xl font-bold">89</p>
                        <p className="text-xs text-foreground/60">{t('mobileShowcase.following')}</p>
                      </div>
                    </div>
                    <div className="bg-white rounded-2xl p-3">
                      <p className="text-xs text-foreground/70 leading-relaxed">
                        Design enthusiast | Coffee lover | Always looking for perfect gift ideas 🎁
                      </p>
                    </div>
                    <div className="bg-white rounded-2xl p-3">
                      <h3 className="text-sm font-semibold mb-2">{t('mobileShowcase.preferences')}</h3>
                      <div className="flex flex-wrap gap-1.5">
                        {t('mobileShowcase.prefItems').split(',').map((tag, i) => (
                          <span key={i} className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">{tag}</span>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <button className="w-full flex items-center gap-3 p-3 bg-white rounded-xl text-left">
                        <Gift className="w-5 h-5 text-primary" />
                        <span className="text-sm font-medium">{t('mobileShowcase.myWishlists')}</span>
                      </button>
                      <button className="w-full flex items-center gap-3 p-3 bg-white rounded-xl text-left">
                        <TrendingUp className="w-5 h-5 text-secondary" />
                        <span className="text-sm font-medium">{t('mobileShowcase.aktCheck')}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Feature List */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-16">
          <Card>
            <h2 className="text-2xl font-bold mb-6 text-center">{t('mobileShowcase.featTitle')}</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {mobileFeatures.map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center flex-shrink-0`}>
                    <feature.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{feature.title}</h3>
                    <p className="text-sm text-foreground/70">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
