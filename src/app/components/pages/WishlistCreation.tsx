import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { useNavigate, useParams } from 'react-router';
import { Card } from '../Card';
import { Button } from '../Button';
import { Input } from '../Input';
import { Badge } from '../Badge';
import { useApp } from '../../store/AppStore';
import { useLanguage } from '../../i18n/LanguageContext';
import { uploadImage, api } from '../../../api/client';
import {
  Star,
  TrendingUp,
  Calendar,
  Globe,
  Users,
  Lock,
  Upload,
  X,
  Save,
  ArrowLeft,
  Plus,
  Link as LinkIcon,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import * as Slider from '@radix-ui/react-slider';

export function WishlistCreation() {
  const { addWish, updateWish, wishes } = useApp();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const existingWish = id ? wishes.find(w => w.id === id) : undefined;

  const [priority, setPriority] = useState(() => existingWish?.priority ?? 3);
  const [confidence, setConfidence] = useState(() => existingWish?.confidence ?? 80);
  const [visibility, setVisibility] = useState<'public' | 'friends' | 'private'>(
    () => (existingWish?.visibility as 'public' | 'friends' | 'private') ?? 'public'
  );
  const [tags, setTags] = useState<string[]>(() => existingWish?.tags ?? []);
  const [newTag, setNewTag] = useState('');
  const [aktualnostDuration, setAktualnostDuration] = useState(() => existingWish?.aktualnostDuration ?? 1);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [imageUploading, setImageUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const fetchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastFetchedUrlRef = useRef<string | null>(existingWish?.link ?? null);

  useEffect(() => () => { if (fetchDebounceRef.current) clearTimeout(fetchDebounceRef.current); }, []);
  const [fetchState, setFetchState] = useState<'idle' | 'loading' | 'success' | 'partial' | 'error'>('idle');
  const [fetchStatus, setFetchStatus] = useState<'manual' | 'auto' | 'failed'>(
    existingWish?.fetchStatus ?? 'manual'
  );
  const [fetchMeta, setFetchMeta] = useState<{ sourceHost?: string; currency?: string }>({});
  const [formData, setFormData] = useState(() => ({
    title: existingWish?.title ?? '',
    image: existingWish?.image ?? '',
    link: existingWish?.link ?? '',
    price: existingWish?.price ?? 0,
    currency: existingWish?.currency ?? 'USD',
    context: existingWish?.context ?? '',
    notes: existingWish?.notes ?? '',
  }));

  const priorityLabel = (p: number) =>
    p <= 2 ? t('priority.low') : p >= 4 ? t('priority.high') : t('priority.medium');

  const handleFetchProductInfo = async (overrideUrl?: string) => {
    const url = (overrideUrl ?? formData.link).trim();
    if (!url) return;
    setFetchState('loading');
    setFetchMeta({});
    try {
      const result = await api.post<{
        success: boolean;
        data?: {
          title?: string | null;
          price?: string | null;
          currency?: string | null;
          imageUrl?: string | null;
          sourceHost?: string | null;
        };
        message?: string;
      }>('/wishes/fetch-product-info', { url });

      if (!result.success || !result.data) {
        setFetchState('error');
        setFetchStatus('failed');
        return;
      }

      const { title, price, currency, imageUrl, sourceHost } = result.data;

      // If the URL changed since the last fetch, replace all auto-filled fields.
      // If it's the same URL (re-fetch), only fill fields that are currently empty.
      const isNewUrl = lastFetchedUrlRef.current !== url;
      lastFetchedUrlRef.current = url;

      const KNOWN_CURRENCIES = ['UAH', 'USD', 'EUR', 'GBP', 'PLN'];
      const resolvedCurrency = currency && KNOWN_CURRENCIES.includes(currency)
        ? currency
        : formData.currency;

      // Proxy external image to local server to avoid CORS / hotlink blocks
      let resolvedImageUrl = imageUrl || null;
      if (imageUrl) {
        try {
          console.log('[fetch] Proxying image:', imageUrl);
          const proxyResult = await api.post<{ success: boolean; imageUrl?: string }>(
            '/wishes/proxy-image', { url: imageUrl, referer: url }
          );
          if (proxyResult.success && proxyResult.imageUrl) {
            resolvedImageUrl = proxyResult.imageUrl;
            console.log('[fetch] Image proxied to:', resolvedImageUrl);
          } else {
            console.warn('[fetch] Proxy returned no URL, using original');
          }
        } catch {
          console.warn('[fetch] Image proxy failed, using original URL');
        }
      }

      setFormData(prev => ({
        ...prev,
        // New URL → replace previously auto-filled values with the new product's data.
        // Same URL re-fetch → only fill fields the user left empty.
        title:    isNewUrl ? (title || prev.title)                              : (!prev.title ? (title || '') : prev.title),
        price:    isNewUrl ? (price ? parseFloat(price) || prev.price : prev.price) : (prev.price === 0 ? (price ? parseFloat(price) || 0 : 0) : prev.price),
        image:    isNewUrl ? (resolvedImageUrl || '')                           : (!prev.image ? (resolvedImageUrl || '') : prev.image),
        currency: resolvedCurrency,
      }));

      setFetchMeta({
        sourceHost: sourceHost ?? undefined,
        currency:   currency   ?? undefined,
      });
      setFetchStatus('auto');

      const hasTitle = !!title;
      const hasPrice = !!price;
      const hasImage = !!resolvedImageUrl;

      if (!hasTitle && !hasPrice && !hasImage) {
        setFetchState('error');
        setFetchStatus('failed');
      } else if (hasTitle && hasPrice) {
        setFetchState('success');
      } else {
        setFetchState('partial');
      }

    } catch (err) {
      console.error('[fetch] Error:', err);
      setFetchState('error');
      setFetchStatus('failed');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUploading(true);
    try {
      const url = await uploadImage(file);
      setFormData(prev => ({ ...prev, image: `http://localhost:5000${url}` }));
    } catch {
      alert(t('wishCreation.alertRequired'));
    } finally {
      setImageUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSave = async () => {
    if (!formData.title || formData.price === 0) {
      setSaveError(t('wishCreation.alertRequired'));
      return;
    }
    setSaveError('');
    setIsSaving(true);
    try {
      const payload = {
        title: formData.title,
        image: formData.image,
        price: formData.price,
        currency: formData.currency,
        link: formData.link,
        priority,
        confidence,
        aktualnostDuration,
        context: formData.context,
        notes: formData.notes,
        tags: tags.length > 0 ? tags : [],
        visibility,
        fetchStatus,
        sourceUrl: formData.link || undefined,
      };
      if (isEditing && id) {
        const now = new Date();
        await updateWish(id, {
          ...payload,
          lastConfirmedAt: now,
          nextCheckAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        });
      } else {
        const now = new Date();
        await addWish({
          ...payload,
          lastConfirmedAt: now,
          nextCheckAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        });
      }
      navigate('/wishlists');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-sidebar border-b border-sidebar-border sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-5 h-5" />
              {t('wishCreation.breadcrumb')}
            </Button>
            <h1 className="text-xl font-bold">
              {isEditing ? t('wishCreation.editTitle') : t('wishCreation.newTitle')}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => navigate('/wishlists')}>
              {t('wishCreation.cancel')}
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                    <Star className="w-4 h-4" />
                  </motion.div>
                  {t('wishCreation.saving')}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {isEditing ? t('wishCreation.saveChanges') : t('wishCreation.saveWish')}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <h2 className="text-xl font-semibold mb-6">{t('wishCreation.sectionBasic')}</h2>
            <div className="space-y-4">
              <Input
                label={t('wishCreation.fieldTitle')}
                placeholder={t('wishCreation.fieldTitlePlaceholder')}
                className="text-lg"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                required
              />

              <div>
                <label className="block text-sm font-medium mb-2">{t('wishCreation.fieldImage')}</label>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                {formData.image ? (
                  <div className="relative rounded-xl overflow-hidden border border-border">
                    <img
                      src={formData.image}
                      alt="preview"
                      className="w-full h-48 object-cover"
                      onError={() => setFormData(prev => ({ ...prev, image: '' }))}
                    />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {imageUploading ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                        <p className="text-sm text-foreground/60">{t('wishCreation.imageUploading')}</p>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-primary/60 mx-auto mb-2" />
                        <p className="text-sm font-medium mb-1">{t('wishCreation.imageClick')}</p>
                        <p className="text-xs text-foreground/50">{t('wishCreation.imageFormats')}</p>
                      </>
                    )}
                  </div>
                )}
                <div className="mt-2 flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-foreground/40 shrink-0" />
                  <input
                    type="url"
                    placeholder={t('wishCreation.imageUrlPlaceholder')}
                    className="flex-1 px-3 py-2 text-sm rounded-lg bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-ring"
                    value={formData.image}
                    onChange={e => setFormData(prev => ({ ...prev, image: e.target.value }))}
                  />
                </div>
              </div>

              {/* Product link + auto-fetch */}
              <div>
                <label className="block text-sm font-medium mb-2">{t('wishCreation.fieldLink')}</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://..."
                    className="flex-1 px-4 py-3 rounded-xl bg-input-background border border-border focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                    value={formData.link}
                    onChange={e => {
                      const newLink = e.target.value;
                      setFormData(prev => ({ ...prev, link: newLink }));
                      if (fetchState !== 'idle') setFetchState('idle');

                      if (fetchDebounceRef.current) clearTimeout(fetchDebounceRef.current);
                      const trimmed = newLink.trim();
                      if (/^https?:\/\/.{4,}/.test(trimmed)) {
                        fetchDebounceRef.current = setTimeout(() => handleFetchProductInfo(trimmed), 900);
                      }
                    }}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleFetchProductInfo(); } }}
                  />
                  <button
                    type="button"
                    onClick={() => handleFetchProductInfo()}
                    disabled={!formData.link.trim() || fetchState === 'loading'}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary/10 text-primary border border-primary/30 text-sm font-medium hover:bg-primary/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {fetchState === 'loading'
                      ? <><Loader2 className="w-4 h-4 animate-spin" />{t('wishCreation.fetchLoading')}</>
                      : <><Sparkles className="w-4 h-4" />{t('wishCreation.fetchButton')}</>}
                  </button>
                </div>

                {/* Fetch status banners */}
                {(fetchState === 'success' || fetchState === 'partial') && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mt-2 rounded-xl border text-sm overflow-hidden ${
                      fetchState === 'success'
                        ? 'bg-green-50 border-green-200 text-green-700'
                        : 'bg-yellow-50 border-yellow-200 text-yellow-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 px-3 py-2">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                      <span>
                        {fetchState === 'success'
                          ? t('wishCreation.fetchSuccess')
                          : t('wishCreation.fetchPartial')}
                      </span>
                    </div>
                    {(fetchMeta.sourceHost || fetchMeta.currency) && (
                      <div className="px-3 pb-2 flex items-center gap-3 text-xs opacity-75">
                        {fetchMeta.sourceHost && (
                          <span>📦 {fetchMeta.sourceHost}</span>
                        )}
                        {fetchMeta.currency && (
                          <span>{t('wishCreation.fetchCurrencyLabel')}: <strong>{fetchMeta.currency}</strong></span>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
                {fetchState === 'error' && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 flex items-center gap-2 px-3 py-2 rounded-xl bg-orange-50 border border-orange-200 text-orange-700 text-sm"
                  >
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {t('wishCreation.fetchError')}
                  </motion.div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label={t('wishCreation.fieldPrice')}
                  placeholder="0.00"
                  type="number"
                  value={formData.price || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  required
                />
                <div>
                  <label className="block text-sm font-medium mb-2">{t('wishCreation.fieldCurrency')}</label>
                  <select
                    className="w-full px-4 py-3 rounded-xl bg-input-background border border-border focus:outline-none focus:ring-2 focus:ring-ring"
                    value={formData.currency}
                    onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="UAH">UAH (₴)</option>
                  </select>
                </div>
              </div>
            </div>
          </Card>

          {/* Priority & Confidence */}
          <Card>
            <h2 className="text-xl font-semibold mb-6">{t('wishCreation.sectionPriority')}</h2>
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium block mb-3">{t('wishCreation.fieldPriority')}</label>
                <div className="grid grid-cols-3 gap-3">
                  {([
                    { value: 1, label: t('priority.low'),    activeClass: 'border-blue-300 bg-blue-50 text-blue-700',   inactiveClass: 'border-border text-foreground/60' },
                    { value: 3, label: t('priority.medium'), activeClass: 'border-primary bg-primary/10 text-primary',   inactiveClass: 'border-border text-foreground/60' },
                    { value: 5, label: t('priority.high'),   activeClass: 'border-accent bg-accent/10 text-accent-foreground', inactiveClass: 'border-border text-foreground/60' },
                  ] as const).map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setPriority(opt.value)}
                      className={`py-3 px-4 rounded-xl border-2 font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                        priority === opt.value ? opt.activeClass + ' shadow-sm' : opt.inactiveClass + ' bg-card hover:bg-muted/50'
                      }`}
                    >
                      <Star className={`w-4 h-4 ${priority === opt.value ? 'fill-current' : ''}`} />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="text-sm font-medium">
                    {t('wishCreation.fieldConfidence')}
                    <span className="text-xs text-foreground/60 ml-2">({t('wishCreation.confidenceHint')})</span>
                  </label>
                  <Badge variant="secondary">
                    <TrendingUp className="w-3 h-3" />
                    {confidence}%
                  </Badge>
                </div>
                <Slider.Root
                  className="relative flex items-center select-none w-full h-5"
                  value={[confidence]}
                  onValueChange={(value) => setConfidence(value[0])}
                  max={100} min={0} step={5}
                >
                  <Slider.Track className="bg-muted relative grow rounded-full h-2">
                    <Slider.Range className="absolute bg-gradient-to-r from-secondary to-primary h-full rounded-full" />
                  </Slider.Track>
                  <Slider.Thumb
                    className="block w-5 h-5 bg-white shadow-lg border-2 border-secondary rounded-full hover:scale-110 focus:outline-none focus:ring-2 focus:ring-secondary transition-transform"
                    aria-label="Confidence"
                  />
                </Slider.Root>
                <div className="flex justify-between text-xs text-foreground/50 mt-2">
                  <span>{t('wishCreation.confidenceLow')}</span>
                  <span>{t('wishCreation.confidenceHigh')}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Aktualnost Settings */}
          <Card className="bg-gradient-to-br from-accent/5 to-primary/5">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-1">{t('wishCreation.sectionAktualnost')}</h2>
                <p className="text-sm text-foreground/70">{t('wishCreation.aktualnostHint')}</p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-medium">{t('wishCreation.aktualnostReminder')}</label>
                <Badge variant="accent">
                  {t('wishCreation.aktualnostEvery')} {aktualnostDuration} {t('wishCreation.aktualnostMonths')}
                </Badge>
              </div>
              <Slider.Root
                className="relative flex items-center select-none w-full h-5"
                value={[aktualnostDuration]}
                onValueChange={(value) => setAktualnostDuration(value[0])}
                max={12} min={1} step={1}
              >
                <Slider.Track className="bg-muted relative grow rounded-full h-2">
                  <Slider.Range className="absolute bg-gradient-to-r from-accent to-secondary h-full rounded-full" />
                </Slider.Track>
                <Slider.Thumb
                  className="block w-5 h-5 bg-white shadow-lg border-2 border-accent rounded-full hover:scale-110 focus:outline-none focus:ring-2 focus:ring-accent transition-transform"
                  aria-label="Aktualnost Duration"
                />
              </Slider.Root>
              <div className="flex justify-between text-xs text-foreground/50 mt-2">
                <span>1 {t('wishCreation.aktualnostMonth')}</span>
                <span>12 {t('wishCreation.aktualnostMonths')}</span>
              </div>
            </div>
          </Card>

          {/* Context & Details */}
          <Card>
            <h2 className="text-xl font-semibold mb-6">{t('wishCreation.sectionContext')}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('wishCreation.fieldContext')}
                </label>
                <textarea
                  className="w-full px-4 py-3 rounded-xl bg-input-background border border-border focus:outline-none focus:ring-2 focus:ring-ring min-h-24 resize-none"
                  placeholder={t('wishCreation.contextPlaceholder')}
                  value={formData.context}
                  onChange={(e) => setFormData(prev => ({ ...prev, context: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('wishCreation.fieldNotes')}
                  <span className="text-xs text-foreground/60 ml-2">({t('wishCreation.notesPlaceholder')})</span>
                </label>
                <textarea
                  className="w-full px-4 py-3 rounded-xl bg-input-background border border-border focus:outline-none focus:ring-2 focus:ring-ring min-h-24 resize-none"
                  placeholder={t('wishCreation.notesPlaceholder')}
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
            </div>
          </Card>

          {/* Tags */}
          <Card>
            <h2 className="text-xl font-semibold mb-6">{t('wishCreation.sectionTags')}</h2>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <Badge key={index} variant="primary" className="pl-3 pr-2 py-2">
                    {tag}
                    <button onClick={() => handleRemoveTag(tag)} className="ml-2 hover:text-destructive">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder={t('wishCreation.tagPlaceholder')}
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); }
                  }}
                  className="flex-1"
                />
                <Button variant="outline" onClick={handleAddTag}>
                  <Plus className="w-4 h-4" />
                  {t('wishCreation.tagButton')}
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {t('wishCreation.suggestedTags').split(',').map((tag, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => { if (!tags.includes(tag)) setTags(prev => [...prev, tag]); }}
                    className="text-xs px-2 py-1 rounded-full bg-muted text-foreground/60 hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Visibility Settings */}
          <Card>
            <h2 className="text-xl font-semibold mb-2">{t('wishCreation.sectionVisibility')}</h2>
            <p className="text-sm text-foreground/60 mb-6">{t('wishCreation.visibilitySubtitle')}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {([
                {
                  value: 'public' as const,
                  Icon: Globe,
                  label: t('wishCreation.visPublic'),
                  desc: t('wishCreation.visPublicDesc'),
                  activeClasses: 'border-primary bg-primary/5',
                  iconActive: 'bg-primary/10 text-primary',
                  dot: 'bg-primary',
                },
                {
                  value: 'friends' as const,
                  Icon: Users,
                  label: t('wishCreation.visFriends'),
                  desc: t('wishCreation.visFriendsDesc'),
                  activeClasses: 'border-secondary bg-secondary/5',
                  iconActive: 'bg-secondary/10 text-secondary-foreground',
                  dot: 'bg-secondary',
                },
                {
                  value: 'private' as const,
                  Icon: Lock,
                  label: t('wishCreation.visPrivate'),
                  desc: t('wishCreation.visPrivateDesc'),
                  activeClasses: 'border-foreground/30 bg-foreground/5',
                  iconActive: 'bg-foreground/10 text-foreground/70',
                  dot: 'bg-foreground/50',
                },
              ] as const).map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setVisibility(option.value)}
                  className={`relative p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
                    visibility === option.value
                      ? option.activeClasses + ' shadow-sm'
                      : 'border-border bg-card hover:border-primary/30 hover:bg-muted/30'
                  }`}
                >
                  {visibility === option.value && (
                    <motion.span
                      layoutId="vis-dot"
                      className={`absolute top-3 right-3 w-2.5 h-2.5 rounded-full ${option.dot}`}
                    />
                  )}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors ${
                    visibility === option.value ? option.iconActive : 'bg-muted text-foreground/40'
                  }`}>
                    <option.Icon className="w-5 h-5" />
                  </div>
                  <p className={`font-semibold text-sm mb-1 ${
                    visibility === option.value ? 'text-foreground' : 'text-foreground/70'
                  }`}>
                    {option.label}
                  </p>
                  <p className="text-xs text-foreground/50 leading-relaxed">{option.desc}</p>
                </button>
              ))}
            </div>
          </Card>

          {/* Save validation error */}
          {saveError && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {saveError}
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => navigate('/wishlists')}>
              {t('wishCreation.cancel')}
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleSave}
              disabled={isSaving || !formData.title || formData.price === 0}
            >
              {isSaving ? (
                <>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                    <Star className="w-5 h-5" />
                  </motion.div>
                  {t('wishCreation.saving')}
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {isEditing ? t('wishCreation.saveChanges') : t('wishCreation.saveWish')}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
