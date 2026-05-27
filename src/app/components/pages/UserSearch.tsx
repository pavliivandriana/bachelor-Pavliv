import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router';
import { api } from '../../../api/client';
import { useApp } from '../../store/AppStore';
import { useLanguage } from '../../i18n/LanguageContext';
import { Card } from '../Card';
import { Button } from '../Button';
import { Search, Users, UserPlus, UserCheck } from 'lucide-react';

type SearchUser = {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  bio?: string;
  followers: string[];
  following: string[];
};

export function UserSearch() {
  const { currentUser, followUser, unfollowUser } = useApp();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    api.get<SearchUser[]>('/users/search')
      .then(setResults)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = (q: string) => {
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const url = q.trim().length >= 2
          ? `/users/search?q=${encodeURIComponent(q.trim())}`
          : '/users/search';
        const users = await api.get<SearchUser[]>(url);
        setResults(users);
      } catch {} finally {
        setLoading(false);
      }
    }, 300);
  };

  const handleFollow = async (userId: string) => {
    const isFollowing = currentUser?.following.includes(userId) ?? false;
    if (isFollowing) {
      await unfollowUser(userId);
    } else {
      await followUser(userId);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{t('search.title')}</h1>
          <p className="text-foreground/60">{t('search.subtitle')}</p>
        </div>

        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40 pointer-events-none" />
          <input
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-input-background border border-border focus:outline-none focus:ring-2 focus:ring-ring text-base text-foreground"
            placeholder={t('search.placeholder')}
            value={query}
            onChange={e => handleSearch(e.target.value)}
            autoFocus
          />
          {loading && query && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          )}
        </div>

        {loading && (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        )}

        {!loading && results.length === 0 && (
          <div className="text-center py-16">
            <Users className="w-16 h-16 text-foreground/20 mx-auto mb-4" />
            <p className="text-lg font-semibold mb-2">{t('search.noResults')}</p>
            <p className="text-foreground/50">{query ? t('search.tryAnother') : t('search.noUsers')}</p>
          </div>
        )}

        <div className="space-y-3">
          {results.map((user, i) => {
            const isFollowing = currentUser?.following.includes(user.id) ?? false;
            return (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card hover>
                  <div className="flex items-center gap-4">
                    <button
                      className="flex items-center gap-4 flex-1 min-w-0 text-left"
                      onClick={() => navigate(`/users/${user.id}`)}
                    >
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex-shrink-0 overflow-hidden">
                        {user.avatar && (
                          <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold truncate hover:text-primary transition-colors">{user.name}</p>
                        <p className="text-sm text-foreground/60">@{user.username}</p>
                        {user.bio && (
                          <p className="text-sm text-foreground/70 mt-1 line-clamp-1">{user.bio}</p>
                        )}
                        <p className="text-xs text-foreground/50 mt-1">
                          {user.followers.length} {t('search.followersLabel')}
                        </p>
                      </div>
                    </button>
                    <Button
                      variant={isFollowing ? 'outline' : 'primary'}
                      size="sm"
                      onClick={() => handleFollow(user.id)}
                    >
                      {isFollowing ? (
                        <><UserCheck className="w-4 h-4" /> {t('search.following')}</>
                      ) : (
                        <><UserPlus className="w-4 h-4" /> {t('search.follow')}</>
                      )}
                    </Button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
