import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router';
import { Button } from '../Button';
import { Input } from '../Input';
import { Card } from '../Card';
import { useApp } from '../../store/AppStore';
import { ApiError } from '../../../api/client';
import { useLanguage } from '../../i18n/LanguageContext';
import { Heart, ArrowRight, Mail, RefreshCw, ArrowLeft } from 'lucide-react';

type Screen = 'form' | 'verify-pending';

export function AuthPage() {
  const { login, register, verifyEmail, resendVerification } = useApp();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [screen, setScreen] = useState<Screen>('form');
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [pendingEmail, setPendingEmail] = useState('');
  const [pendingAlreadyRegistered, setPendingAlreadyRegistered] = useState(false);

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // OTP
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Resend cooldown
  const [cooldown, setCooldown] = useState(0);
  const [resendMsg, setResendMsg] = useState('');

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown(c => c - 1), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isLogin && formData.password !== formData.confirmPassword) {
      setError(t('auth.passwordMismatch'));
      return;
    }

    setSubmitting(true);
    try {
      if (isLogin) {
        await login(formData.email, formData.password);
        navigate('/dashboard');
      } else {
        const { needsVerification } = await register(formData.name, formData.email, formData.password);
        if (needsVerification) {
          setPendingEmail(formData.email.trim().toLowerCase());
          setCooldown(60);
          setScreen('verify-pending');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : '';
      const isNetworkError = err instanceof TypeError || raw.toLowerCase().includes('failed to fetch') || raw.toLowerCase().includes('network');
      if (isNetworkError) {
        setError(t('auth.errorNetwork'));
      } else if (raw.includes('not verified') || raw.includes('Email not verified') || raw.includes('email_pending_verification')) {
        const isPending = raw.includes('email_pending_verification');
        const waitSeconds = isPending && err instanceof ApiError && typeof err.data?.waitSeconds === 'number'
          ? err.data.waitSeconds as number
          : 0;
        setPendingEmail(formData.email.trim().toLowerCase());
        setPendingAlreadyRegistered(isPending);
        if (waitSeconds > 0) setCooldown(waitSeconds);
        setScreen('verify-pending');
      } else if (raw.includes('Invalid credentials') || raw.includes('invalid credentials')) {
        setError(t('auth.errorInvalidCredentials'));
      } else if (raw.includes('email_not_found')) {
        setError(t('auth.errorEmailNotFound'));
      } else if (raw.includes('smtp_not_configured')) {
        setError(t('auth.errorSmtpNotConfigured'));
      } else if (raw.includes('email_send_failed')) {
        setError(t('auth.errorEmailSendFailed'));
      } else if (raw.includes('email_already_in_use') || raw.includes('already in use')) {
        setError(t('auth.errorEmailInUse'));
      } else {
        setError(t('auth.error'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!digits) return;
    e.preventDefault();
    const next = digits.split('').concat(Array(6).fill('')).slice(0, 6) as string[];
    setOtp(next);
    otpRefs.current[Math.min(digits.length, 5)]?.focus();
  };

  const handleVerify = async () => {
    const code = otp.join('').trim();
    if (code.length !== 6) return;
    setSubmitting(true);
    setError('');
    try {
      await verifyEmail(pendingEmail, code);
      navigate('/dashboard');
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : '';
      setError(raw.includes('token_expired') ? t('auth.otpExpired') : t('auth.otpInvalid'));
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => otpRefs.current[0]?.focus(), 0);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setResendMsg('');
    try {
      const result = await resendVerification(pendingEmail);
      if (result.waitSeconds) {
        setCooldown(result.waitSeconds);
      } else {
        setCooldown(60);
        setOtp(['', '', '', '', '', '']);
        setResendMsg(t('auth.resendSuccess'));
        setTimeout(() => { setResendMsg(''); otpRefs.current[0]?.focus(); }, 100);
      }
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : '';
      if (raw.includes('email_not_found')) {
        setResendMsg(t('auth.errorEmailNotFound'));
      } else if (raw.includes('smtp_not_configured')) {
        setResendMsg(t('auth.errorSmtpNotConfigured'));
      } else if (raw.includes('email_send_failed')) {
        setResendMsg(t('auth.errorEmailSendFailed'));
      } else {
        setResendMsg(t('auth.error'));
      }
    }
  };

  const Logo = () => (
    <div className="inline-flex items-center gap-2 mb-4">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
        <Heart className="w-7 h-7 text-white" fill="white" />
      </div>
      <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
        WishList
      </span>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10" />
      <div className="absolute top-20 left-10 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />

      <div className="w-full max-w-md relative z-10">
        <AnimatePresence mode="wait">

          {/* ── Auth form ── */}
          {screen === 'form' && (
            <motion.div
              key="form"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25 }}
            >
              <div className="text-center mb-8">
                <Logo />
                <h1 className="text-3xl font-bold mb-2">
                  {isLogin ? t('auth.loginTitle') : t('auth.registerTitle')}
                </h1>
                <p className="text-foreground/60">
                  {isLogin ? t('auth.loginSubtitle') : t('auth.registerSubtitle')}
                </p>
              </div>

              <Card glass>
                <form className="space-y-4" onSubmit={handleSubmit}>
                  {!isLogin && (
                    <Input
                      type="text"
                      placeholder={t('auth.namePlaceholder')}
                      label={t('auth.nameLabel')}
                      value={formData.name}
                      onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                      required
                    />
                  )}
                  <Input
                    type="email"
                    placeholder={t('auth.emailPlaceholder')}
                    label={t('auth.emailLabel')}
                    value={formData.email}
                    onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                    required
                  />
                  <Input
                    type="password"
                    placeholder={t('auth.passwordPlaceholder')}
                    label={t('auth.passwordLabel')}
                    value={formData.password}
                    onChange={(e) => setFormData(p => ({ ...p, password: e.target.value }))}
                    required
                  />
                  {!isLogin && (
                    <Input
                      type="password"
                      placeholder={t('auth.passwordPlaceholder')}
                      label={t('auth.confirmPasswordLabel')}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData(p => ({ ...p, confirmPassword: e.target.value }))}
                      required
                    />
                  )}

                  {isLogin && (
                    <div className="flex items-center justify-between text-sm">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="rounded" />
                        <span className="text-foreground/70">{t('auth.rememberMe')}</span>
                      </label>
                      <a href="#" className="text-primary hover:underline">{t('auth.forgotPassword')}</a>
                    </div>
                  )}

                  {error && <p className="text-sm text-destructive text-center">{error}</p>}

                  <Button type="submit" variant="primary" className="w-full" size="lg" disabled={submitting}>
                    {submitting ? t('auth.submitting') : isLogin ? t('auth.signIn') : t('auth.signUp')}
                    {!submitting && <ArrowRight className="w-5 h-5" />}
                  </Button>
                </form>

                <div className="mt-6 text-center text-sm text-foreground/60">
                  {isLogin ? t('auth.noAccount') : t('auth.hasAccount')}{' '}
                  <button
                    type="button"
                    onClick={() => { setIsLogin(!isLogin); setError(''); }}
                    className="text-primary font-medium hover:underline"
                  >
                    {isLogin ? t('auth.signUp') : t('auth.signIn')}
                  </button>
                </div>
              </Card>

              <p className="text-center text-xs text-foreground/50 mt-6">
                {t('auth.termsText')}{' '}
                <a href="#" className="text-primary hover:underline">{t('auth.terms')}</a>{' '}
                {t('auth.and')}{' '}
                <a href="#" className="text-primary hover:underline">{t('auth.privacy')}</a>
              </p>
            </motion.div>
          )}

          {/* ── Verify pending ── */}
          {screen === 'verify-pending' && (
            <motion.div
              key="verify-pending"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25 }}
            >
              <div className="text-center mb-8">
                <Logo />
              </div>

              <Card glass>
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-5">
                    <Mail className="w-10 h-10 text-primary" />
                  </div>

                  <h2 className="text-2xl font-bold mb-2">{t('auth.verifyPendingTitle')}</h2>
                  <p className="text-foreground/60 text-sm mb-1">{t('auth.verifyPendingSubtitle')}</p>
                  <p className="font-semibold text-primary mb-5 break-all">{pendingEmail}</p>

                  {/* OTP boxes */}
                  <div className="flex gap-2 mb-4">
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        ref={el => { otpRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={e => handleOtpChange(i, e.target.value)}
                        onKeyDown={e => handleOtpKeyDown(i, e)}
                        onPaste={handleOtpPaste}
                        className="w-11 h-13 text-center text-xl font-bold border-2 border-border rounded-xl bg-background focus:border-primary focus:outline-none transition-colors"
                        style={{ height: '52px' }}
                      />
                    ))}
                  </div>

                  {error && <p className="text-sm text-destructive mb-3">{error}</p>}
                  {resendMsg && <p className="text-sm text-primary mb-3 font-medium">{resendMsg}</p>}

                  <Button
                    variant="primary"
                    className="w-full mb-3"
                    onClick={handleVerify}
                    disabled={submitting || otp.join('').length !== 6}
                  >
                    {submitting ? t('auth.submitting') : t('auth.otpVerify')}
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full mb-3"
                    onClick={handleResend}
                    disabled={cooldown > 0}
                  >
                    <RefreshCw className="w-4 h-4" />
                    {cooldown > 0
                      ? `${t('auth.resendCooldown')} ${cooldown}s`
                      : t('auth.resendEmail')}
                  </Button>

                  <button
                    type="button"
                    onClick={() => { setScreen('form'); setError(''); setPendingAlreadyRegistered(false); setOtp(['', '', '', '', '', '']); }}
                    className="flex items-center gap-1.5 text-sm text-foreground/50 hover:text-foreground transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    {t('auth.backToLogin')}
                  </button>
                </div>
              </Card>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
