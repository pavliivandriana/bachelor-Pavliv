import React from 'react';
import { motion } from 'motion/react';
import { Card } from '../Card';
import { Badge } from '../Badge';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  Plus,
  Sparkles,
  TrendingUp,
  Users,
  Shield,
  Zap,
  Heart,
  Clock,
  Gift,
  Bell,
  Star
} from 'lucide-react';

export function FeatureShowcase() {
  const { t } = useLanguage();

  const features = [
    { icon: Star,       title: t('featureShowcase.f1Title'), description: t('featureShowcase.f1Desc'), gradient: 'from-primary to-accent' },
    { icon: TrendingUp, title: t('featureShowcase.f2Title'), description: t('featureShowcase.f2Desc'), gradient: 'from-secondary to-primary' },
    { icon: Gift,       title: t('featureShowcase.f3Title'), description: t('featureShowcase.f3Desc'), gradient: 'from-accent to-secondary' },
    { icon: Users,      title: t('featureShowcase.f4Title'), description: t('featureShowcase.f4Desc'), gradient: 'from-primary to-secondary' },
    { icon: Shield,     title: t('featureShowcase.f5Title'), description: t('featureShowcase.f5Desc'), gradient: 'from-secondary to-accent' },
    { icon: Heart,      title: t('featureShowcase.f6Title'), description: t('featureShowcase.f6Desc'), gradient: 'from-primary to-accent' },
  ];

  const stats = [
    { value: t('featureShowcase.stat1Val'), label: t('featureShowcase.stat1Label') },
    { value: t('featureShowcase.stat2Val'), label: t('featureShowcase.stat2Label') },
    { value: t('featureShowcase.stat3Val'), label: t('featureShowcase.stat3Label') },
    { value: t('featureShowcase.stat4Val'), label: t('featureShowcase.stat4Label') },
  ];

  return (
    <div className="min-h-screen py-12 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <Badge variant="primary" className="mb-4">
            <Sparkles className="w-3 h-3" />
            {t('featureShowcase.badge')}
          </Badge>
          <h1 className="text-5xl font-bold mb-4">
            {t('featureShowcase.title1')}
            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              {' '}{t('featureShowcase.titleHL')}
            </span>
          </h1>
          <p className="text-xl text-foreground/70 max-w-3xl mx-auto">{t('featureShowcase.subtitle')}</p>
        </motion.div>

        {/* Main Features Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {/* Quick Add Feature */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <Card className="h-full relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full blur-3xl" />
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4">
                  <Plus className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-3">{t('featureShowcase.quickAddTitle')}</h2>
                <p className="text-foreground/70 mb-6 leading-relaxed">{t('featureShowcase.quickAddDesc')}</p>
                <div className="space-y-3">
                  {[t('featureShowcase.qaStep1'), t('featureShowcase.qaStep2'), t('featureShowcase.qaStep3')].map((step, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        i === 0 ? 'bg-primary/10' : i === 1 ? 'bg-secondary/10' : 'bg-accent/10'
                      }`}>
                        <span className={`font-bold ${i === 0 ? 'text-primary' : i === 1 ? 'text-secondary' : 'text-accent'}`}>{i + 1}</span>
                      </div>
                      <span className="text-sm">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Aktualnost System */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <Card className="h-full relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-accent/10 to-secondary/10 rounded-full blur-3xl" />
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-secondary flex items-center justify-center mb-4">
                  <Clock className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-3">{t('featureShowcase.aktTitle')}</h2>
                <p className="text-foreground/70 mb-6 leading-relaxed">{t('featureShowcase.aktDesc')}</p>
                <div className="space-y-3">
                  {[
                    { icon: TrendingUp, text: t('featureShowcase.akt1') },
                    { icon: Bell,       text: t('featureShowcase.akt2') },
                    { icon: Zap,        text: t('featureShowcase.akt3') },
                  ].map(({ icon: Icon, text }, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-accent" />
                      <span className="text-sm">{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card hover className="h-full">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-foreground/70 leading-relaxed">{feature.description}</p>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Interactive Demo Section */}
        <Card className="bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">{t('featureShowcase.tryTitle')}</h2>
            <p className="text-foreground/70 mb-8 max-w-2xl mx-auto">{t('featureShowcase.tryDesc')}</p>

            <div className="grid md:grid-cols-3 gap-6 text-left">
              {[
                { icon: Plus,  title: t('featureShowcase.try1Title'), desc: t('featureShowcase.try1Desc'), color: 'primary' },
                { icon: Bell,  title: t('featureShowcase.try2Title'), desc: t('featureShowcase.try2Desc'), color: 'secondary' },
                { icon: Users, title: t('featureShowcase.try3Title'), desc: t('featureShowcase.try3Desc'), color: 'accent' },
              ].map(({ icon: Icon, title, desc, color }, i) => (
                <div key={i} className="p-6 rounded-2xl bg-white/50 backdrop-blur-sm">
                  <div className={`w-12 h-12 rounded-xl bg-${color}/10 flex items-center justify-center mb-3`}>
                    <Icon className={`w-6 h-6 text-${color}`} />
                  </div>
                  <h4 className="font-semibold mb-2">{title}</h4>
                  <p className="text-sm text-foreground/70">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6"
        >
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <p className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
                {stat.value}
              </p>
              <p className="text-sm text-foreground/60">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
