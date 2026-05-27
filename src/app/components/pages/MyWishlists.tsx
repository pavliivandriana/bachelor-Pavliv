import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router';
import { Card } from '../Card';
import { Button } from '../Button';
import { WishCard } from '../WishCard';
import { useApp } from '../../store/AppStore';
import { useLanguage } from '../../i18n/LanguageContext';
import { isOverdue } from '../AktualnostReminder';
import {
  Plus, Grid, List, Filter, Search, TrendingUp, Gift, Heart, X, Check, CheckCircle2,
} from 'lucide-react';

type StatusFilter = 'all' | 'active' | 'reserved' | 'fulfilled' | 'archived';
type PriorityLevel = 'low' | 'medium' | 'high';
type VisibilityLevel = 'public' | 'friends' | 'private';
type RelevanceLevel = 'needsCheck' | 'confirmed' | 'irrelevant';
type PriceSortDir = 'cheap' | 'expensive';
type DateSortDir = 'newest' | 'oldest';

interface AdvancedFilters {
  status: StatusFilter;
  priorities: PriorityLevel[];
  visibilities: VisibilityLevel[];
  tags: string[];
  relevance: RelevanceLevel[];
  priceSort: PriceSortDir | null;
  dateSort: DateSortDir | null;
}

const DEFAULT_FILTERS: AdvancedFilters = {
  status: 'all',
  priorities: [],
  visibilities: [],
  tags: [],
  relevance: [],
  priceSort: null,
  dateSort: null,
};

const KNOWN_TAGS = ['Електроніка', 'Лайфстайл', 'Мрія', 'Подарунок', 'Догляд за собою', 'Навчання'];

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-foreground/40 mb-2">{title}</p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function CheckItem({
  label, checked, onToggle,
}: { label: string; checked: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-lg hover:bg-muted transition-colors text-sm"
    >
      <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
        checked ? 'bg-primary border-primary' : 'border-border bg-card'
      }`}>
        {checked && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
      </div>
      <span className={checked ? 'text-foreground' : 'text-foreground/70'}>{label}</span>
    </button>
  );
}

function RadioItem({
  label, selected, onSelect,
}: { label: string; selected: boolean; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className="flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-lg hover:bg-muted transition-colors text-sm"
    >
      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
        selected ? 'border-primary' : 'border-border'
      }`}>
        {selected && <div className="w-2 h-2 rounded-full bg-primary" />}
      </div>
      <span className={selected ? 'text-foreground' : 'text-foreground/70'}>{label}</span>
    </button>
  );
}

