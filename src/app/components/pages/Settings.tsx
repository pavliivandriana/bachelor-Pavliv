import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from '../Card';
import { Button } from '../Button';
import { Input } from '../Input';
import { useApp } from '../../store/AppStore';
import { useLanguage } from '../../i18n/LanguageContext';
import { Language } from '../../i18n/translations';
import { useNavigate } from 'react-router';
import {
  User,
  Bell,
  Lock,
  Globe,
  Palette,
  HelpCircle,
  LogOut,
  Save,
  Sun,
  Moon,
  Trash2,
  TriangleAlert,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export function Settings() {
  const { currentUser, updateProfile, logout, deleteAccount } = useApp();
  const { t, lang, setLang } = useLanguage();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [sizesSaving, setSizesSaving] = useState(false);
  const [sizesSuccess, setSizesSuccess] = useState(false);
  const [sizesError, setSizesError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const [profileData, setProfileData] = useState({
    name: currentUser?.name ?? '',
    username: currentUser?.username ?? '',
    bio: currentUser?.bio ?? '',
  });

  const [privacyData, setPrivacyData] = useState({
    profileVisibility: (currentUser?.profileVisibility ?? 'public') as 'public' | 'friends' | 'private',
    searchVisible: currentUser?.searchVisible ?? true,
  });
  const [privacySaving, setPrivacySaving] = useState(false);
  const [privacySuccess, setPrivacySuccess] = useState(false);

  const handleSavePrivacy = async () => {
    setPrivacySaving(true);
    setPrivacySuccess(false);
    try {
      await updateProfile(privacyData);
      setPrivacySuccess(true);
      setTimeout(() => setPrivacySuccess(false), 3000);
    } finally {
      setPrivacySaving(false);
    }
  };

  const [sizesData, setSizesData] = useState({
    clothing: currentUser?.sizes?.clothing ?? '',
    shoe: currentUser?.sizes?.shoe ?? '',
    ring: currentUser?.sizes?.ring ?? '',
  });

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await updateProfile({ name: profileData.name, username: profileData.username, bio: profileData.bio });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSizes = async () => {
    setSizesSaving(true);
    setSizesError('');
    setSizesSuccess(false);
    try {
      await updateProfile({ sizes: sizesData });
      setSizesSuccess(true);
      setTimeout(() => setSizesSuccess(false), 3000);
    } catch {
      setSizesError(t('settings.saveError'));
    } finally {
      setSizesSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteAccount();
      navigate('/auth');
    } catch {
      setDeleteError(t('settings.deleteAccountError'));
      setDeleting(false);
    }
  };

  const tabs = [
    { id: 'profile', label: t('settings.tabProfile'), icon: User },
    { id: 'privacy', label: t('settings.tabPrivacy'), icon: Lock },
    { id: 'notifications', label: t('settings.tabNotifications'), icon: Bell },
    { id: 'appearance', label: t('settings.tabAppearance'), icon: Palette },
    { id: 'help', label: t('settings.tabHelp'), icon: HelpCircle }
  ];

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{t('settings.title')}</h1>
          <p className="text-foreground/60">{t('settings.subtitle')}</p>
        </div>

        <div className="grid md:grid-cols-[250px,1fr] gap-6">
          {/* Sidebar */}
          <div>
            <Card>
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left ${
                        activeTab === tab.id
                          ? 'bg-primary text-white'
                          : 'text-foreground/70 hover:bg-muted'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="mt-6 pt-6 border-t border-border space-y-1">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-destructive hover:bg-destructive/10"
                  onClick={handleLogout}
                >
                  <LogOut className="w-5 h-5" />
                  {t('nav.logout')}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-destructive/70 hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setShowDeleteModal(true)}
                >
                  <Trash2 className="w-5 h-5" />
                  {t('settings.deleteAccountBtn')}
                </Button>
              </div>
            </Card>
          </div>

          {/* Content */}
          <div>
            {activeTab === 'profile' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <Card>
                  <h2 className="text-xl font-bold mb-6">{t('settings.profileInfo')}</h2>
                  <div className="space-y-4">
                    <Input
                      label={t('settings.nameLabel')}
                      placeholder={t('settings.namePlaceholder')}
                      value={profileData.name}
                      onChange={e => setProfileData(p => ({ ...p, name: e.target.value }))}
                    />
                    <Input
                      label={t('settings.usernameLabel')}
                      placeholder={t('settings.usernamePlaceholder')}
                      value={profileData.username}
                      onChange={e => setProfileData(p => ({ ...p, username: e.target.value }))}
                    />
                    <Input
                      label={t('settings.emailLabel')}
                      type="email"
                      placeholder="your@email.com"
                      defaultValue={currentUser?.email}
                      disabled
                    />
                    <div>
                      <label className="block text-sm font-medium mb-2">{t('settings.bioLabel')}</label>
                      <textarea
                        className="w-full px-4 py-3 rounded-xl bg-input-background border border-border focus:outline-none focus:ring-2 focus:ring-ring min-h-24 resize-none"
                        placeholder={t('settings.bioPlaceholder')}
                        value={profileData.bio}
                        onChange={e => setProfileData(p => ({ ...p, bio: e.target.value }))}
                      />
                    </div>
                    <Button variant="primary" onClick={handleSaveProfile} disabled={saving}>
                      <Save className="w-5 h-5" />
                      {saving ? t('common.saving') : t('settings.saveChanges')}
                    </Button>
                  </div>
                </Card>

                <Card>
                  <h2 className="text-xl font-bold mb-6">{t('settings.sizesTitle')}</h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    <Input
                      label={t('settings.clothingSize')}
                      placeholder={t('settings.clothingSizePlaceholder')}
                      value={sizesData.clothing}
                      onChange={e => setSizesData(s => ({ ...s, clothing: e.target.value }))}
                    />
                    <Input
                      label={t('settings.shoeSize')}
                      placeholder={t('settings.shoeSizePlaceholder')}
                      value={sizesData.shoe}
                      onChange={e => setSizesData(s => ({ ...s, shoe: e.target.value }))}
                    />
                    <Input
                      label={t('settings.ringSize')}
                      placeholder={t('settings.ringSizePlaceholder')}
                      value={sizesData.ring}
                      onChange={e => setSizesData(s => ({ ...s, ring: e.target.value }))}
                    />
                  </div>
                  <div className="mt-4 space-y-2">
                    <Button variant="primary" onClick={handleSaveSizes} disabled={sizesSaving}>
                      <Save className="w-5 h-5" />
                      {sizesSaving ? t('common.saving') : t('settings.saveSizes')}
                    </Button>
                    {sizesSuccess && (
                      <p className="text-sm text-green-600">{t('settings.saveSuccess')}</p>
                    )}
                    {sizesError && (
                      <p className="text-sm text-destructive">{sizesError}</p>
                    )}
                  </div>
                </Card>
              </motion.div>
            )}

            {activeTab === 'privacy' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Card>
                  <h2 className="text-xl font-bold mb-6">{t('settings.privacyTitle')}</h2>
                  <div className="space-y-4">
                    {/* Profile visibility */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                      <div>
                        <p className="font-medium">{t('settings.privacyVisibility')}</p>
                        <p className="text-sm text-foreground/60">{t('settings.privacyVisibilityDesc')}</p>
                      </div>
                      <select
                        value={privacyData.profileVisibility}
                        onChange={e => setPrivacyData(p => ({ ...p, profileVisibility: e.target.value as 'public' | 'friends' | 'private' }))}
                        className="px-3 py-2 rounded-lg bg-input-background border border-border text-sm text-foreground"
                      >
                        <option value="public">{t('settings.visPublic')}</option>
                        <option value="friends">{t('settings.visFriends')}</option>
                        <option value="private">{t('settings.visPrivate')}</option>
                      </select>
                    </div>

                    {/* Show reserved — decorative only */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                      <div>
                        <p className="font-medium">{t('settings.privacyShowReserved')}</p>
                        <p className="text-sm text-foreground/60">{t('settings.privacyShowReservedDesc')}</p>
                      </div>
                      <input type="checkbox" defaultChecked className="rounded" />
                    </div>

                    {/* Activity status — decorative only */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                      <div>
                        <p className="font-medium">{t('settings.privacyActivityStatus')}</p>
                        <p className="text-sm text-foreground/60">{t('settings.privacyActivityStatusDesc')}</p>
                      </div>
                      <input type="checkbox" defaultChecked className="rounded" />
                    </div>

                    {/* Search visible */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                      <div>
                        <p className="font-medium">{t('settings.privacySearchVisible')}</p>
                        <p className="text-sm text-foreground/60">{t('settings.privacySearchVisibleDesc')}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={privacyData.searchVisible}
                        onChange={e => setPrivacyData(p => ({ ...p, searchVisible: e.target.checked }))}
                        className="rounded"
                      />
                    </div>
                  </div>

                  <div className="mt-6 space-y-2">
                    <Button variant="primary" onClick={handleSavePrivacy} disabled={privacySaving}>
                      <Save className="w-5 h-5" />
                      {privacySaving ? t('common.saving') : t('settings.saveChanges')}
                    </Button>
                    {privacySuccess && (
                      <p className="text-sm text-green-600">{t('settings.saveSuccess')}</p>
                    )}
                  </div>
                </Card>
              </motion.div>
            )}

            {activeTab === 'notifications' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Card>
                  <h2 className="text-xl font-bold mb-6">{t('settings.notifTitle')}</h2>
                  <div className="space-y-4">
                    {[
                      { title: t('settings.notifGiftReserved'), desc: t('settings.notifGiftReservedDesc') },
                      { title: t('settings.notifAktualnost'), desc: t('settings.notifAktualnostDesc') },
                      { title: t('settings.notifNewFollowers'), desc: t('settings.notifNewFollowersDesc') },
                      { title: t('settings.notifComments'), desc: t('settings.notifCommentsDesc') },
                      { title: t('settings.notifListUpdates'), desc: t('settings.notifListUpdatesDesc') },
                      { title: t('settings.notifEmail'), desc: t('settings.notifEmailDesc') }
                    ].map((setting, index) => (
                      <label
                        key={index}
                        className="flex items-center justify-between p-4 rounded-xl bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                      >
                        <div>
                          <p className="font-medium">{setting.title}</p>
                          <p className="text-sm text-foreground/60">{setting.desc}</p>
                        </div>
                        <input type="checkbox" defaultChecked className="rounded" />
                      </label>
                    ))}
                  </div>
                </Card>
              </motion.div>
            )}

            {activeTab === 'appearance' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Card>
                  <h2 className="text-xl font-bold mb-6">{t('settings.appearanceTitle')}</h2>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium mb-3">{t('settings.themeLabel')}</label>
                      <div className="grid grid-cols-2 gap-3">
                        {([
                          { value: 'light' as const, label: t('settings.themeLight'), Icon: Sun,
                            preview: 'bg-gradient-to-br from-[#FAF7F4] to-[#f0ece8] border border-[rgba(43,43,43,0.1)]' },
                          { value: 'dark'  as const, label: t('settings.themeDark'),  Icon: Moon,
                            preview: 'bg-gradient-to-br from-[#1e1a2e] to-[#261e3c]' },
                        ]).map((opt) => {
                          const selected = theme === opt.value;
                          return (
                            <button
                              key={opt.value}
                              onClick={() => setTheme(opt.value)}
                              className={`p-4 rounded-xl border-2 transition-all text-center ${
                                selected
                                  ? 'border-primary bg-primary/5 shadow-sm'
                                  : 'border-border hover:border-primary/50'
                              }`}
                            >
                              <div className={`w-full h-16 rounded-lg mx-auto mb-3 flex items-center justify-center ${opt.preview}`}>
                                <opt.Icon className={`w-6 h-6 ${opt.value === 'light' ? 'text-primary' : 'text-[#CDB8FF]'}`} />
                              </div>
                              <p className={`text-sm font-medium ${selected ? 'text-primary' : ''}`}>{opt.label}</p>
                              {selected && (
                                <div className="mt-1.5 w-2 h-2 rounded-full bg-primary mx-auto" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-3">{t('settings.languageLabel')}</label>
                      <select
                        value={lang}
                        onChange={(e) => setLang(e.target.value as Language)}
                        className="w-full px-4 py-3 rounded-xl bg-input-background border border-border focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="uk">Українська</option>
                        <option value="en">English</option>
                      </select>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            {activeTab === 'help' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <Card>
                  <h2 className="text-xl font-bold mb-6">{t('settings.helpTitle')}</h2>
                  <div className="space-y-3">
                    {[
                      { title: t('settings.helpCenter'), desc: t('settings.helpCenterDesc') },
                      { title: t('settings.helpContact'), desc: t('settings.helpContactDesc') },
                      { title: t('settings.helpFeature'), desc: t('settings.helpFeatureDesc') },
                      { title: t('settings.helpBug'), desc: t('settings.helpBugDesc') }
                    ].map((item, index) => (
                      <button
                        key={index}
                        className="w-full flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors text-left"
                      >
                        <div>
                          <p className="font-medium">{item.title}</p>
                          <p className="text-sm text-foreground/60">{item.desc}</p>
                        </div>
                        <Globe className="w-5 h-5 text-foreground/40" />
                      </button>
                    ))}
                  </div>
                </Card>

                <Card className="bg-gradient-to-br from-primary/5 to-accent/5">
                  <div className="text-center">
                    <h3 className="font-semibold mb-2">WishList v1.0.0</h3>
                    <p className="text-sm text-foreground/70 mb-4">
                      {t('settings.madeWith')}
                    </p>
                    <div className="flex gap-3 justify-center text-sm">
                      <a href="#" className="text-primary hover:underline">{t('settings.terms')}</a>
                      <span className="text-foreground/30">·</span>
                      <a href="#" className="text-primary hover:underline">{t('settings.privacy')}</a>
                      <span className="text-foreground/30">·</span>
                      <a href="#" className="text-primary hover:underline">{t('settings.about')}</a>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Delete account confirmation modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            key="delete-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => !deleting && setShowDeleteModal(false)}
            />
            <motion.div
              key="delete-modal"
              initial={{ opacity: 0, scale: 0.94, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 8 }}
              transition={{ duration: 0.18 }}
              className="relative bg-card border border-border rounded-3xl shadow-2xl w-full max-w-md p-8"
            >
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
                  <TriangleAlert className="w-8 h-8 text-destructive" />
                </div>
                <h2 className="text-xl font-bold mb-3">{t('settings.deleteAccountModalTitle')}</h2>
                <p className="text-sm text-foreground/60 leading-relaxed">
                  {t('settings.deleteAccountModalWarning')}
                </p>
              </div>

              {deleteError && (
                <p className="text-sm text-destructive text-center mb-4">{deleteError}</p>
              )}

              <div className="flex flex-col gap-3">
                <Button
                  variant="primary"
                  className="w-full bg-destructive hover:bg-destructive/90 border-destructive text-white"
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                >
                  {deleting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      {t('settings.deleteAccountModalConfirm')}
                    </span>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      {t('settings.deleteAccountModalConfirm')}
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                >
                  {t('settings.deleteAccountModalCancel')}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
