import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router';
import { api } from '../../../api/client';
import { useApp } from '../../store/AppStore';
import { useLanguage } from '../../i18n/LanguageContext';
import { Card } from '../Card';
import { Button } from '../Button';
import { Badge } from '../Badge';
import {
  Heart, MessageCircle, Gift, Users, Search, Plus, Eye,
  Send, X, Sparkles, Clock, TrendingUp, UserPlus, Check,
} from 'lucide-react';

type FeedUser = { id: string; name: string; username: string; avatar?: string };
type FeedComment = { id: string; user: string; text: string; createdAt?: string };
type FeedWish = {
  id: string;
  title: string;
  image: string;
  price: number;
  currency: string;
  priority: number;
  confidence: number;
  reserved: boolean;
  reservedBy?: string;
  likes: string[];
  comments: FeedComment[];
  user: FeedUser;
  tags: string[];
  createdAt: string;
  likesCount?: number;
};

type FeedTab = 'recommended' | 'new' | 'popular' | 'following';

const TAB_DEFS: { id: FeedTab; labelKey: string; Icon: React.ElementType }[] = [
  { id: 'recommended', labelKey: 'socialFeed.tabRecommended', Icon: Sparkles },
  { id: 'new',         labelKey: 'socialFeed.tabNew',         Icon: Clock },
  { id: 'popular',     labelKey: 'socialFeed.tabPopular',     Icon: TrendingUp },
  { id: 'following',   labelKey: 'socialFeed.tabFollowing',   Icon: Users },
];

const TAG_FILTER_KEYS = [
  'socialFeed.tagElectronics',
  'socialFeed.tagLifestyle',
  'socialFeed.tagDream',
  'socialFeed.tagGift',
  'socialFeed.tagSelfcare',
  'socialFeed.tagEducation',
] as const;

