import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useLocation } from 'react-router';
import { Button } from './Button';
import { useLanguage } from '../i18n/LanguageContext';
import { Menu, X, Home, Lock, LayoutDashboard, Plus, XCircle, User, Users, List, Bell, Settings as SettingsIcon } from 'lucide-react';

export function DemoNavigation() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  const navItems = [
    { path: '/', label: t('demoNav.landing'), icon: Home },
    { path: '/auth', label: t('demoNav.auth'), icon: Lock },
    { path: '/dashboard', label: t('demoNav.dashboard'), icon: LayoutDashboard },
    { path: '/wishlists', label: t('demoNav.myWishes'), icon: List },
    { path: '/wishlist/new', label: t('demoNav.createWish'), icon: Plus },
    { path: '/anti-wishlist', label: t('demoNav.antiWishlist'), icon: XCircle },
    { path: '/profile', label: t('demoNav.profile'), icon: User },
    { path: '/social', label: t('demoNav.socialFeed'), icon: Users },
    { path: '/notifications', label: t('demoNav.notifications'), icon: Bell },
    { path: '/settings', label: t('demoNav.settingsPage'), icon: SettingsIcon }
  ];

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <>
      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-6 left-6 z-[100] w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent shadow-2xl flex items-center justify-center"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <Menu className="w-6 h-6 text-white" />
        )}
      </motion.button>

      {/* Navigation Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[90]"
            />

            {/* Menu */}
            <motion.div
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ type: 'spring', damping: 20 }}
              className="fixed top-0 left-0 h-full w-80 bg-white shadow-2xl z-[95] p-6 overflow-y-auto"
            >
              <div className="mb-8 mt-16">
                <h2 className="text-2xl font-bold mb-2">WishList</h2>
                <p className="text-sm text-foreground/60">{t('demoNav.navigate')}</p>
              </div>

              <nav className="space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;

                  return (
                    <button
                      key={item.path}
                      onClick={() => handleNavigate(item.path)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-primary to-accent text-white shadow-lg'
                          : 'hover:bg-muted text-foreground'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="mt-8 p-4 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10">
                <p className="text-xs text-foreground/70">{t('demoNav.tip')}</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
