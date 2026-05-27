import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { api } from '../../../api/client';
import { useApp, Wish } from '../../store/AppStore';
import { useLanguage } from '../../i18n/LanguageContext';
import { Card } from '../Card';
import { Button } from '../Button';
import { Badge } from '../Badge';
import {
  ChevronLeft, Gift, Users, Heart, UserPlus, UserCheck, Calendar, Shirt, Lock,
} from 'lucide-react';
import { ApiError } from '../../../api/client';

type PublicUser = {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  bio?: string;
  followers: string[];
  following: string[];
  createdAt?: string;
  preferences?: { favoriteColors: string[]; interests: string[]; brands: string[] };
  sizes?: { clothing?: string; shoe?: string; ring?: string };
};

export function PublicProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser, followUser, unfollowUser } = useApp();
  const { t, lang } = useLanguage();

  const [user, setUser] = useState<PublicUser | null>(null);
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState<'private' | 'friends' | null>(null);

  const formatJoinDate = (date: string) => {
    const d = new Date(date);
    const locale = lang === 'uk' ? 'uk-UA' : 'en-US';
    return d.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  };

  useEffect(() => {
    if (!id) return;
    api.get<{ user: PublicUser; wishes: Wish[] }>(`/social/users/${id}`)
      .then(data => {
        setUser(data.user);
        setWishes(data.wishes);
      })
      .catch(err => {
        if (err instanceof ApiError && err.status === 403) {
          setAccessDenied(err.message.includes('friends') ? 'friends' : 'private');
        } else {
          setError(err.message);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const isFollowing = currentUser?.following.includes(id ?? '') ?? false;

  // Filter wishes based on visibility permissions
  const visibleWishes = wishes.filter(wish => {
    if (wish.archived) return false;
    if (wish.fulfilled) return false;
    if (wish.visibility === 'public') return true;
    if (wish.visibility === 'friends') {
      // Show if viewer and owner mutually follow each other
      const viewerFollowsOwner = currentUser?.following.includes(id ?? '') ?? false;
      const ownerFollowsViewer = user?.followers.includes(currentUser?.id ?? '') ?? false;
      return viewerFollowsOwner && ownerFollowsViewer;
    }
    // private — never shown on public profile
    return false;
  });

  const handleFollow = async () => {
    if (!id) return;
    if (isFollowing) {
      await unfollowUser(id);
    } else {
      await followUser(id);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-sm px-6">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Lock className="w-10 h-10 text-foreground/30" />
          </div>
          <h2 className="text-xl font-bold mb-2">
            {accessDenied === 'private' ? t('publicProfile.profilePrivate') : t('publicProfile.profileFriends')}
          </h2>
          <p className="text-sm text-foreground/60 mb-6">
            {accessDenied === 'private' ? t('publicProfile.profilePrivateDesc') : t('publicProfile.profileFriendsDesc')}
          </p>
          <Button variant="primary" onClick={() => navigate(-1 as any)}>{t('publicProfile.back')}</Button>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Users className="w-16 h-16 text-foreground/20 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">{t('publicProfile.notFound')}</h2>
          <Button variant="primary" onClick={() => navigate(-1 as any)}>{t('publicProfile.back')}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Back bar */}
      <div className="sticky top-0 z-10 bg-sidebar/90 backdrop-blur border-b border-sidebar-border px-6 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate(-1 as any)}
          className="flex items-center gap-2 text-foreground/60 hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          {t('publicProfile.back')}
        </button>
      </div>

      {/* Cover */}
      <div className="h-40 bg-gradient-to-br from-primary via-secondary to-accent" />

      <div className="max-w-4xl mx-auto px-6">
        {/* Avatar + header */}
        <div className="relative -mt-14 mb-8">
          <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-end">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-accent border-4 border-white shadow-xl overflow-hidden flex-shrink-0"
            >
              {user.avatar && (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              )}
            </motion.div>

            <div className="flex-1 bg-card rounded-3xl p-5 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-bold mb-0.5">{user.name}</h1>
                  <p className="text-foreground/60 text-sm">@{user.username}</p>
                  {user.createdAt && (
                    <div className="flex items-center gap-1 text-xs text-foreground/50 mt-1">
                      <Calendar className="w-3 h-3" />
                      {t('publicProfile.joinedDate')} {formatJoinDate(user.createdAt)}
                    </div>
                  )}
                </div>
                {currentUser && currentUser.id !== user.id && (
                  <Button
                    variant={isFollowing ? 'outline' : 'primary'}
                    onClick={handleFollow}
                  >
                    {isFollowing
                      ? <><UserCheck className="w-4 h-4" /> {t('publicProfile.following')}</>
                      : <><UserPlus className="w-4 h-4" /> {t('publicProfile.follow')}</>}
                  </Button>
                )}
              </div>

              {user.bio && (
                <p className="mt-3 text-sm text-foreground/70 leading-relaxed">{user.bio}</p>
              )}

              <div className="flex gap-5 mt-3 text-sm">
                <span><strong>{user.followers.length}</strong> <span className="text-foreground/60">{t('publicProfile.followers')}</span></span>
                <span><strong>{user.following.length}</strong> <span className="text-foreground/60">{t('publicProfile.followingLabel')}</span></span>
                <span><strong>{visibleWishes.length}</strong> <span className="text-foreground/60">{t('publicProfile.wishes')}</span></span>
              </div>
            </div>
          </div>
        </div>

        {/* Preferences row */}
        {((user.preferences?.interests?.length ?? 0) > 0 || (user.preferences?.brands?.length ?? 0) > 0) && (
          <Card className="mb-6">
            <h2 className="font-semibold mb-3">{t('publicProfile.interests')}</h2>
            <div className="flex flex-wrap gap-2">
              {user.preferences?.interests?.map((x, i) => <Badge key={i} variant="secondary">{x}</Badge>)}
              {user.preferences?.brands?.map((b, i) => <Badge key={i} variant="accent">{b}</Badge>)}
            </div>
          </Card>
        )}

        {/* Sizes */}
        {(user.sizes?.clothing || user.sizes?.shoe || user.sizes?.ring) && (
          <Card className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-secondary/10 flex items-center justify-center">
                <Shirt className="w-5 h-5 text-secondary" />
              </div>
              <h2 className="font-semibold">{t('userProfile.sizesTitle')}</h2>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: t('userProfile.clothing'), value: user.sizes?.clothing },
                { label: t('userProfile.shoe'),     value: user.sizes?.shoe },
                { label: t('userProfile.ring'),     value: user.sizes?.ring },
              ].filter(row => row.value).map((row, i) => (
                <div key={i} className="flex flex-col items-center justify-center p-3 rounded-xl bg-muted/50 text-center">
                  <span className="text-xs text-foreground/50 mb-1">{row.label}</span>
                  <span className="font-bold text-lg">{row.value}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Wishes */}
        <div className="mb-10">
          <h2 className="text-xl font-bold mb-4">{t('publicProfile.publicWishes')}</h2>
          {visibleWishes.length === 0 ? (
            <Card className="text-center py-12">
              <Gift className="w-12 h-12 text-foreground/20 mx-auto mb-3" />
              <p className="text-foreground/50">{t('publicProfile.noPublicWishes')}</p>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {visibleWishes.map((wish, i) => (
                <motion.div
                  key={wish.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => navigate(`/wishes/${wish.id}`)}
                  className="cursor-pointer"
                >
                  <Card hover>
                    {wish.image ? (
                      <img src={wish.image} alt={wish.title} className="w-full h-36 object-cover rounded-xl mb-3" />
                    ) : (
                      <div className="w-full h-36 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mb-3">
                        <Gift className="w-10 h-10 text-primary/30" />
                      </div>
                    )}
                    <h3 className="font-semibold truncate mb-1">{wish.title}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-primary font-bold text-sm">{wish.currency} {wish.price.toLocaleString()}</span>
                      <div className="flex items-center gap-1 text-xs text-foreground/50">
                        <Heart className="w-3 h-3" />
                        {wish.likes?.length ?? 0}
                        {wish.reserved && <Badge variant="success" className="ml-1">{t('publicProfile.reserved')}</Badge>}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
