import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './Button';
import { Input } from './Input';
import { Badge } from './Badge';
import { useApp } from '../store/AppStore';
import { useLanguage } from '../i18n/LanguageContext';
import { uploadImage } from '../../api/client';
import {
  X,
  Upload,
  Save,
  Sparkles,
  Star,
} from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Slider from '@radix-ui/react-slider';

interface QuickAddWishProps {
  open: boolean;
  onClose: () => void;
}

export function QuickAddWish({ open, onClose }: QuickAddWishProps) {
  const { addWish } = useApp();
  const { t } = useLanguage();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    image: '',
    price: 0,
    currency: 'USD',
    link: '',
    context: '',
    tags: [] as string[],
    visibility: 'public' as 'public' | 'friends' | 'private'
  });
  const [priority, setPriority] = useState(3);
  const [confidence, setConfidence] = useState(80);
  const [saving, setSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    if (!file.type.match(/^image\/(jpeg|png)$/)) {
      alert(t('wishCreation.alertRequired'));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert(t('wishCreation.alertRequired'));
      return;
    }
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const priorityLabel = (p: number) =>
    p <= 2 ? t('priority.low') : p >= 4 ? t('priority.high') : t('priority.medium');

  const handleSubmit = async () => {
    if (!formData.title || formData.price === 0) {
      alert(t('quickAdd.alertRequired'));
      return;
    }

    setSaving(true);
    try {
      await addWish({
        ...formData,
        priority,
        confidence,
        aktualnostDuration: 1,
        tags: formData.tags.length > 0 ? formData.tags : [],
      });
      setStep(4);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setFormData({
      title: '',
      image: '',
      price: 0,
      currency: 'USD',
      link: '',
      context: '',
      tags: [],
      visibility: 'public'
    });
    setPriority(3);
    setConfidence(80);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-card rounded-3xl shadow-2xl"
          >
            {/* Header */}
            <div className="sticky top-0 bg-card border-b border-border rounded-t-3xl px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <Dialog.Title className="text-xl font-bold">{t('quickAdd.title')}</Dialog.Title>
                  <Dialog.Description className="text-sm text-foreground/60">
                    {t('quickAdd.stepOf')} {step} {t('quickAdd.of')} 3
                  </Dialog.Description>
                </div>
              </div>
              <Dialog.Close asChild>
                <button
                  onClick={handleClose}
                  className="w-10 h-10 rounded-xl hover:bg-muted transition-colors flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </Dialog.Close>
            </div>

            {/* Progress Bar */}
            <div className="px-6 pt-4">
              <div className="flex gap-2">
                {[1, 2, 3].map((s) => (
                  <div
                    key={s}
                    className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                      s <= step ? 'bg-gradient-to-r from-primary to-accent' : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div>
                      <h3 className="text-lg font-semibold mb-4">{t('quickAdd.step1Title')}</h3>

                      <div className="space-y-4">
                        <Input
                          label={t('quickAdd.titleLabel')}
                          placeholder={t('quickAdd.titlePlaceholder')}
                          className="text-lg"
                          value={formData.title}
                          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        />

                        <div>
                          <label className="block text-sm font-medium mb-2">{t('quickAdd.imageLabel')}</label>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/png,image/jpeg"
                            className="hidden"
                            onChange={handleFileChange}
                          />
                          {formData.image ? (
                            <div className="relative rounded-xl overflow-hidden border border-border">
                              <img src={formData.image} alt="preview" className="w-full h-40 object-cover" />
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
                              className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
                                isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary'
                              }`}
                              onClick={() => fileInputRef.current?.click()}
                              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                              onDragLeave={() => setIsDragging(false)}
                              onDrop={handleDrop}
                            >
                              {imageUploading ? (
                                <div className="flex flex-col items-center gap-2">
                                  <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                                  <p className="text-sm text-foreground/60">{t('wishCreation.imageUploading')}</p>
                                </div>
                              ) : (
                                <>
                                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-2">
                                    <Upload className="w-6 h-6 text-primary" />
                                  </div>
                                  <p className="text-sm font-medium mb-1">{t('quickAdd.imageUpload')}</p>
                                  <p className="text-xs text-foreground/60">{t('quickAdd.imageFormats')}</p>
                                </>
                              )}
                            </div>
                          )}
                        </div>

                        <Input
                          label={t('quickAdd.linkLabel')}
                          placeholder={t('quickAdd.linkPlaceholder')}
                          type="url"
                          value={formData.link}
                          onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <Input
                            label={t('quickAdd.priceLabel')}
                            placeholder="0.00"
                            type="number"
                            value={formData.price || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                          />
                          <div>
                            <label className="block text-sm font-medium mb-2">{t('quickAdd.currencyLabel')}</label>
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
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button variant="outline" className="flex-1" onClick={handleClose}>
                        {t('quickAdd.cancel')}
                      </Button>
                      <Button
                        variant="primary"
                        className="flex-1"
                        onClick={() => {
                          if (!formData.title || formData.price === 0) {
                            alert(t('quickAdd.alertFields'));
                            return;
                          }
                          setStep(2);
                        }}
                      >
                        {t('quickAdd.nextPriority')}
                      </Button>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="text-lg font-semibold mb-4">{t('quickAdd.step2Title')}</h3>

                      <div className="space-y-6">
                        <div>
                          <label className="text-sm font-medium block mb-3">{t('quickAdd.priorityQuestion')}</label>
                          <div className="grid grid-cols-3 gap-3">
                            {([
                              { value: 1, label: t('priority.low'),    activeClass: 'border-blue-300 bg-blue-50 text-blue-700' },
                              { value: 3, label: t('priority.medium'), activeClass: 'border-primary bg-primary/10 text-primary' },
                              { value: 5, label: t('priority.high'),   activeClass: 'border-accent bg-accent/10 text-accent-foreground' },
                            ] as const).map(opt => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => setPriority(opt.value)}
                                className={`py-3 rounded-xl border-2 font-semibold text-sm transition-all flex items-center justify-center gap-1.5 ${
                                  priority === opt.value
                                    ? opt.activeClass + ' shadow-sm'
                                    : 'border-border bg-card text-foreground/60 hover:bg-muted/50'
                                }`}
                              >
                                <Star className={`w-3.5 h-3.5 ${priority === opt.value ? 'fill-current' : ''}`} />
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <label className="text-sm font-medium">{t('quickAdd.confidenceQuestion')}</label>
                            <Badge variant="secondary">{confidence}{t('quickAdd.confidenceSure')}</Badge>
                          </div>
                          <Slider.Root
                            className="relative flex items-center select-none w-full h-5"
                            value={[confidence]}
                            onValueChange={(value) => setConfidence(value[0])}
                            max={100}
                            min={0}
                            step={5}
                          >
                            <Slider.Track className="bg-muted relative grow rounded-full h-3">
                              <Slider.Range className="absolute bg-gradient-to-r from-secondary to-primary h-full rounded-full" />
                            </Slider.Track>
                            <Slider.Thumb
                              className="block w-6 h-6 bg-white shadow-xl border-2 border-secondary rounded-full hover:scale-110 focus:outline-none focus:ring-4 focus:ring-secondary/20 transition-transform cursor-grab active:cursor-grabbing"
                              aria-label="Confidence"
                            />
                          </Slider.Root>
                          <div className="flex justify-between text-xs text-foreground/50 mt-2">
                            <span>{t('quickAdd.confidenceLow')}</span>
                            <span>{t('quickAdd.confidenceHigh')}</span>
                          </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
                          <p className="text-sm text-foreground/80">
                            <strong>{t('quickAdd.tipLabel')}</strong> {t('quickAdd.tip')}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                        {t('quickAdd.back')}
                      </Button>
                      <Button variant="primary" className="flex-1" onClick={() => setStep(3)}>
                        {t('quickAdd.nextDetails')}
                      </Button>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div>
                      <h3 className="text-lg font-semibold mb-4">{t('quickAdd.step3Title')}</h3>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            {t('quickAdd.contextLabel')}
                            <span className="text-xs text-foreground/60 ml-2">{t('quickAdd.contextHint')}</span>
                          </label>
                          <textarea
                            className="w-full px-4 py-3 rounded-xl bg-input-background border border-border focus:outline-none focus:ring-2 focus:ring-ring min-h-24 resize-none"
                            placeholder={t('quickAdd.contextPlaceholder')}
                            value={formData.context}
                            onChange={(e) => setFormData(prev => ({ ...prev, context: e.target.value }))}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">{t('quickAdd.tagsLabel')}</label>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {[t('quickAdd.tag1'), t('quickAdd.tag2'), t('quickAdd.tag3'), t('quickAdd.tag4'), t('quickAdd.tag5'), t('quickAdd.tag6')].map((tag, index) => {
                              const selected = formData.tags.includes(tag);
                              return (
                                <Badge
                                  key={index}
                                  variant={selected ? 'secondary' : 'primary'}
                                  className="cursor-pointer"
                                  onClick={() => {
                                    setFormData(prev => ({
                                      ...prev,
                                      tags: selected
                                        ? prev.tags.filter(t => t !== tag)
                                        : [...prev.tags, tag],
                                    }));
                                  }}
                                >
                                  {tag}{selected ? ' ×' : ''}
                                </Badge>
                              );
                            })}
                          </div>
                          <Input
                            placeholder={t('quickAdd.tagPlaceholder')}
                            className="text-sm"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const val = (e.target as HTMLInputElement).value.trim();
                                if (val && !formData.tags.includes(val)) {
                                  setFormData(prev => ({ ...prev, tags: [...prev.tags, val] }));
                                  (e.target as HTMLInputElement).value = '';
                                }
                              }
                            }}
                          />
                          {formData.tags.filter(tag => ![t('quickAdd.tag1'), t('quickAdd.tag2'), t('quickAdd.tag3'), t('quickAdd.tag4'), t('quickAdd.tag5'), t('quickAdd.tag6')].includes(tag)).length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {formData.tags.filter(tag => ![t('quickAdd.tag1'), t('quickAdd.tag2'), t('quickAdd.tag3'), t('quickAdd.tag4'), t('quickAdd.tag5'), t('quickAdd.tag6')].includes(tag)).map((tag, i) => (
                                <Badge
                                  key={i}
                                  variant="secondary"
                                  className="cursor-pointer"
                                  onClick={() => setFormData(prev => ({ ...prev, tags: prev.tags.filter(tt => tt !== tag) }))}
                                >
                                  {tag} ×
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-3">{t('quickAdd.visLabel')}</label>
                          <div className="space-y-2">
                            <label className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 cursor-pointer hover:bg-muted transition-colors">
                              <input
                                type="radio"
                                name="visibility"
                                checked={formData.visibility === 'public'}
                                onChange={() => setFormData(prev => ({ ...prev, visibility: 'public' }))}
                              />
                              <div className="flex-1">
                                <p className="font-medium text-sm">{t('quickAdd.visPublic')}</p>
                                <p className="text-xs text-foreground/60">{t('quickAdd.visPublicDesc')}</p>
                              </div>
                            </label>
                            <label className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 cursor-pointer hover:bg-muted transition-colors">
                              <input
                                type="radio"
                                name="visibility"
                                checked={formData.visibility === 'friends'}
                                onChange={() => setFormData(prev => ({ ...prev, visibility: 'friends' }))}
                              />
                              <div className="flex-1">
                                <p className="font-medium text-sm">{t('quickAdd.visFriends')}</p>
                                <p className="text-xs text-foreground/60">{t('quickAdd.visFriendsDesc')}</p>
                              </div>
                            </label>
                            <label className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 cursor-pointer hover:bg-muted transition-colors">
                              <input
                                type="radio"
                                name="visibility"
                                checked={formData.visibility === 'private'}
                                onChange={() => setFormData(prev => ({ ...prev, visibility: 'private' }))}
                              />
                              <div className="flex-1">
                                <p className="font-medium text-sm">{t('quickAdd.visPrivate')}</p>
                                <p className="text-xs text-foreground/60">{t('quickAdd.visPrivateDesc')}</p>
                              </div>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>
                        {t('quickAdd.back')}
                      </Button>
                      <Button variant="primary" className="flex-1" onClick={handleSubmit} disabled={saving}>
                        <Save className="w-5 h-5" />
                        {saving ? t('quickAdd.saving') : t('quickAdd.save')}
                      </Button>
                    </div>
                  </motion.div>
                )}

                {step === 4 && (
                  <motion.div
                    key="step4"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-8"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                      className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-6"
                    >
                      <Sparkles className="w-10 h-10 text-white" />
                    </motion.div>
                    <h3 className="text-2xl font-bold mb-3">{t('quickAdd.step4Title')}</h3>
                    <p className="text-foreground/70 mb-8">
                      «{formData.title}» {t('quickAdd.step4Subtitle')}
                    </p>
                    <div className="flex gap-3">
                      <Button variant="outline" className="flex-1" onClick={handleClose}>
                        {t('quickAdd.viewList')}
                      </Button>
                      <Button variant="primary" className="flex-1" onClick={resetForm}>
                        {t('quickAdd.addAnother')}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
