import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useApp } from '../store/AppStore';
import { useLanguage } from '../i18n/LanguageContext';
import {
  Heart, Home, List, Plus, XCircle, Users,
  Bell, UserCircle, Settings, LogOut, Search, Archive, Trophy, Sparkles,
} from 'lucide-react';
import { Badge } from './Badge';
import { Button } from './Button';
import { PremiumModal } from './PremiumModal';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, notifications, logout } = useApp();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const unread = notifications.filter(n => !n.read).length;
  const [showPremium, setShowPremium] = useState(false);

  const navItems = [
    { path: '/dashboard',    label: t('nav.home'),          icon: Home },
    { path: '/wishlists',    label: t('nav.myWishes'),      icon: List },
    { path: '/wishlist/new', label: t('nav.addWish'),       icon: Plus },
    { path: '/anti-wishlist',label: t('nav.antiWishlist'),  icon: XCircle },
    { path: '/social',       label: t('nav.socialFeed'),    icon: Users },
    { path: '/users/search', label: t('nav.findPeople'),    icon: Search },
    { path: '/notifications',label: t('nav.notifications'), icon: Bell },
    { path: '/profile',      label: t('nav.profile'),       icon: UserCircle },
    { path: '/settings',     label: t('nav.settings'),      icon: Settings },
    { path: '/archive',       label: t('nav.archive'),        icon: Archive },
    { path: '/achievements',  label: t('nav.achievements'),   icon: Trophy },
  ];

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-72 bg-sidebar border-r border-sidebar-border p-6 hidden md:flex flex-col fixed top-0 left-0 h-full z-30">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Heart className="w-6 h-6 text-white" fill="white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            WishList
          </span>
        </div>

        {/* Nav */}
        <nav className="space-y-1 flex-1 overflow-y-auto min-h-0">
          {navItems.map(({ path, label, icon: Icon }) => {
            const active = location.pathname === path;
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors font-medium text-sm ${
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-foreground/70 hover:bg-muted'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {label}
                {path === '/notifications' && unread > 0 && (
                  <Badge variant="accent" className="ml-auto">{unread}</Badge>
                )}
              </button>
            );
          })}
        </nav>

        {/* User + Logout */}
        <div className="pt-6 border-t border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent shrink-0 overflow-hidden">
              {currentUser?.avatar && (
                <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="font-semibold truncate">{currentUser?.name}</p>
                {currentUser?.premium && (
                  <span className="flex-shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-amber-400 to-yellow-500 text-white leading-none">
                    PRO
                  </span>
                )}
              </div>
              <p className="text-sm text-foreground/60 truncate">@{currentUser?.username}</p>
            </div>
          </div>
          {!currentUser?.premium && (
            <button
              onClick={() => setShowPremium(true)}
              className="w-full flex items-center gap-2 px-3 py-2 mb-1 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 hover:from-primary/20 hover:to-accent/20 transition-colors text-sm font-medium text-primary"
            >
              <Sparkles className="w-4 h-4 flex-shrink-0" />
              {t('achievements.premiumCta')}
            </button>
          )}
          <Button variant="ghost" className="w-full justify-start" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
            {t('nav.logout')}
          </Button>
        </div>
      </aside>

      {/* Main content offset by sidebar width */}
      <main className="flex-1 md:ml-72 min-w-0">
        {children}
      </main>

      <PremiumModal open={showPremium} onClose={() => setShowPremium(false)} />
    </div>
  );
}
