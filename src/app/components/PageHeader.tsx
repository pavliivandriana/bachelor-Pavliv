import React from 'react';
import { useNavigate } from 'react-router';
import { ChevronLeft, Heart } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface PageHeaderProps {
  title: string;
}

export function PageHeader({ title }: PageHeaderProps) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  return (
    <div className="sticky top-0 z-40 bg-sidebar/90 backdrop-blur border-b border-sidebar-border px-6 py-4 flex items-center gap-4">
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-1 text-foreground/60 hover:text-foreground transition-colors"
      >
        <ChevronLeft className="w-5 h-5" />
        {t('pageHeader.home')}
      </button>
      <div className="w-px h-5 bg-border" />
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <Heart className="w-3.5 h-3.5 text-white" fill="white" />
        </div>
        <span className="font-semibold">{title}</span>
      </div>
    </div>
  );
}
