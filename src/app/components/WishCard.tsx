import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Card } from './Card';
import { Badge } from './Badge';
import { useLanguage } from '../i18n/LanguageContext';
import { Star, Clock, Gift, MoreVertical, Globe, Users, Lock, CheckCircle2, Mail } from 'lucide-react';

type Visibility = 'public' | 'friends' | 'private';

interface WishCardProps {
  wish: {
    id: string;
    title: string;
    image: string;
    price: number;
    currency?: string;
    priority: string;
    priorityNum?: number;
    confidence: number;
    added: string;
    reserved?: boolean;
    fulfilled?: boolean;
    visibility?: Visibility;
    pendingConfirmation?: boolean;
  };
  onClick?: () => void;
  compact?: boolean;
}

const PRIORITY_STYLE: Record<'low' | 'medium' | 'high', string> = {
  low:    'bg-blue-100 text-blue-600 border border-blue-200',
  medium: 'bg-primary/10 text-primary border border-primary/20',
  high:   'bg-accent/15 text-accent-foreground border border-accent/30',
};

const VIS_CONFIG: Record<Visibility, { Icon: React.ElementType; className: string; labelKey: string }> = {
  public:  { Icon: Globe,  className: 'bg-primary/80 text-white',            labelKey: 'wishCreation.visPublic' },
  friends: { Icon: Users,  className: 'bg-secondary/80 text-white',          labelKey: 'wishCreation.visFriends' },
  private: { Icon: Lock,   className: 'bg-foreground/60 text-white',         labelKey: 'wishCreation.visPrivate' },
};

export function WishCard({ wish, onClick, compact = false }: WishCardProps) {
  const { t } = useLanguage();
  const vis = wish.visibility ?? 'public';
  const visCfg = VIS_CONFIG[vis];
  const pNum = wish.priorityNum ?? 3;
  const pLevel: 'low' | 'medium' | 'high' = pNum <= 2 ? 'low' : pNum >= 4 ? 'high' : 'medium';
  const [imgErr, setImgErr] = useState(false);

  // Reset error flag when the image URL changes (e.g. after refreshWishes updates the store)
  useEffect(() => { setImgErr(false); }, [wish.image]);

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClick}
      >
        <Card hover className={`group cursor-pointer relative overflow-hidden ${wish.fulfilled ? 'opacity-70' : ''}`}>
          <div className="flex items-center gap-3">
            {/* Thumbnail */}
            <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
              {wish.image && !imgErr ? (
                <img
                  key={wish.image}
                  src={wish.image}
                  alt={wish.title}
                  className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-110 ${wish.fulfilled ? 'grayscale' : ''}`}
                  onError={() => setImgErr(true)}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                  <Gift className="w-7 h-7 text-primary/30" />
                </div>
              )}
              {wish.fulfilled && (
                <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <h3 className={`font-semibold text-sm truncate flex-1 ${wish.fulfilled ? 'line-through text-foreground/50' : ''}`}>{wish.title}</h3>
                {wish.fulfilled && (
                  <Badge variant="success" className="text-xs flex-shrink-0 bg-green-100 text-green-700 border-green-200">
                    {t('wish.fulfilled')}
                  </Badge>
                )}
                {!wish.fulfilled && wish.reserved && (
                  <Badge variant="success" className="text-xs flex-shrink-0">
                    {t('common.reserved')}
                  </Badge>
                )}
                {wish.pendingConfirmation && !wish.fulfilled && (
                  <Badge variant="secondary" className="text-xs flex-shrink-0 bg-orange-100 text-orange-700 border-orange-200">
                    <Mail className="w-2.5 h-2.5" />
                    {t('wish.pendingConfirmation')}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-primary">
                  {wish.currency ?? '$'}{wish.price}
                </span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_STYLE[pLevel]}`}>
                  <Star className="w-2.5 h-2.5 fill-current" />
                  {wish.priority}
                </span>
                {vis !== 'public' && (
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${visCfg.className}`}>
                    <visCfg.Icon className="w-2.5 h-2.5" />
                    {t(visCfg.labelKey)}
                  </span>
                )}
              </div>
            </div>

            {/* Right: confidence + date */}
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <Badge variant="primary" className="text-xs">{wish.confidence}%</Badge>
              <span className="text-foreground/50 text-xs flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {wish.added}
              </span>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
    >
      <Card hover className={`group cursor-pointer relative overflow-hidden ${wish.fulfilled ? 'opacity-75' : ''}`}>
        {/* Image */}
        <div className="relative mb-4 overflow-hidden rounded-xl">
          {wish.image && !imgErr ? (
            <img
              key={wish.image}
              src={wish.image}
              alt={wish.title}
              className={`w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110 ${wish.fulfilled ? 'grayscale' : ''}`}
              onError={() => setImgErr(true)}
            />
          ) : (
            <div className="w-full h-48 bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
              <Gift className="w-12 h-12 text-primary/30" />
            </div>
          )}
          {wish.fulfilled && (
            <div className="absolute inset-0 bg-green-500/10 flex items-center justify-center">
              <div className="bg-white/90 rounded-full p-2 shadow-lg">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
            </div>
          )}
          {!wish.fulfilled && wish.reserved && (
            <Badge variant="success" className="absolute top-3 right-3 shadow-lg">
              <Gift className="w-3 h-3" />
              {t('common.reserved')}
            </Badge>
          )}
          {wish.fulfilled && (
            <Badge variant="success" className="absolute top-3 right-3 shadow-lg bg-green-100 text-green-700 border-green-200">
              <CheckCircle2 className="w-3 h-3" />
              {t('wish.fulfilled')}
            </Badge>
          )}
          {wish.pendingConfirmation && !wish.fulfilled && !wish.reserved && (
            <Badge variant="secondary" className="absolute top-3 right-3 shadow-lg bg-orange-100 text-orange-700 border-orange-200">
              <Mail className="w-3 h-3" />
              {t('wish.pendingConfirmation')}
            </Badge>
          )}
          {vis !== 'public' && (
            <span className={`absolute bottom-3 left-3 inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm shadow-sm ${visCfg.className}`}>
              <visCfg.Icon className="w-3 h-3" />
              {t(visCfg.labelKey)}
            </span>
          )}
        </div>

        {/* Content */}
        <div>
          <div className="flex items-start justify-between mb-2">
            <h3 className={`font-semibold line-clamp-1 flex-1 ${wish.fulfilled ? 'line-through text-foreground/50' : ''}`}>{wish.title}</h3>
            <button className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical className="w-4 h-4 text-foreground/70" />
            </button>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl font-bold text-primary">{wish.currency ?? '$'}{wish.price}</span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_STYLE[pLevel]}`}>
              <Star className="w-3 h-3 fill-current" />
              {wish.priority}
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground/60 text-xs">{t('common.confidence')}</span>
              <Badge variant="primary" className="text-xs">{wish.confidence}%</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground/60 text-xs flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {t('common.added')}
              </span>
              <span className="text-foreground/70 text-xs">{wish.added}</span>
            </div>
          </div>
        </div>

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      </Card>
    </motion.div>
  );
}
