import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { useApp, Wish } from '../../store/AppStore';
import { useLanguage } from '../../i18n/LanguageContext';
import { api } from '../../../api/client';
import { Card } from '../Card';
import { Button } from '../Button';
import { Badge } from '../Badge';
import {
  ExternalLink, Star, TrendingUp, Tag, Clock,
  Globe, Users, Lock, Trash2, Edit, ChevronLeft, Gift, Calendar, Heart, Archive,
  Sparkles, AlertCircle, PenLine, CheckCircle2, RotateCcw,
} from 'lucide-react';
import { isOverdue } from '../AktualnostReminder';


export function WishDetail() {
  const { id } = useParams<{ id: string }>();
  const { wishes, currentUser, deleteWish, markWishAsRelevant, archiveWish, fulfillWish, unfulfillWish } = useApp();
  const { t, timeAgo } = useLanguage();
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);
  const [fetchedWish, setFetchedWish] = useState<Wish | null>(null);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [likes, setLikes] = useState<string[]>([]);
  const [reserved, setReserved] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [comments, setComments] = useState<Array<{ id: string; user: string; text: string; createdAt: Date }>>([]);
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  const storeWish = wishes.find(w => w.id === id);
  const wish = storeWish ?? fetchedWish;

  const wishUserId: string | undefined =
    wish ? ((wish as any).user?.id ?? (wish as any).user ?? undefined) : undefined;
  const isOwner = !!currentUser && wishUserId === currentUser.id;

  useEffect(() => {
    setImageError(false);
    if (!storeWish && id) {
      setFetchLoading(true);
      api.get<Wish>(`/wishes/${id}`)
        .then(w => {
          setFetchedWish(w);
          setLikes((w.likes as string[]) ?? []);
          setReserved(w.reserved);
          setComments((w.comments as any[]) ?? []);
        })
        .catch(() => {})
        .finally(() => setFetchLoading(false));
    } else if (storeWish) {
      setLikes((storeWish.likes as string[]) ?? []);
      setReserved(storeWish.reserved);
      setComments((storeWish.comments as any[]) ?? []);
    }
  }, [id, storeWish?.id]);

  const isLiked = currentUser ? likes.includes(currentUser.id) : false;
  const canReserve = !reserved && !isOwner;

  const priorityLabel = (p: number): string =>
    p <= 2 ? t('priority.low') : p >= 4 ? t('priority.high') : t('priority.medium');

  const priorityBadgeVariant = (p: number): 'secondary' | 'primary' | 'accent' =>
    p <= 2 ? 'secondary' : p >= 4 ? 'accent' : 'primary';

  const handleLike = async () => {
    if (!wish || !currentUser || actionLoading) return;
    setActionLoading(true);
    try {
      const updated = await api.post<Wish>(`/wishes/${wish.id}/like`);
      setLikes((updated.likes as string[]) ?? []);
    } catch {} finally {
      setActionLoading(false);
    }
  };

  const handleReserve = async () => {
    if (!wish || actionLoading) return;
    setActionLoading(true);
    try {
      await api.patch<Wish>(`/wishes/${wish.id}/reserve`);
      setReserved(true);
    } catch {} finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(t('wishDetail.deleteConfirm'))) return;
    setDeleting(true);
    await deleteWish(wish!.id);
    navigate('/wishlists');
  };

  const handleMarkRelevant = async () => {
    await markWishAsRelevant(wish!.id);
  };

  const handleArchive = async () => {
    if (!wish || !confirm(t('wishDetail.archiveConfirm'))) return;
    await archiveWish(wish.id);
    navigate('/archive');
  };

  const handleFulfill = async () => {
    if (!wish) return;
    if (wish.fulfilled) await unfulfillWish(wish.id);
    else await fulfillWish(wish.id);
  };

  const handleAddComment = async () => {
    if (!wish || !commentText.trim() || commentLoading) return;
    setCommentLoading(true);
    try {
      const updated = await api.post<Wish>(`/wishes/${wish.id}/comments`, { text: commentText.trim() });
      setComments((updated.comments as any[]) ?? []);
      setCommentText('');
    } catch {} finally {
      setCommentLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!wish) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Gift className="w-16 h-16 text-foreground/20 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">{t('wishDetail.notFound')}</h2>
          <Button variant="primary" onClick={() => navigate('/wishlists')}>{t('wishDetail.backToList')}</Button>
        </div>
      </div>
    );
  }

  // Visibility access control (client-side guard; backend enforces server-side)
  if (!isOwner) {
    if (wish.visibility === 'private') {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center max-w-sm mx-auto px-6">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
              <Lock className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold mb-3">{t('wishDetail.accessDeniedTitle')}</h2>
            <p className="text-foreground/60 mb-8 leading-relaxed">{t('wishDetail.accessDeniedPrivateDesc')}</p>
            <Button variant="outline" onClick={() => navigate(-1 as any)}>{t('wishDetail.accessDeniedBtn')}</Button>
          </div>
        </div>
      );
    }
    if (wish.visibility === 'friends') {
      const canView = currentUser && wishUserId && currentUser.following.includes(wishUserId);
      if (!canView) {
        return (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center max-w-sm mx-auto px-6">
              <div className="w-20 h-20 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-6">
                <Users className="w-10 h-10 text-secondary-foreground" />
              </div>
              <h2 className="text-2xl font-bold mb-3">{t('wishDetail.accessDeniedTitle')}</h2>
              <p className="text-foreground/60 mb-8 leading-relaxed">{t('wishDetail.accessDeniedFriendsDesc')}</p>
              <Button variant="outline" onClick={() => navigate(-1 as any)}>{t('wishDetail.accessDeniedBtn')}</Button>
            </div>
          </div>
        );
      }
    }
  }

  const visibilityConfig = {
    public:  { Icon: Globe, label: t('wishDetail.visPublic'),  variant: 'secondary' as const },
    friends: { Icon: Users, label: t('wishDetail.visFriends'), variant: 'secondary' as const },
    private: { Icon: Lock,  label: t('wishDetail.visPrivate'), variant: 'secondary' as const },
  };
  const visCfg = visibilityConfig[wish.visibility as keyof typeof visibilityConfig] ?? visibilityConfig.public;

  return (
    <div className="min-h-screen">
      {/* Back */}
      <div className="sticky top-0 z-10 bg-sidebar/90 backdrop-blur border-b border-sidebar-border px-6 py-3 flex items-center justify-between">
        <button
          onClick={() => navigate(-1 as any)}
          className="flex items-center gap-2 text-foreground/60 hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          {t('wishDetail.back')}
        </button>
        <div className="flex items-center gap-2">
          {isOwner && (
            <>
              <Button variant="outline" size="sm" onClick={() => navigate(`/wishlist/edit/${wish.id}`)}>
                <Edit className="w-4 h-4" />
                {t('wishDetail.edit')}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleDelete} disabled={deleting}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </>
          )}
          {!isOwner && (
            <button
              onClick={handleLike}
              disabled={actionLoading}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-colors ${
                isLiked ? 'text-primary bg-primary/10' : 'text-foreground/60 hover:text-primary hover:bg-primary/5'
              }`}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
              <span className="text-sm font-medium">{likes.length}</span>
            </button>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Image */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            {wish.image && !imageError ? (
              <img
                src={wish.image}
                alt={wish.title}
                className="w-full aspect-square object-cover rounded-3xl shadow-xl"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full aspect-square rounded-3xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                <Gift className="w-24 h-24 text-primary/30" />
              </div>
            )}
          </motion.div>

          {/* Info */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div>
              <div className="flex items-start justify-between gap-3 mb-2">
                <h1 className={`text-3xl font-bold leading-tight ${wish.fulfilled ? 'line-through text-foreground/50' : ''}`}>{wish.title}</h1>
                <div className="flex flex-col gap-1 flex-shrink-0">
                  {wish.fulfilled && <Badge variant="success" className="bg-green-100 text-green-700 border-green-200"><CheckCircle2 className="w-3 h-3" />{t('wish.fulfilled')}</Badge>}
                  {reserved && !wish.fulfilled && <Badge variant="success"><Gift className="w-3 h-3" />{t('wishDetail.reserved')}</Badge>}
                  {wish.archived && <Badge variant="secondary" className="bg-gray-100 text-gray-500"><Archive className="w-3 h-3" />{t('wishDetail.archivedBadge')}</Badge>}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">
                  <visCfg.Icon className="w-3 h-3" />
                  {visCfg.label}
                </Badge>
                <Badge variant={priorityBadgeVariant(wish.priority)}>
                  <Star className="w-3 h-3" />
                  {priorityLabel(wish.priority)}
                </Badge>
                {wish.fetchStatus === 'auto' && (
                  <Badge variant="secondary" className="bg-green-50 text-green-700 border border-green-200">
                    <Sparkles className="w-3 h-3" />
                    {t('wishDetail.fetchStatusAuto')}
                  </Badge>
                )}
                {wish.fetchStatus === 'failed' && (
                  <Badge variant="secondary" className="bg-orange-50 text-orange-600 border border-orange-200">
                    <AlertCircle className="w-3 h-3" />
                    {t('wishDetail.fetchStatusFailed')}
                  </Badge>
                )}
                {(!wish.fetchStatus || wish.fetchStatus === 'manual') && (
                  <Badge variant="secondary" className="bg-muted text-foreground/50">
                    <PenLine className="w-3 h-3" />
                    {t('wishDetail.fetchStatusManual')}
                  </Badge>
                )}
              </div>
            </div>

            {/* Price */}
            <div className="text-4xl font-bold text-primary">
              {wish.currency} {wish.price.toLocaleString()}
            </div>

            {/* Metrics */}
            <Card>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-foreground/60 text-sm mb-1">
                    <TrendingUp className="w-4 h-4" />
                    {t('wishDetail.confidence')}
                  </div>
                  <div className="text-2xl font-bold text-primary">{wish.confidence}%</div>
                  <div className="w-full bg-muted rounded-full h-2 mt-2">
                    <div className="bg-primary rounded-full h-2 transition-all" style={{ width: `${wish.confidence}%` }} />
                  </div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-foreground/60 text-sm mb-1">
                    <Clock className="w-4 h-4" />
                    {t('wishDetail.aktualnost')}
                  </div>
                  <div className="text-2xl font-bold">{wish.aktualnostDuration}{t('wishDetail.weeks')}</div>
                  <div className="text-xs text-foreground/50 mt-2">{t('wishDetail.checkInterval')}</div>
                </div>
              </div>
            </Card>

            {/* Last checked */}
            {wish.lastChecked && (
              <div className="flex items-center gap-2 text-sm text-foreground/60">
                <Calendar className="w-4 h-4" />
                {t('wishDetail.lastChecked')}: {timeAgo(wish.lastChecked)}
              </div>
            )}

            {/* Tags */}
            {wish.tags.length > 0 && (
              <div>
                <div className="flex items-center gap-2 text-sm text-foreground/60 mb-2">
                  <Tag className="w-4 h-4" />
                  {t('wishDetail.tags')}
                </div>
                <div className="flex flex-wrap gap-2">
                  {wish.tags.map((tag, i) => <Badge key={i} variant="secondary">{tag}</Badge>)}
                </div>
              </div>
            )}

            {/* Link + Owner actions — all in one container for equal spacing */}
            {(wish.link || (isOwner && !wish.archived)) && (
              <div className="flex flex-col gap-3">
                {wish.link && (
                  <a href={wish.link} target="_blank" rel="noopener noreferrer" className="block">
                    <Button variant="outline" className="w-full">
                      <ExternalLink className="w-4 h-4" />
                      {t('wishDetail.viewProduct')}
                    </Button>
                  </a>
                )}
                {isOwner && !wish.archived && (
                  <>
                    {wish.fulfilled ? (
                      <Button
                        variant="ghost"
                        className="w-full text-green-700 bg-green-50 hover:bg-green-100 border border-green-200"
                        onClick={handleFulfill}
                      >
                        <RotateCcw className="w-4 h-4" />
                        {t('wish.markUnfulfilled')}
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        className="w-full text-green-700 hover:text-green-800 hover:bg-green-50 border border-green-200"
                        onClick={handleFulfill}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        {t('wish.markFulfilled')}
                      </Button>
                    )}
                    {isOverdue(wish) ? (
                      <Button variant="primary" className="w-full" onClick={handleMarkRelevant}>
                        <TrendingUp className="w-4 h-4" />
                        {t('wishDetail.markRelevant')}
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        className="w-full text-green-700 bg-green-50 border border-green-200 cursor-default"
                        onClick={handleMarkRelevant}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        {t('wishDetail.markedRelevant')}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      className="w-full text-foreground/60 hover:text-foreground hover:bg-gray-100 border border-gray-200"
                      onClick={handleArchive}
                    >
                      <Archive className="w-4 h-4" />
                      {t('wishDetail.markNotAktual')}
                    </Button>
                  </>
                )}
              </div>
            )}

            {/* Archived notice for owner */}
            {isOwner && wish.archived && (
              <div className="w-full py-3 text-center rounded-xl bg-gray-100 text-gray-500 font-medium text-sm flex items-center justify-center gap-2">
                <Archive className="w-4 h-4" />
                {t('wishDetail.archivedNotice')}
              </div>
            )}

            {/* Guest actions */}
            {!isOwner && !wish.archived && canReserve && (
              <Button
                variant="primary"
                className="w-full"
                onClick={handleReserve}
                disabled={actionLoading}
              >
                <Gift className="w-4 h-4" />
                {t('wishDetail.reserveGift')}
              </Button>
            )}
            {!isOwner && reserved && (
              <div className="w-full py-3 text-center rounded-xl bg-success/10 text-success font-medium text-sm">
                {t('wishDetail.reservedNotice')}
              </div>
            )}
            {!isOwner && wish.archived && (
              <div className="w-full py-3 text-center rounded-xl bg-gray-100 text-gray-500 font-medium text-sm flex items-center justify-center gap-2">
                <Archive className="w-4 h-4" />
                {t('wishDetail.archivedNotice')}
              </div>
            )}
          </motion.div>
        </div>

        {/* Notes & Context */}
        {(wish.notes || wish.context) && (
          <div className="grid md:grid-cols-2 gap-6 mt-8">
            {wish.context && (
              <Card>
                <h3 className="font-semibold mb-3">{t('wishDetail.contextSection')}</h3>
                <p className="text-foreground/70 leading-relaxed">{wish.context}</p>
              </Card>
            )}
            {wish.notes && isOwner && (
              <Card>
                <h3 className="font-semibold mb-3">{t('wishDetail.notesSection')}</h3>
                <p className="text-foreground/70 leading-relaxed">{wish.notes}</p>
              </Card>
            )}
          </div>
        )}

        {/* Comments */}
        <div className="mt-8">
          <h3 className="text-xl font-bold mb-4">{t('wishDetail.commentsTitle')} ({comments.length})</h3>
          <Card className="mb-4">
            <div className="flex gap-3">
              <textarea
                className="flex-1 px-3 py-2 rounded-xl bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-ring resize-none text-sm min-h-[72px]"
                placeholder={t('wishDetail.commentPlaceholder')}
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleAddComment();
                }}
              />
              <Button
                variant="primary"
                size="sm"
                className="self-end"
                onClick={handleAddComment}
                disabled={commentLoading || !commentText.trim()}
              >
                {t('wishDetail.send')}
              </Button>
            </div>
          </Card>
          {comments.length > 0 ? (
            <div className="space-y-3">
              {comments.map((c, i) => (
                <Card key={c.id ?? i}>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium mb-1 text-foreground/70">{t('wishDetail.userLabel')}</p>
                      <p className="text-sm">{c.text}</p>
                      {c.createdAt && (
                        <p className="text-xs text-foreground/40 mt-1">{timeAgo(c.createdAt)}</p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-sm text-foreground/50 text-center py-4">{t('wishDetail.noComments')}</p>
          )}
        </div>

        {/* Meta */}
        <div className="mt-6 flex items-center gap-4 text-sm text-foreground/50">
          <span>{t('wishDetail.metaAdded')} {timeAgo(wish.createdAt)}</span>
          {wish.updatedAt !== wish.createdAt && <span>· {t('wishDetail.metaUpdated')} {timeAgo(wish.updatedAt)}</span>}
          {likes.length > 0 && <span>· {likes.length} {t('wishDetail.likes')}</span>}
        </div>
      </div>
    </div>
  );
}