export function MyWishlists() {
  const { wishes, refreshWishes } = useApp();
  const { t, timeAgo } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => { refreshWishes(); }, []);

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [pending, setPending] = useState<AdvancedFilters>(DEFAULT_FILTERS);
  const [applied, setApplied] = useState<AdvancedFilters>(DEFAULT_FILTERS);

  const openFilter = useCallback(() => {
    setPending(applied);
    setFilterOpen(true);
  }, [applied]);

  const applyFilters = useCallback(() => {
    setApplied(pending);
    setFilterOpen(false);
  }, [pending]);

  const resetFilters = useCallback(() => {
    setPending(DEFAULT_FILTERS);
    setApplied(DEFAULT_FILTERS);
    setFilterOpen(false);
  }, []);

  useEffect(() => {
    if (!filterOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setFilterOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [filterOpen]);

  function toggleArr<T>(arr: T[], val: T): T[] {
    return arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];
  }

  const activeWishes = wishes.filter(w => !w.archived);

  let filteredWishes = wishes.filter(wish => {
    if (applied.status === 'active')    return !wish.archived && !wish.fulfilled;
    if (applied.status === 'reserved')  return !wish.archived && wish.reserved;
    if (applied.status === 'fulfilled') return !!wish.fulfilled;
    if (applied.status === 'archived')  return !!wish.archived;
    return !wish.archived;
  });

  filteredWishes = filteredWishes.filter(wish => {
    const matchesSearch =
      wish.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wish.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesPriorityPill =
      priorityFilter === 'all' ||
      (priorityFilter === 'low'    && wish.priority <= 2) ||
      (priorityFilter === 'medium' && wish.priority === 3) ||
      (priorityFilter === 'high'   && wish.priority >= 4);

    const matchesPriorityPanel =
      applied.priorities.length === 0 ||
      (applied.priorities.includes('low')    && wish.priority <= 2) ||
      (applied.priorities.includes('medium') && wish.priority === 3) ||
      (applied.priorities.includes('high')   && wish.priority >= 4);

    const matchesVisibility =
      applied.visibilities.length === 0 ||
      applied.visibilities.includes(wish.visibility as VisibilityLevel);

    const matchesTags =
      applied.tags.length === 0 ||
      applied.tags.some(tag => wish.tags.includes(tag));

    const matchesRelevance = (() => {
      if (applied.relevance.length === 0) return true;
      const overdue = isOverdue(wish);
      const confirmed = !!wish.nextCheckAt && !overdue;
      if (applied.relevance.includes('needsCheck') && overdue) return true;
      if (applied.relevance.includes('confirmed') && confirmed) return true;
      if (applied.relevance.includes('irrelevant') && !wish.nextCheckAt) return true;
      return false;
    })();

    return matchesSearch && matchesPriorityPill && matchesPriorityPanel && matchesVisibility && matchesTags && matchesRelevance;
  });

  if (applied.priceSort === 'cheap') {
    filteredWishes = [...filteredWishes].sort((a, b) => a.price - b.price);
  } else if (applied.priceSort === 'expensive') {
    filteredWishes = [...filteredWishes].sort((a, b) => b.price - a.price);
  }

  if (applied.dateSort === 'newest') {
    filteredWishes = [...filteredWishes].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } else if (applied.dateSort === 'oldest') {
    filteredWishes = [...filteredWishes].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }

  const activeFilterCount =
    (applied.status !== 'all' ? 1 : 0) +
    applied.priorities.length +
    applied.visibilities.length +
    applied.tags.length +
    applied.relevance.length +
    (applied.priceSort ? 1 : 0) +
    (applied.dateSort ? 1 : 0);

  const activeChips: { label: string; clear: () => void }[] = [];
  if (applied.status !== 'all') {
    const statusLabels: Record<StatusFilter, string> = {
      all:       '',
      active:    t('myWishlists.filterStatusActive'),
      reserved:  t('myWishlists.filterStatusReserved'),
      fulfilled: t('myWishlists.filterStatusFulfilled'),
      archived:  t('myWishlists.filterStatusArchived'),
    };
    activeChips.push({ label: statusLabels[applied.status], clear: () => setApplied(a => ({ ...a, status: 'all' })) });
  }
  applied.priorities.forEach(p => {
    const lbl = p === 'low' ? t('myWishlists.filterLow') : p === 'medium' ? t('myWishlists.filterMedium') : t('myWishlists.filterHigh');
    activeChips.push({ label: lbl, clear: () => setApplied(a => ({ ...a, priorities: a.priorities.filter(x => x !== p) })) });
  });
  applied.visibilities.forEach(v => {
    const lbl = v === 'public' ? t('myWishlists.filterVisPublic') : v === 'friends' ? t('myWishlists.filterVisFriends') : t('myWishlists.filterVisPrivate');
    activeChips.push({ label: lbl, clear: () => setApplied(a => ({ ...a, visibilities: a.visibilities.filter(x => x !== v) })) });
  });
  applied.tags.forEach(tag => {
    activeChips.push({ label: tag, clear: () => setApplied(a => ({ ...a, tags: a.tags.filter(x => x !== tag) })) });
  });
  applied.relevance.forEach(r => {
    const lbl = r === 'needsCheck' ? t('myWishlists.filterRelevanceNeedsCheck') : r === 'confirmed' ? t('myWishlists.filterRelevanceConfirmed') : t('myWishlists.filterRelevanceIrrelevant');
    activeChips.push({ label: lbl, clear: () => setApplied(a => ({ ...a, relevance: a.relevance.filter(x => x !== r) })) });
  });
  if (applied.priceSort) {
    const lbl = applied.priceSort === 'cheap' ? t('myWishlists.filterPriceCheap') : t('myWishlists.filterPriceExpensive');
    activeChips.push({ label: lbl, clear: () => setApplied(a => ({ ...a, priceSort: null })) });
  }
  if (applied.dateSort) {
    const lbl = applied.dateSort === 'newest' ? t('myWishlists.filterDateNewest') : t('myWishlists.filterDateOldest');
    activeChips.push({ label: lbl, clear: () => setApplied(a => ({ ...a, dateSort: null })) });
  }

  const totalWishes = activeWishes.length;
  const reservedCount = activeWishes.filter(w => w.reserved).length;
  const fulfilledCount = wishes.filter(w => w.fulfilled).length;
  const highPriorityCount = activeWishes.filter(w => w.priority >= 4).length;

  const priorityLabel = (p: number): string =>
    p <= 2 ? t('priority.low') : p >= 4 ? t('priority.high') : t('priority.medium');

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">{t('myWishlists.title')}</h1>
            <p className="text-foreground/60">{t('myWishlists.subtitle')}</p>
          </div>
          <Button variant="primary" onClick={() => navigate('/wishlist/new')} className="mt-4 md:mt-0">
            <Plus className="w-5 h-5" />
            {t('myWishlists.addWish')}
          </Button>
        </div>

        {/* Search + Filter + View */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
              <input
                type="text"
                placeholder={t('myWishlists.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-input-background border border-border focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
              />
            </div>
          </div>

          <Button variant="outline" onClick={openFilter} className="relative">
            <Filter className="w-5 h-5" />
            {t('common.filter')}
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </Button>

          <div className="flex gap-2 bg-card rounded-xl p-1 border border-border">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-primary text-white' : 'text-foreground/60 hover:bg-muted'
              }`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-primary text-white' : 'text-foreground/60 hover:bg-muted'
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Priority pills */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {([
            { key: 'all'    as const, label: t('myWishlists.filterAll'),    style: 'bg-foreground text-background border-foreground' },
            { key: 'low'    as const, label: t('myWishlists.filterLow'),    style: 'bg-blue-100 text-blue-700 border-blue-300' },
            { key: 'medium' as const, label: t('myWishlists.filterMedium'), style: 'bg-primary/10 text-primary border-primary/30' },
            { key: 'high'   as const, label: t('myWishlists.filterHigh'),   style: 'bg-accent/15 text-accent-foreground border-accent/30' },
          ]).map(f => (
            <button
              key={f.key}
              onClick={() => setPriorityFilter(f.key)}
              className={`px-4 py-1.5 rounded-full border text-sm font-medium transition-all ${
                priorityFilter === f.key ? f.style + ' shadow-sm' : 'border-border bg-card text-foreground/60 hover:bg-muted'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Active filter chips */}
        {activeChips.length > 0 && (
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {activeChips.map((chip, i) => (
              <button
                key={i}
                onClick={chip.clear}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/30 text-xs font-medium hover:bg-primary/20 transition-colors"
              >
                {chip.label}
                <X className="w-3 h-3" />
              </button>
            ))}
            <button
              onClick={resetFilters}
              className="text-xs text-foreground/50 hover:text-foreground underline transition-colors"
            >
              {t('myWishlists.filterReset')}
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="text-center">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-2">
                <Gift className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-bold mb-1">{totalWishes}</p>
              <p className="text-xs text-foreground/60">{t('myWishlists.statTotal')}</p>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="text-center">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary to-primary flex items-center justify-center mx-auto mb-2">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-bold mb-1">{reservedCount}</p>
              <p className="text-xs text-foreground/60">{t('myWishlists.statReserved')}</p>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="text-center">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-secondary flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-bold mb-1">{highPriorityCount}</p>
              <p className="text-xs text-foreground/60">{t('myWishlists.statHighPriority')}</p>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <button
              className="w-full"
              onClick={() => setApplied(a => ({ ...a, status: applied.status === 'fulfilled' ? 'all' : 'fulfilled' }))}
            >
              <Card className="text-center hover:ring-1 hover:ring-green-300 transition-all">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-teal-500 flex items-center justify-center mx-auto mb-2">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl font-bold mb-1 text-green-600">{fulfilledCount}</p>
                <p className="text-xs text-foreground/60">{t('myWishlists.statFulfilled')}</p>
              </Card>
            </button>
          </motion.div>
        </div>

        {/* Wishes Grid */}
        <AnimatePresence mode="popLayout">
          <div className={viewMode === 'grid' ? 'grid md:grid-cols-3 lg:grid-cols-4 gap-6' : 'space-y-4'}>
            {filteredWishes.map((wish) => (
              <motion.div
                key={wish.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <WishCard
                  wish={{
                    ...wish,
                    priority: priorityLabel(wish.priority),
                    priorityNum: wish.priority,
                    added: timeAgo(wish.createdAt),
                    visibility: wish.visibility as 'public' | 'friends' | 'private',
                    fulfilled: wish.fulfilled,
                    pendingConfirmation: !!(wish.lastReminderSentAt && (!wish.lastConfirmedAt || new Date(wish.lastConfirmedAt) < new Date(wish.lastReminderSentAt))),
                  }}
                  compact={viewMode === 'list'}
                  onClick={() => navigate(`/wishes/${wish.id}`)}
                />
              </motion.div>
            ))}
          </div>
        </AnimatePresence>

        {/* Empty State */}
        {filteredWishes.length === 0 && activeWishes.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-6">
              <Plus className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">{t('myWishlists.emptyTitle')}</h3>
            <p className="text-foreground/60 mb-6">{t('myWishlists.emptyDesc')}</p>
            <Button variant="primary" onClick={() => navigate('/wishlist/new')}>
              <Plus className="w-5 h-5" />
              {t('myWishlists.addFirst')}
            </Button>
          </motion.div>
        )}

        {/* No Results State */}
        {filteredWishes.length === 0 && activeWishes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <Search className="w-16 h-16 text-foreground/20 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">{t('myWishlists.noResultsTitle')}</h3>
            <p className="text-foreground/60 mb-6">{t('myWishlists.noResultsDesc')}</p>
            <Button variant="outline" onClick={() => { setSearchQuery(''); resetFilters(); }}>
              {t('myWishlists.clearSearch')}
            </Button>
          </motion.div>
        )}
      </div>

      {/* Filter drawer overlay */}
      <AnimatePresence>
        {filterOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-[60]"
              onClick={() => setFilterOpen(false)}
            />
            <motion.div
              key="drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed top-0 right-0 h-full w-80 max-w-full bg-card border-l border-border shadow-2xl z-[61] flex flex-col"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <h2 className="text-base font-semibold">{t('myWishlists.filterPanelTitle')}</h2>
                <button
                  onClick={() => setFilterOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center text-foreground/50 hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer body */}
              <div className="flex-1 overflow-y-auto px-5 py-4">
                {/* Status */}
                <FilterSection title={t('myWishlists.filterStatus')}>
                  {([
                    ['all',      t('myWishlists.filterStatusAll')],
                    ['active',   t('myWishlists.filterStatusActive')],
                    ['reserved', t('myWishlists.filterStatusReserved')],
                    ['fulfilled', t('myWishlists.filterStatusFulfilled')],
                    ['archived',  t('myWishlists.filterStatusArchived')],
                  ] as [StatusFilter, string][]).map(([val, lbl]) => (
                    <RadioItem
                      key={val}
                      label={lbl}
                      selected={pending.status === val}
                      onSelect={() => setPending(p => ({ ...p, status: val }))}
                    />
                  ))}
                </FilterSection>

                {/* Priority */}
                <FilterSection title={t('myWishlists.filterPrioritySection')}>
                  {([
                    ['low',    t('myWishlists.filterLow')],
                    ['medium', t('myWishlists.filterMedium')],
                    ['high',   t('myWishlists.filterHigh')],
                  ] as [PriorityLevel, string][]).map(([val, lbl]) => (
                    <CheckItem
                      key={val}
                      label={lbl}
                      checked={pending.priorities.includes(val)}
                      onToggle={() => setPending(p => ({ ...p, priorities: toggleArr(p.priorities, val) }))}
                    />
                  ))}
                </FilterSection>

                {/* Visibility */}
                <FilterSection title={t('myWishlists.filterVisibilitySection')}>
                  {([
                    ['public',  t('myWishlists.filterVisPublic')],
                    ['friends', t('myWishlists.filterVisFriends')],
                    ['private', t('myWishlists.filterVisPrivate')],
                  ] as [VisibilityLevel, string][]).map(([val, lbl]) => (
                    <CheckItem
                      key={val}
                      label={lbl}
                      checked={pending.visibilities.includes(val)}
                      onToggle={() => setPending(p => ({ ...p, visibilities: toggleArr(p.visibilities, val) }))}
                    />
                  ))}
                </FilterSection>

                {/* Tags */}
                <FilterSection title={t('myWishlists.filterTagsSection')}>
                  {KNOWN_TAGS.map(tag => (
                    <CheckItem
                      key={tag}
                      label={tag}
                      checked={pending.tags.includes(tag)}
                      onToggle={() => setPending(p => ({ ...p, tags: toggleArr(p.tags, tag) }))}
                    />
                  ))}
                </FilterSection>

                {/* Relevance */}
                <FilterSection title={t('myWishlists.filterRelevanceSection')}>
                  {([
                    ['needsCheck',  t('myWishlists.filterRelevanceNeedsCheck')],
                    ['confirmed',   t('myWishlists.filterRelevanceConfirmed')],
                    ['irrelevant',  t('myWishlists.filterRelevanceIrrelevant')],
                  ] as [RelevanceLevel, string][]).map(([val, lbl]) => (
                    <CheckItem
                      key={val}
                      label={lbl}
                      checked={pending.relevance.includes(val)}
                      onToggle={() => setPending(p => ({ ...p, relevance: toggleArr(p.relevance, val) }))}
                    />
                  ))}
                </FilterSection>

                {/* Price sort */}
                <FilterSection title={t('myWishlists.filterPriceSection')}>
                  {([
                    ['cheap',     t('myWishlists.filterPriceCheap')],
                    ['expensive', t('myWishlists.filterPriceExpensive')],
                  ] as [PriceSortDir, string][]).map(([val, lbl]) => (
                    <RadioItem
                      key={val}
                      label={lbl}
                      selected={pending.priceSort === val}
                      onSelect={() => setPending(p => ({ ...p, priceSort: p.priceSort === val ? null : val }))}
                    />
                  ))}
                </FilterSection>

                {/* Date sort */}
                <FilterSection title={t('myWishlists.filterDateSection')}>
                  {([
                    ['newest', t('myWishlists.filterDateNewest')],
                    ['oldest', t('myWishlists.filterDateOldest')],
                  ] as [DateSortDir, string][]).map(([val, lbl]) => (
                    <RadioItem
                      key={val}
                      label={lbl}
                      selected={pending.dateSort === val}
                      onSelect={() => setPending(p => ({ ...p, dateSort: p.dateSort === val ? null : val }))}
                    />
                  ))}
                </FilterSection>
              </div>

              {/* Drawer footer */}
              <div className="flex gap-3 px-5 py-4 border-t border-border">
                <Button variant="outline" className="flex-1" onClick={resetFilters}>
                  {t('myWishlists.filterReset')}
                </Button>
                <Button variant="primary" className="flex-1" onClick={applyFilters}>
                  {t('myWishlists.filterApply')}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