export function SocialFeed() {
  const { currentUser, followUser, unfollowUser } = useApp();
  const { t, timeAgo } = useLanguage();
  const navigate = useNavigate();

  const [activeTab,   setActiveTab]   = useState<FeedTab>('recommended');
  const [activeTag,   setActiveTag]   = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [search,      setSearch]      = useState('');
  const [wishes,      setWishes]      = useState<FeedWish[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page,        setPage]        = useState(1);
  const [hasMore,     setHasMore]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  const [copiedIds,      setCopiedIds]      = useState<Record<string, 'loading' | 'done'>>({});
  const [openCommentId,  setOpenCommentId]  = useState<string | null>(null);
  const [commentTexts,   setCommentTexts]   = useState<Record<string, string>>({});
  const [commentSending, setCommentSending] = useState<Record<string, boolean>>({});

  const priorityLabel = (p: number) =>
    t(p <= 2 ? 'socialFeed.priorityLow' : p >= 4 ? 'socialFeed.priorityHigh' : 'socialFeed.priorityMid');

  const fetchWishes = useCallback(async (
    tab: FeedTab, tag: string | null, term: string, pg: number
  ) => {
    const isFirst = pg === 1;
    isFirst ? setLoading(true) : setLoadingMore(true);
    setError(null);
    try {
      if (tab === 'following') {
        const data = await api.get<FeedWish[]>('/social/feed');
        setWishes(data);
        setHasMore(false);
      } else {
        const params = new URLSearchParams({ sort: tab, page: String(pg), limit: '20' });
        if (tag)  params.set('tag', tag);
        if (term) params.set('search', term);
        const { wishes: data, hasMore: more } =
          await api.get<{ wishes: FeedWish[]; hasMore: boolean }>(`/social/discovery?${params}`);
        setWishes(prev => isFirst ? data : [...prev, ...data]);
        setHasMore(more);
        setPage(pg);
      }
    } catch (err: unknown) {
      if (isFirst) { setWishes([]); setError(t('socialFeed.loadError')); }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchWishes(activeTab, activeTag, search, 1);
  }, [activeTab, activeTag, search, fetchWishes]);

  const switchTab = (tab: FeedTab) => {
    setActiveTab(tab);
    setActiveTag(null);
    setSearch('');
    setSearchInput('');
  };

  const toggleTag = (tag: string) => {
    setActiveTag(prev => prev === tag ? null : tag);
    if (activeTab === 'following') setActiveTab('recommended');
  };

  const submitSearch = () => setSearch(searchInput);

  const handleLike = async (wishId: string) => {
    try {
      const updated = await api.post<FeedWish>(`/wishes/${wishId}/like`);
      setWishes(prev => prev.map(w => w.id === wishId ? { ...w, likes: updated.likes } : w));
    } catch {}
  };

  const handleFollow = async (userId: string) => {
    const following = currentUser?.following.includes(userId) ?? false;
    try {
      if (following) await unfollowUser(userId);
      else await followUser(userId);
    } catch {}
  };

  const handleCopy = async (wishId: string) => {
    if (copiedIds[wishId]) return;
    setCopiedIds(prev => ({ ...prev, [wishId]: 'loading' }));
    try {
      await api.post(`/wishes/${wishId}/copy`);
      setCopiedIds(prev => ({ ...prev, [wishId]: 'done' }));
    } catch {
      setCopiedIds(prev => { const n = { ...prev }; delete n[wishId]; return n; });
    }
  };

  const handleAddComment = async (wishId: string) => {
    const text = (commentTexts[wishId] ?? '').trim();
    if (!text || commentSending[wishId]) return;
    setCommentSending(prev => ({ ...prev, [wishId]: true }));
    try {
      const updated = await api.post<FeedWish>(`/wishes/${wishId}/comments`, { text });
      setWishes(prev => prev.map(w => w.id === wishId
        ? { ...w, comments: updated.comments as FeedComment[] } : w));
      setCommentTexts(prev => ({ ...prev, [wishId]: '' }));
    } catch {}
    finally { setCommentSending(prev => ({ ...prev, [wishId]: false })); }
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-1">{t('socialFeed.title')}</h1>
          <p className="text-foreground/60">{t('socialFeed.subtitle')}</p>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40 pointer-events-none" />
          <input
            className="w-full pl-9 pr-9 py-3 rounded-2xl bg-card border border-border focus:outline-none focus:ring-2 focus:ring-ring text-sm"
            placeholder={t('socialFeed.searchPlaceholder')}
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submitSearch()}
          />
          {searchInput && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2"
              onClick={() => { setSearchInput(''); setSearch(''); }}
            >
              <X className="w-4 h-4 text-foreground/40" />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-muted rounded-2xl mb-4 overflow-x-auto">
          {TAB_DEFS.map(({ id, labelKey, Icon }) => (
            <button
              key={id}
              onClick={() => switchTab(id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex-1 justify-center ${
                activeTab === id
                  ? 'bg-card shadow text-primary'
                  : 'text-foreground/60 hover:text-foreground'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t(labelKey)}
            </button>
          ))}
        </div>

        {/* Tag chips */}
        {activeTab !== 'following' && (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-none">
            {TAG_FILTER_KEYS.map(key => {
              const label = t(key);
              return (
                <button
                  key={key}
                  onClick={() => toggleTag(label)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${
                    activeTag === label
                      ? 'bg-primary text-white border-primary'
                      : 'bg-card border-border text-foreground/70 hover:border-primary/50 hover:text-primary'
                  }`}
                >
                  #{label}
                </button>
              );
            })}
          </div>
        )}

        {/* Active search/tag banner */}
        {(search || activeTag) && (
          <div className="flex items-center gap-2 mb-4 text-sm text-foreground/60">
            <span>{t('socialFeed.filterLabel')}</span>
            {search && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                "{search}"
                <button onClick={() => { setSearch(''); setSearchInput(''); }}><X className="w-3 h-3" /></button>
              </span>
            )}
            {activeTag && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                #{activeTag}
                <button onClick={() => setActiveTag(null)}><X className="w-3 h-3" /></button>
              </span>
            )}
          </div>
        )}

        {/* Feed */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
        ) : error ? (
          <Card className="text-center py-12">
            <p className="text-destructive mb-3">{error}</p>
            <Button variant="outline" onClick={() => fetchWishes(activeTab, activeTag, search, 1)}>
              {t('socialFeed.retryButton')}
            </Button>
          </Card>
        ) : wishes.length === 0 ? (
          <Card className="text-center py-16">
            <Gift className="w-16 h-16 text-foreground/20 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">
              {activeTab === 'following' ? t('socialFeed.emptyFollowingTitle') : t('socialFeed.emptyNoResults')}
            </h2>
            <p className="text-foreground/60 text-sm">
              {activeTab === 'following'
                ? t('socialFeed.emptyFollowingSub')
                : t('socialFeed.emptyNoResultsSub')}
            </p>
            {activeTab === 'following' && (
              <Button variant="primary" className="mt-4" onClick={() => navigate('/users/search')}>
                <Users className="w-4 h-4" />
                {t('socialFeed.findPeople')}
              </Button>
            )}
          </Card>
        ) : (
          <div className="space-y-5">
            {wishes.map((wish, index) => {
              const isFollowing = currentUser?.following.includes(wish.user.id) ?? false;
              const isLiked     = currentUser ? wish.likes.includes(currentUser.id) : false;
              const isOwn       = wish.user.id === currentUser?.id;
              const copyState   = copiedIds[wish.id];
              const commentOpen = openCommentId === wish.id;

              return (
                <motion.div
                  key={wish.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.25) }}
                >
                  <Card className="overflow-hidden p-0">

                    {/* User header */}
                    <div className="flex items-center gap-3 px-4 pt-4 pb-3">
                      <button
                        onClick={() => navigate(`/users/${wish.user.id}`)}
                        className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex-shrink-0 overflow-hidden"
                      >
                        {wish.user.avatar && (
                          <img src={wish.user.avatar} alt={wish.user.name} className="w-full h-full object-cover" />
                        )}
                      </button>
                      <button
                        onClick={() => navigate(`/users/${wish.user.id}`)}
                        className="flex-1 min-w-0 text-left"
                      >
                        <p className="font-semibold text-sm leading-tight truncate">{wish.user.name}</p>
                        <p className="text-xs text-foreground/50">
                          @{wish.user.username} · {timeAgo(wish.createdAt)}
                        </p>
                      </button>
                      {!isOwn && (
                        <button
                          onClick={() => handleFollow(wish.user.id)}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                            isFollowing
                              ? 'border-border text-foreground/50 bg-muted'
                              : 'border-primary text-primary hover:bg-primary hover:text-white'
                          }`}
                        >
                          {isFollowing
                            ? t('socialFeed.following')
                            : <><UserPlus className="w-3 h-3" />{t('socialFeed.follow')}</>}
                        </button>
                      )}
                    </div>

                    {/* Image */}
                    {wish.image && (
                      <div
                        className="aspect-square max-h-[504px] overflow-hidden cursor-pointer"
                        onClick={() => navigate(`/wishes/${wish.id}`)}
                      >
                        <img
                          src={wish.image}
                          alt={wish.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}

                    {/* Info */}
                    <div
                      className="px-4 pt-3 pb-1 cursor-pointer"
                      onClick={() => navigate(`/wishes/${wish.id}`)}
                    >
                      <h3 className="text-base font-bold mb-2 leading-tight">{wish.title}</h3>
                      <div className="flex flex-wrap gap-1.5">
                        <Badge variant="primary" className="text-xs">
                          {wish.currency} {wish.price.toLocaleString()}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {priorityLabel(wish.priority)}
                        </Badge>
                        {wish.tags.slice(0, 3).map((tag, i) => (
                          <button
                            key={i}
                            onClick={e => { e.stopPropagation(); toggleTag(tag); }}
                            className="text-xs text-foreground/50 bg-muted px-2 py-0.5 rounded-full hover:text-primary transition-colors"
                          >
                            #{tag}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 px-4 py-3 border-t border-border mt-2">
                      {/* Like */}
                      <button
                        onClick={() => handleLike(wish.id)}
                        className={`flex items-center gap-1 px-2 py-1.5 rounded-xl transition-colors ${
                          isLiked ? 'text-primary' : 'text-foreground/60 hover:text-primary'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                        <span className="text-xs font-medium">{wish.likes.length}</span>
                      </button>

                      {/* Comments */}
                      <button
                        onClick={() => setOpenCommentId(commentOpen ? null : wish.id)}
                        className={`flex items-center gap-1 px-2 py-1.5 rounded-xl transition-colors ${
                          commentOpen ? 'text-primary' : 'text-foreground/60 hover:text-primary'
                        }`}
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span className="text-xs font-medium">{wish.comments.length}</span>
                      </button>

                      <button
                        onClick={() => navigate(`/wishes/${wish.id}`)}
                        className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-primary text-white hover:bg-primary/90 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        {t('socialFeed.viewButton')}
                      </button>
                    </div>

                    {/* Inline comments */}
                    {commentOpen && (
                      <div className="px-4 pb-4 space-y-2 border-t border-border pt-3">
                        {wish.comments.length > 0 && (
                          <div className="space-y-2 mb-2 max-h-48 overflow-y-auto">
                            {wish.comments.map((c, i) => (
                              <div key={c.id || i} className="flex gap-2">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-accent flex-shrink-0 mt-0.5" />
                                <div className="flex-1 bg-muted rounded-xl px-3 py-1.5">
                                  <p className="text-sm">{c.text}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        {currentUser && (
                          <div className="flex gap-2">
                            <input
                              className="flex-1 px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                              placeholder={t('socialFeed.commentPlaceholder')}
                              value={commentTexts[wish.id] ?? ''}
                              onChange={e => setCommentTexts(prev => ({ ...prev, [wish.id]: e.target.value }))}
                              onKeyDown={e => { if (e.key === 'Enter') handleAddComment(wish.id); }}
                              autoFocus
                            />
                            <button
                              onClick={() => handleAddComment(wish.id)}
                              disabled={commentSending[wish.id] || !(commentTexts[wish.id] ?? '').trim()}
                              className="p-2 rounded-xl bg-primary text-white disabled:opacity-50 hover:bg-primary/90 transition-colors flex-shrink-0"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Load more */}
        {hasMore && !loading && (
          <div className="mt-6 text-center">
            <Button
              variant="outline"
              onClick={() => fetchWishes(activeTab, activeTag, search, page + 1)}
              disabled={loadingMore}
            >
              {loadingMore
                ? <><div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />{t('socialFeed.loadingMore')}</>
                : t('socialFeed.loadMore')}
            </Button>
          </div>
        )}

      </div>
    </div>
  );
}
