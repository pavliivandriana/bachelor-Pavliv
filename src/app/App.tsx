import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { motion } from 'motion/react';
import { LandingPage } from './components/pages/LandingPage';
import { AuthPage } from './components/pages/AuthPage';
import { Dashboard } from './components/pages/Dashboard';
import { WishlistCreation } from './components/pages/WishlistCreation';
import { AntiWishlist } from './components/pages/AntiWishlist';
import { UserProfile } from './components/pages/UserProfile';
import { SocialFeed } from './components/pages/SocialFeed';
import { MyWishlists } from './components/pages/MyWishlists';
import { Notifications } from './components/pages/Notifications';
import { Settings } from './components/pages/Settings';
import { WishDetail } from './components/pages/WishDetail';
import { UserSearch } from './components/pages/UserSearch';
import { PublicProfile } from './components/pages/PublicProfile';
import { WishArchive } from './components/pages/WishArchive';
import { Achievements } from './components/pages/Achievements';
import { VerifyEmailPage } from './components/pages/VerifyEmailPage';
import { AktualnostReminder, isOverdue } from './components/AktualnostReminder';
import { AchievementToastQueue } from './components/AchievementToast';
import { QuickAddWish } from './components/QuickAddWish';
import { WishlistProvider } from './context/WishlistContext';
import { ThemeProvider } from './context/ThemeContext';
import { AppProvider, useApp } from './store/AppStore';
import { LanguageProvider, useLanguage } from './i18n/LanguageContext';
import { AppLayout } from './components/AppLayout';
import { Button } from './components/Button';
import { Bell, Plus } from 'lucide-react';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useApp();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  return <AppLayout>{children}</AppLayout>;
}

function AppInner() {
  const { loading, isAuthenticated, wishes, newAchievements, clearNewAchievement } = useApp();
  const { t } = useLanguage();
  const [showAktualnostModal, setShowAktualnostModal] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const reminderShown = useRef(false);

  useEffect(() => {
    if (loading || !isAuthenticated || reminderShown.current) return;
    const hasOverdue = wishes.some(w => !w.archived && isOverdue(w));
    if (!hasOverdue) return;
    reminderShown.current = true;
    const timer = setTimeout(() => setShowAktualnostModal(true), 1500);
    return () => clearTimeout(timer);
  }, [loading, isAuthenticated]); // intentionally excludes `wishes` — runs once after initial load

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="size-full min-h-screen bg-background text-foreground">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/verify/:token" element={<VerifyEmailPage />} />
        <Route path="/dashboard"     element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/wishlists"     element={<ProtectedRoute><MyWishlists /></ProtectedRoute>} />
        <Route path="/wishlist/new"       element={<ProtectedRoute><WishlistCreation /></ProtectedRoute>} />
        <Route path="/wishlist/edit/:id"  element={<ProtectedRoute><WishlistCreation /></ProtectedRoute>} />
        <Route path="/anti-wishlist" element={<ProtectedRoute><AntiWishlist /></ProtectedRoute>} />
        <Route path="/profile"       element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
        <Route path="/social"        element={<ProtectedRoute><SocialFeed /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        <Route path="/settings"      element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/wishes/:id"    element={<ProtectedRoute><WishDetail /></ProtectedRoute>} />
        <Route path="/users/search"  element={<ProtectedRoute><UserSearch /></ProtectedRoute>} />
        <Route path="/users/:id"     element={<ProtectedRoute><PublicProfile /></ProtectedRoute>} />
        <Route path="/archive"        element={<ProtectedRoute><WishArchive /></ProtectedRoute>} />
        <Route path="/achievements"   element={<ProtectedRoute><Achievements /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        <div className="relative group">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={{
              boxShadow: [
                '0 20px 40px rgba(246, 166, 201, 0.3)',
                '0 20px 60px rgba(246, 166, 201, 0.5)',
                '0 20px 40px rgba(246, 166, 201, 0.3)'
              ]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            onClick={() => setShowQuickAdd(true)}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent shadow-2xl flex items-center justify-center relative"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary to-accent"
            />
            <Plus className="w-8 h-8 text-white group-hover:rotate-90 transition-transform duration-300 relative z-10" />
          </motion.button>
          <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-2 rounded-xl bg-foreground text-white text-sm shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            {t('app.addWishTooltip')}
          </div>
        </div>

        <div className="relative group">
          <Button
            variant="secondary"
            className="shadow-xl hover:shadow-secondary/50"
            size="sm"
            onClick={() => setShowAktualnostModal(true)}
          >
            <Bell className="w-4 h-4" />
            {t('app.demo')}
          </Button>
          <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-2 rounded-xl bg-foreground text-white text-sm shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            {t('app.demoTooltip')}
          </div>
        </div>
      </div>

      <AktualnostReminder open={showAktualnostModal} onClose={() => setShowAktualnostModal(false)} />
      <QuickAddWish open={showQuickAdd} onClose={() => setShowQuickAdd(false)} />
      <AchievementToastQueue achievementIds={newAchievements} onClear={clearNewAchievement} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AppProvider>
          <WishlistProvider>
            <BrowserRouter>
              <AppInner />
            </BrowserRouter>
          </WishlistProvider>
        </AppProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
