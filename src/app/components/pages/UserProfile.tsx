import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router';
import { Card } from '../Card';
import { Button } from '../Button';
import { Badge } from '../Badge';
import { useApp } from '../../store/AppStore';
import { useLanguage } from '../../i18n/LanguageContext';
import { api, uploadImage } from '../../../api/client';
import {
  Edit, Calendar, Users, Heart, Gift, Shirt,
  TrendingUp, Award, Star, Lock, X, UserCheck, UserPlus, Camera, Trash2,
} from 'lucide-react';

type ListUser = {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  bio?: string;
  followers: string[];
};

function UserListModal({
  title,
  userIds,
  fetchUrl,
  onClose,
}: {
  title: string;
  userIds: string[];
  fetchUrl: string;
  onClose: () => void;
}) {
  const { currentUser, followUser, unfollowUser } = useApp();
  const { t } = useLanguage();
  const [users, setUsers] = useState<ListUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<ListUser[]>(fetchUrl)
      .then(setUsers)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [fetchUrl]);

  const handleFollow = async (userId: string) => {
    const isFollowing = currentUser?.following.includes(userId) ?? false;
    if (isFollowing) {
      await unfollowUser(userId);
    } else {
      await followUser(userId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-card rounded-3xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-bold">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-4 space-y-3">
          {loading && (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          )}
          {!loading && users.length === 0 && (
            <p className="text-center text-foreground/50 py-8">{t('userProfile.noUsers')}</p>
          )}
          {users.map(user => {
            const isFollowing = currentUser?.following.includes(user.id) ?? false;
            const isSelf = user.id === currentUser?.id;
            return (
              <div key={user.id} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-muted/50 transition-colors">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex-shrink-0 overflow-hidden">
                  {user.avatar && <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{user.name}</p>
                  <p className="text-sm text-foreground/60">@{user.username}</p>
                  {user.bio && <p className="text-xs text-foreground/50 truncate mt-0.5">{user.bio}</p>}
                </div>
                {!isSelf && (
                  <Button
                    variant={isFollowing ? 'outline' : 'primary'}
                    size="sm"
                    onClick={() => handleFollow(user.id)}
                  >
                    {isFollowing
                      ? <><UserCheck className="w-3 h-3" /> {t('userProfile.followingBtn')}</>
                      : <><UserPlus className="w-3 h-3" /> {t('userProfile.follow')}</>}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function UserProfile() {
  const { currentUser, wishes, updateProfile } = useApp();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [modal, setModal] = useState<'followers' | 'following' | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [localAvatar, setLocalAvatar] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const avatarMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!avatarMenuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(e.target as Node)) {
        setAvatarMenuOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [avatarMenuOpen]);

  const formatJoinDate = (date: Date | string) => {
    const d = new Date(date);
    const locale = lang === 'uk' ? 'uk-UA' : 'en-US';
    return d.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  };

  const displayAvatar = localAvatar !== null ? localAvatar : currentUser?.avatar;

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert(t('userProfile.avatarSizeError'));
      return;
    }
    const preview = URL.createObjectURL(file);
    setLocalAvatar(preview);
    setAvatarUploading(true);
    setAvatarMenuOpen(false);
    const prevAvatar = currentUser?.avatar ?? null;
    try {
      const url = await uploadImage(file);
      await updateProfile({ avatar: `http://localhost:5000${url}` });
      setLocalAvatar(null);
    } catch {
      setLocalAvatar(prevAvatar);
      alert(t('userProfile.avatarError'));
    } finally {
      setAvatarUploading(false);
      URL.revokeObjectURL(preview);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handleAvatarDelete = async () => {
    setAvatarMenuOpen(false);
    const prevAvatar = currentUser?.avatar ?? null;
    setLocalAvatar('');
    try {
      await updateProfile({ avatar: '' });
      setLocalAvatar(null);
    } catch {
      setLocalAvatar(prevAvatar);
      alert(t('userProfile.avatarDeleteError'));
    }
  };

  if (!currentUser) return null;

  const totalWishes = wishes.length;
  const reservedCount = wishes.filter(w => w.reserved).length;
  const avgConfidence = totalWishes > 0
    ? Math.round(wishes.reduce((s, w) => s + w.confidence, 0) / totalWishes)
    : 0;
  const followersCount = currentUser.followers.length;
  const followingCount = currentUser.following.length;

  const achievements = [
    {
      icon: Gift,
      title: t('userProfile.ach1Title'),
      description: t('userProfile.ach1Desc'),
      gradient: 'from-primary to-accent',
      unlocked: totalWishes >= 1,
    },
    {
      icon: Users,
      title: t('userProfile.ach2Title'),
      description: t('userProfile.ach2Desc'),
      gradient: 'from-secondary to-primary',
      unlocked: followersCount >= 5,
    },
    {
      icon: TrendingUp,
      title: t('userProfile.ach3Title'),
      description: t('userProfile.ach3Desc'),
      gradient: 'from-accent to-secondary',
      unlocked: avgConfidence >= 80,
    },
    {
      icon: Star,
      title: t('userProfile.ach4Title'),
      description: t('userProfile.ach4Desc'),
      gradient: 'from-primary to-secondary',
      unlocked: totalWishes >= 10,
    },
  ];

  const recentWishes = wishes.slice(0, 6);

  const stats = [
    { icon: Gift,       value: totalWishes,         label: t('userProfile.totalWishes'), gradient: 'from-primary to-accent' },
    { icon: Heart,      value: reservedCount,        label: t('userProfile.reserved'),    gradient: 'from-secondary to-primary' },
    { icon: TrendingUp, value: `${avgConfidence}%`,  label: t('userProfile.aktualnost'),  gradient: 'from-accent to-secondary' },
    { icon: Users,      value: followersCount,       label: t('userProfile.followers'),   gradient: 'from-primary to-secondary' },
  ];

  return (
    <div className="min-h-screen">
      {/* Cover */}
      <div className="h-48 bg-gradient-to-br from-primary via-secondary to-accent" />

      <div className="max-w-5xl mx-auto px-6">
        {/* Avatar + Info */}
        <div className="relative -mt-16 mb-8">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-end">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative shrink-0"
              ref={avatarMenuRef}
            >
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />

              {/* Avatar image */}
              <div className="relative w-28 h-28 rounded-3xl border-4 border-card shadow-xl overflow-hidden group">
                <div className="w-full h-full bg-gradient-to-br from-primary to-accent">
                  {displayAvatar ? (
                    <img
                      src={displayAvatar}
                      alt={currentUser.name}
                      className="w-full h-full object-cover"
                    />
                  ) : null}
                </div>
                {avatarUploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  </div>
                )}
              </div>

              {/* Camera action button */}
              <button
                onClick={() => setAvatarMenuOpen(o => !o)}
                disabled={avatarUploading}
                className="absolute bottom-2 right-2 w-9 h-9 rounded-xl bg-card shadow-lg flex items-center justify-center hover:scale-110 transition-transform disabled:opacity-50"
              >
                <Camera className="w-4 h-4 text-primary" />
              </button>

              {/* Dropdown menu */}
              <AnimatePresence>
                {avatarMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.92, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: -4 }}
                    transition={{ duration: 0.12 }}
                    className="absolute top-full left-0 mt-2 w-44 bg-card border border-border rounded-2xl shadow-xl z-20 overflow-hidden"
                  >
                    <button
                      onClick={() => avatarInputRef.current?.click()}
                      className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-left hover:bg-muted transition-colors"
                    >
                      <Camera className="w-4 h-4 text-primary flex-shrink-0" />
                      {t('userProfile.changePhoto')}
                    </button>
                    {displayAvatar && (
                      <button
                        onClick={handleAvatarDelete}
                        className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-left hover:bg-muted transition-colors text-destructive"
                      >
                        <Trash2 className="w-4 h-4 flex-shrink-0" />
                        {t('userProfile.deletePhoto')}
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            <div className="flex-1">
              <div className="bg-card rounded-3xl p-6 shadow-xl">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold mb-1">{currentUser.name}</h1>
                    <p className="text-foreground/60 mb-3">@{currentUser.username}</p>
                    {(currentUser as any).createdAt && (
                      <div className="flex items-center gap-1 text-sm text-foreground/60">
                        <Calendar className="w-4 h-4" />
                        <span>{t('userProfile.joinedDate')} {formatJoinDate((currentUser as any).createdAt)}</span>
                      </div>
                    )}
                  </div>
                  <Button variant="primary" onClick={() => navigate('/settings')}>
                    <Edit className="w-4 h-4" />
                    {t('userProfile.editProfile')}
                  </Button>
                </div>

                {currentUser.bio && (
                  <p className="mt-4 text-foreground/80 leading-relaxed">{currentUser.bio}</p>
                )}

                <div className="flex gap-6 mt-4">
                  <button
                    onClick={() => setModal('followers')}
                    className="text-left hover:opacity-70 transition-opacity"
                  >
                    <span className="font-semibold">{followersCount}</span>
                    <span className="text-sm text-foreground/60 ml-1">{t('userProfile.followers')}</span>
                  </button>
                  <button
                    onClick={() => setModal('following')}
                    className="text-left hover:opacity-70 transition-opacity"
                  >
                    <span className="font-semibold">{followingCount}</span>
                    <span className="text-sm text-foreground/60 ml-1">{t('userProfile.following')}</span>
                  </button>
                  <div>
                    <span className="font-semibold">{totalWishes}</span>
                    <span className="text-sm text-foreground/60 ml-1">{t('userProfile.wishes')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="text-center">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center mx-auto mb-3`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <p className="text-2xl font-bold mb-1">{stat.value}</p>
                <p className="text-sm text-foreground/60">{stat.label}</p>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Preferences + Sizes */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Heart className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">{t('userProfile.prefsTitle')}</h2>
            </div>
            <div className="space-y-4">
              {(currentUser.preferences?.favoriteColors?.length ?? 0) > 0 && (
                <div>
                  <p className="text-sm font-medium text-foreground/70 mb-2">{t('userProfile.colors')}</p>
                  <div className="flex flex-wrap gap-2">
                    {currentUser.preferences?.favoriteColors?.map((c, i) => <Badge key={i} variant="primary">{c}</Badge>)}
                  </div>
                </div>
              )}
              {(currentUser.preferences?.interests?.length ?? 0) > 0 && (
                <div>
                  <p className="text-sm font-medium text-foreground/70 mb-2">{t('userProfile.interests')}</p>
                  <div className="flex flex-wrap gap-2">
                    {currentUser.preferences.interests.map((x, i) => <Badge key={i} variant="secondary">{x}</Badge>)}
                  </div>
                </div>
              )}
              {(currentUser.preferences?.brands?.length ?? 0) > 0 && (
                <div>
                  <p className="text-sm font-medium text-foreground/70 mb-2">{t('userProfile.brands')}</p>
                  <div className="flex flex-wrap gap-2">
                    {currentUser.preferences?.brands?.map((b, i) => <Badge key={i} variant="accent">{b}</Badge>)}
                  </div>
                </div>
              )}
              {!currentUser.preferences?.favoriteColors?.length &&
               !currentUser.preferences?.interests?.length &&
               !currentUser.preferences?.brands?.length && (
                <p className="text-sm text-foreground/50">
                  {t('userProfile.prefsEmpty')}
                </p>
              )}
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                <Shirt className="w-5 h-5 text-secondary" />
              </div>
              <h2 className="text-xl font-semibold">{t('userProfile.sizesTitle')}</h2>
            </div>
            <div className="space-y-0">
              {[
                { label: t('userProfile.clothing'), value: currentUser.sizes?.clothing },
                { label: t('userProfile.shoe'), value: currentUser.sizes?.shoe },
                { label: t('userProfile.ring'), value: currentUser.sizes?.ring },
              ].map((row, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <span className="text-sm text-foreground/70">{row.label}</span>
                  <span className="font-medium">{row.value || <span className="text-foreground/40 text-sm">{t('userProfile.notSet')}</span>}</span>
                </div>
              ))}
              {!currentUser.sizes?.clothing && !currentUser.sizes?.shoe && !currentUser.sizes?.ring && (
                <p className="text-sm text-foreground/50 pt-2">
                  <button onClick={() => navigate('/settings')} className="text-primary hover:underline">{t('userProfile.sizesEmpty')}</button>
                </p>
              )}
            </div>
          </Card>
        </div>

        {/* Wishes */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">{t('userProfile.myWishes')}</h2>
            <Button variant="outline" onClick={() => navigate('/wishlists')}>{t('userProfile.all')}</Button>
          </div>
          {recentWishes.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-4">
              {recentWishes.map((wish, i) => (
                <motion.div
                  key={wish.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => navigate(`/wishes/${wish.id}`)}
                  className="cursor-pointer"
                >
                  <Card hover>
                    {wish.image && (
                      <img src={wish.image} alt={wish.title} className="w-full h-36 object-cover rounded-xl mb-3" />
                    )}
                    <h3 className="font-semibold truncate mb-1">{wish.title}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-primary font-bold">${wish.price}</span>
                      {wish.reserved && <Badge variant="success">{t('common.reserved')}</Badge>}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card className="text-center py-10">
              <Gift className="w-12 h-12 text-foreground/20 mx-auto mb-3" />
              <p className="text-foreground/60 mb-4">{t('userProfile.noWishes')}</p>
              <Button variant="primary" onClick={() => navigate('/wishlist/new')}>{t('userProfile.addFirst')}</Button>
            </Card>
          )}
        </div>

        {/* Achievements */}
        <Card className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Award className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">{t('userProfile.achievementsTitle')}</h2>
              <p className="text-sm text-foreground/60">{t('userProfile.achievementsSubtitle')}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {achievements.map((a, i) => (
              <div key={i} className={`text-center p-4 rounded-2xl transition-colors ${a.unlocked ? 'bg-muted/50 hover:bg-muted' : 'bg-muted/20 opacity-50'}`}>
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${a.gradient} flex items-center justify-center mx-auto mb-3 relative`}>
                  <a.icon className="w-8 h-8 text-white" />
                  {!a.unlocked && (
                    <div className="absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center">
                      <Lock className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>
                <p className="font-semibold text-sm mb-1">{a.title}</p>
                <p className="text-xs text-foreground/60">{a.description}</p>
              </div>
            ))}
          </div>
        </Card>

        <div className="h-12" />
      </div>

      {modal === 'followers' && (
        <UserListModal
          title={`${t('userProfile.followersModal')} (${followersCount})`}
          userIds={currentUser.followers}
          fetchUrl="/users/me/followers"
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'following' && (
        <UserListModal
          title={`${t('userProfile.followingModal')} (${followingCount})`}
          userIds={currentUser.following}
          fetchUrl="/users/me/following"
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
