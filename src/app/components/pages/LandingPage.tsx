import React from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router';
import { Button } from '../Button';
import { Card } from '../Card';
import { Badge } from '../Badge';
import { useLanguage } from '../../i18n/LanguageContext';
import { Heart, Sparkles, Users, Shield, Bell, CheckCircle, Star, Gift, TrendingUp, Clock } from 'lucide-react';

export function LandingPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const features = [
    { icon: Clock,     title: t('landing.feat1Title'), description: t('landing.feat1Desc'), gradient: 'from-primary to-accent' },
    { icon: Shield,    title: t('landing.feat2Title'), description: t('landing.feat2Desc'), gradient: 'from-secondary to-primary' },
    { icon: Bell,      title: t('landing.feat3Title'), description: t('landing.feat3Desc'), gradient: 'from-accent to-secondary' },
    { icon: Users,     title: t('landing.feat4Title'), description: t('landing.feat4Desc'), gradient: 'from-primary to-accent' },
    { icon: Heart,     title: t('landing.feat5Title'), description: t('landing.feat5Desc'), gradient: 'from-secondary to-primary' },
    { icon: Sparkles,  title: t('landing.feat6Title'), description: t('landing.feat6Desc'), gradient: 'from-accent to-secondary' },
  ];

  const steps = [
    { title: t('landing.step1Title'), description: t('landing.step1Desc') },
    { title: t('landing.step2Title'), description: t('landing.step2Desc') },
    { title: t('landing.step3Title'), description: t('landing.step3Desc') },
    { title: t('landing.step4Title'), description: t('landing.step4Desc') },
  ];

  const testimonials = [
    { text: t('landing.testi1'), name: t('landing.testi1Name'), role: t('landing.testi1Role') },
    { text: t('landing.testi2'), name: t('landing.testi2Name'), role: t('landing.testi2Role') },
    { text: t('landing.testi3'), name: t('landing.testi3Name'), role: t('landing.testi3Role') },
  ];

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" fill="white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              WishList
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-foreground/70 hover:text-foreground transition-colors">{t('landing.navFeatures')}</a>
            <a href="#how-it-works" className="text-foreground/70 hover:text-foreground transition-colors">{t('landing.navHowItWorks')}</a>
            <a href="#testimonials" className="text-foreground/70 hover:text-foreground transition-colors">{t('landing.navTestimonials')}</a>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/auth')}>{t('landing.navLogin')}</Button>
            <Button variant="primary" size="sm" onClick={() => navigate('/auth')}>{t('landing.navGetStarted')}</Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5" />
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-secondary/10 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <Badge variant="primary" className="mb-6">
                <Sparkles className="w-3 h-3" />
                {t('landing.heroBadge')}
              </Badge>
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                {t('landing.heroTitle1')}
                <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                  {' '}{t('landing.heroTitleHighlight')}{' '}
                </span>
              </h1>
              <p className="text-xl text-foreground/70 mb-8 leading-relaxed">{t('landing.heroSubtitle')}</p>
              <div className="flex flex-wrap gap-4">
                <Button variant="primary" size="lg" onClick={() => navigate('/auth')}>
                  <Gift className="w-5 h-5" />
                  {t('landing.heroCta')}
                </Button>
                <Button variant="outline" size="lg" onClick={() => navigate('/dashboard')}>
                  <Users className="w-5 h-5" />
                  {t('landing.heroExplore')}
                </Button>
              </div>
              <div className="flex items-center gap-6 mt-8 text-sm text-foreground/60">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  <span>{t('landing.heroFree')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  <span>{t('landing.heroNoCard')}</span>
                </div>
              </div>
            </motion.div>

            {/* Floating Wishlist Cards */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative h-[500px] hidden md:block"
            >
              <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity }} className="absolute top-0 right-0">
                <Card glass hover className="w-64">
                  <img src="https://images.unsplash.com/photo-1657624332868-2159deacefa9?w=400" alt="Wishlist item" className="w-full h-32 object-cover rounded-xl mb-3" />
                  <h3 className="font-semibold mb-2">{t('landing.card1Name')}</h3>
                  <div className="flex items-center justify-between">
                    <Badge variant="success">95% {t('common.confidence')}</Badge>
                    <span className="text-sm text-foreground/60">$249</span>
                  </div>
                </Card>
              </motion.div>

              <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 3, repeat: Infinity, delay: 0.5 }} className="absolute top-40 left-0">
                <Card glass hover className="w-64">
                  <img src="https://images.unsplash.com/photo-1548504778-b14db6c34b04?w=400" alt="Wishlist item" className="w-full h-32 object-cover rounded-xl mb-3" />
                  <h3 className="font-semibold mb-2">{t('landing.card2Name')}</h3>
                  <div className="flex items-center justify-between">
                    <Badge variant="warning">{t('landing.card2Badge')}</Badge>
                    <span className="text-sm text-foreground/60">$89</span>
                  </div>
                </Card>
              </motion.div>

              <motion.div animate={{ y: [0, -15, 0] }} transition={{ duration: 3, repeat: Infinity, delay: 1 }} className="absolute bottom-0 right-12">
                <Card glass hover className="w-56">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent" />
                    <div>
                      <h4 className="font-semibold text-sm">{t('landing.card3Name')}</h4>
                      <p className="text-xs text-foreground/60">15 {t('landing.card3Wishes')}</p>
                    </div>
                  </div>
                  <Badge variant="primary">{t('landing.card3Reserved')}</Badge>
                </Card>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              <Star className="w-3 h-3" />
              {t('landing.featBadge')}
            </Badge>
            <h2 className="text-4xl font-bold mb-4">
              {t('landing.featTitle1')}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"> {t('landing.featTitleHL')}</span>
            </h2>
            <p className="text-lg text-foreground/70 max-w-2xl mx-auto">{t('landing.featSubtitle')}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card hover className="h-full">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-foreground/70 leading-relaxed">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="accent" className="mb-4">
              <TrendingUp className="w-3 h-3" />
              {t('landing.howBadge')}
            </Badge>
            <h2 className="text-4xl font-bold mb-4">{t('landing.howTitle')}</h2>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="relative mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto">
                    <span className="text-2xl font-bold text-white">{index + 1}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-8 left-1/2 w-full h-0.5 bg-gradient-to-r from-primary to-accent" />
                  )}
                </div>
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-foreground/70 text-sm">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="primary" className="mb-4">
              <Heart className="w-3 h-3" />
              {t('landing.testiBadge')}
            </Badge>
            <h2 className="text-4xl font-bold mb-4">{t('landing.testiTitle')}</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card glass className="h-full">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-accent fill-accent" />
                    ))}
                  </div>
                  <p className="text-foreground/80 mb-4 leading-relaxed">{testimonial.text}</p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent" />
                    <div>
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-sm text-foreground/60">{testimonial.role}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-secondary to-accent" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }}>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">{t('landing.ctaTitle')}</h2>
            <p className="text-xl text-white/90 mb-8">{t('landing.ctaSubtitle')}</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button variant="secondary" size="lg" onClick={() => navigate('/auth')}>
                <Gift className="w-5 h-5" />
                {t('landing.ctaCreate')}
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="bg-white/10 backdrop-blur-sm text-white border-white/30 hover:bg-white hover:text-primary"
                onClick={() => navigate('/features')}
              >
                {t('landing.ctaDemo')}
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-white py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Heart className="w-5 h-5 text-white" fill="white" />
                </div>
                <span className="font-bold">WishList</span>
              </div>
              <p className="text-white/60 text-sm">{t('landing.footerTagline')}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{t('landing.footerProduct')}</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li><a href="#" className="hover:text-white transition-colors">{t('landing.footerFeatures')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('landing.footerPricing')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('landing.footerFAQ')}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{t('landing.footerCompany')}</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li><a href="#" className="hover:text-white transition-colors">{t('landing.footerAbout')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('landing.footerBlog')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('landing.footerCareers')}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{t('landing.footerLegal')}</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li><a href="#" className="hover:text-white transition-colors">{t('landing.footerPrivacy')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('landing.footerTerms')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('landing.footerSecurity')}</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 text-center text-sm text-white/60">
            <p>{t('landing.footerCopy')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
