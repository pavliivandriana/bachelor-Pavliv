import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Card } from '../Card';
import { Button } from '../Button';
import { Badge } from '../Badge';
import { Input } from '../Input';
import { useApp } from '../../store/AppStore';
import { useLanguage } from '../../i18n/LanguageContext';
import { XCircle, Plus, Trash2, Shield } from 'lucide-react';

export function AntiWishlist() {
  const { antiWishlist, addAntiWish, removeAntiWish } = useApp();
  const { t } = useLanguage();
  const [newItem, setNewItem] = useState({
    category: 'Gifts',
    item: '',
    reason: ''
  });

  const handleAdd = () => {
    if (!newItem.item) {
      alert(t('antiWishlist.alertEmpty'));
      return;
    }
    addAntiWish(newItem);
    setNewItem({ category: 'Gifts', item: '', reason: '' });
  };

  const categories: Array<[string, string]> = [
    ['Gifts', t('antiWishlist.catGifts')],
    ['Colors', t('antiWishlist.catColors')],
    ['Brands', t('antiWishlist.catBrands')],
    ['Styles', t('antiWishlist.catStyles')],
    ['Materials', t('antiWishlist.catMaterials')],
    ['Fragrances', t('antiWishlist.catFragrances')],
    ['Other', t('antiWishlist.catOther')],
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-br from-destructive/10 via-accent/10 to-primary/10 py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-destructive to-accent flex items-center justify-center">
                <XCircle className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">{t('antiWishlist.title')}</h1>
                <p className="text-foreground/70 mt-1">{t('antiWishlist.subtitle')}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-2xl bg-card/80 backdrop-blur-sm">
              <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium mb-1">{t('antiWishlist.bannerTitle')}</p>
                <p className="text-sm text-foreground/70">{t('antiWishlist.bannerText')}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Quick Add */}
        <Card className="mb-8">
          <h2 className="text-xl font-semibold mb-4">{t('antiWishlist.addTitle')}</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">{t('antiWishlist.categoryLabel')}</label>
                <select
                  className="w-full px-4 py-3 rounded-xl bg-input-background border border-border focus:outline-none focus:ring-2 focus:ring-ring"
                  value={newItem.category}
                  onChange={(e) => setNewItem(prev => ({ ...prev, category: e.target.value }))}
                >
                  {categories.map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <Input
                placeholder={t('antiWishlist.itemPlaceholder')}
                label={t('antiWishlist.itemLabel')}
                value={newItem.item}
                onChange={(e) => setNewItem(prev => ({ ...prev, item: e.target.value }))}
              />
            </div>
            <Input
              placeholder={t('antiWishlist.reasonPlaceholder')}
              label={t('antiWishlist.reasonLabel')}
              value={newItem.reason}
              onChange={(e) => setNewItem(prev => ({ ...prev, reason: e.target.value }))}
            />
            <Button variant="primary" onClick={handleAdd}>
              <Plus className="w-5 h-5" />
              {t('antiWishlist.addButton')}
            </Button>
          </div>
        </Card>

        {/* Categories */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">{t('antiWishlist.listTitle')}</h2>

          {/* Unwanted Gifts */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-destructive" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{t('antiWishlist.unwantedTitle')}</h3>
                  <p className="text-sm text-foreground/60">{t('antiWishlist.unwantedSubtitle')}</p>
                </div>
              </div>
              <Badge variant="accent">{antiWishlist.length}</Badge>
            </div>

            <div className="space-y-3">
              {antiWishlist.length > 0 ? antiWishlist.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="accent" className="text-xs">{item.category}</Badge>
                      <span className="font-medium">{item.item}</span>
                    </div>
                    {item.reason && (
                      <p className="text-sm text-foreground/60">{t('antiWishlist.reasonPrefix')}{item.reason}</p>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removeAntiWish(item.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </motion.div>
              )) : (
                <div className="text-center py-8 text-foreground/60">
                  <p>{t('antiWishlist.emptyList')}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Per-category breakdown */}
          {categories.slice(1).map(([cat, catLabel]) => {
            const items = antiWishlist.filter(i => i.category === cat);
            if (items.length === 0) return null;
            return (
              <Card key={cat}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">{catLabel}</h3>
                  <Badge variant="secondary">{items.length}</Badge>
                </div>
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                      <div className="flex-1">
                        <span className="font-medium">{item.item}</span>
                        {item.reason && (
                          <p className="text-sm text-foreground/60 mt-0.5">{item.reason}</p>
                        )}
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => removeAntiWish(item.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Visibility Notice */}
        <Card className="mt-8 bg-gradient-to-br from-primary/5 to-accent/5">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium mb-1">{t('antiWishlist.visTitle')}</p>
              <p className="text-sm text-foreground/70">{t('antiWishlist.visText')}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
