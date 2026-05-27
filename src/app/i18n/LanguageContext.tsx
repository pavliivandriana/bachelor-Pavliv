import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Language, translations } from './translations';

const STORAGE_KEY = 'wishlist_lang';

function getStoredLang(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'uk' || stored === 'en') return stored;
  } catch {}
  return 'uk';
}

type TranslationsShape = typeof translations['uk'];

function getNestedValue(obj: Record<string, unknown>, keys: string[]): string {
  let current: unknown = obj;
  for (const key of keys) {
    if (current == null || typeof current !== 'object') return keys.join('.');
    current = (current as Record<string, unknown>)[key];
  }
  if (typeof current === 'string') return current;
  return keys.join('.');
}

interface LanguageContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
  timeAgo: (date: string | Date) => string;
  timeAgoShort: (date: string | Date) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(getStoredLang);

  function setLang(newLang: Language) {
    setLangState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
    } catch {}
  }

  function t(key: string): string {
    const keys = key.split('.');
    return getNestedValue(translations[lang] as unknown as Record<string, unknown>, keys);
  }

  function timeAgo(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const months = Math.floor(days / 30);
    const weeks = Math.floor(days / 7);

    if (lang === 'uk') {
      if (days === 0) return 'Сьогодні';
      if (days === 1) return '1 день тому';
      if (days < 7) return `${days} дн. тому`;
      if (weeks === 1) return '1 тиж. тому';
      if (weeks < 5) return `${weeks} тиж. тому`;
      if (months === 1) return '1 міс. тому';
      return `${months} міс. тому`;
    } else {
      if (days === 0) return 'Today';
      if (days === 1) return '1 day ago';
      if (days < 7) return `${days} days ago`;
      if (weeks === 1) return '1 week ago';
      if (weeks < 5) return `${weeks} weeks ago`;
      if (months === 1) return '1 month ago';
      return `${months} months ago`;
    }
  }

  function timeAgoShort(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const mins = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);

    if (lang === 'uk') {
      if (mins < 1) return 'Щойно';
      if (mins < 60) return `${mins}хв`;
      if (hours < 24) return `${hours}год`;
      if (days < 7) return `${days}д`;
      return `${weeks}тиж`;
    } else {
      if (mins < 1) return 'Just now';
      if (mins < 60) return `${mins}m`;
      if (hours < 24) return `${hours}h`;
      if (days < 7) return `${days}d`;
      return `${weeks}w`;
    }
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, timeAgo, timeAgoShort }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
