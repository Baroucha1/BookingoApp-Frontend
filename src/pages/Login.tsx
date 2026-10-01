import { useState, useRef, useEffect, type ClipboardEvent, type KeyboardEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, ArrowRight, Loader2, ChevronDown } from 'lucide-react';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { useLanguage } from '@/i18n/LanguageContext';
import type { TranslationKey } from '@/i18n/translations';

const API = import.meta.env.VITE_API_URL;

const DZ_PHONE_RE = /^(05|06|07)\d{8}$/;
type Translate = (key: TranslationKey) => string;

function validateEmail(v: string, t: Translate) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : t('emailInvalid');
}
function validatePhone(v: string, t: Translate) {
  const digits = v.replace(/\s/g, '');
  if (!digits) return t('phoneRequired');
  if (!DZ_PHONE_RE.test(digits)) return t('phoneInvalid');
  return '';
}
function validateName(v: string, t: Translate) {
  return v.trim().length >= 2 ? '' : t('fieldRequired');
}
function validateLastName(v: string, t: Translate) {
  return v.trim().length >= 2 ? '' : t('fieldRequired');
}
function formatDzPhone(raw: string) {
  const d = raw.replace(/\D/g, '').slice(0, 10);
  return d.replace(/(\d{2})(\d{0,2})(\d{0,2})(\d{0,2})(\d{0,2})/, (_, a, b, c, e, f) =>
      [a, b, c, e, f].filter(Boolean).join(' '));
}
type PasswordStrength = 'empty' | 'weak' | 'fair' | 'good' | 'strong';
function getPasswordStrength(v: string): { strength: PasswordStrength; score: number; checks: Record<string, boolean> } {
  const checks = {
    length: v.length >= 8,
    lowercase: /[a-z]/.test(v),
    uppercase: /[A-Z]/.test(v),
    number: /[0-9]/.test(v),
    special: /[^A-Za-z0-9]/.test(v),
  };

  const score = Object.values(checks).filter(Boolean).length;

  if (!v) return { strength: 'empty', score: 0, checks };
  if (score <= 2) return { strength: 'weak', score, checks };
  if (score === 3) return { strength: 'fair', score, checks };
  if (score === 4) return { strength: 'good', score, checks };
  return { strength: 'strong', score, checks };
}
function validatePassword(v: string, t: Translate) {
  if (!v) return t('passwordRequired');
  if (v.length < 8) return t('passwordMinLength');
  const { checks } = getPasswordStrength(v);
  const missingCount = Object.values(checks).filter((check) => !check).length;
  if (missingCount >= 2) return t('passwordRequirements');
  return '';
}
function validatePasswordLogin(v: string, t: Translate) {
  return v ? '' : t('passwordRequired');
}
function PasswordStrengthMeter({ password }: { password: string }) {
  const { t } = useLanguage();
  const { strength, score } = getPasswordStrength(password);
  if (!password) return null;

  const config: Record<PasswordStrength, { label: string; color: string; bars: number }> = {
    empty:  { label: '',            color: '#e5e7eb', bars: 0 },
    weak:   { label: t('passwordWeak'),   color: '#ef4444', bars: 1 },
    fair:   { label: t('passwordFair'),   color: '#f59e0b', bars: 2 },
    good:   { label: t('passwordGood'),   color: '#3b82f6', bars: 3 },
    strong: { label: t('passwordStrong'), color: '#22c55e', bars: 4 },
  };
  const { label, color, bars } = config[strength];



  return (
      <div className="mt-2">
        <div className="flex gap-1">
          {[0, 1, 2, 3].map(i => (
              <div key={i} className="h-1 flex-1 rounded-full transition-colors duration-300"
                   style={{ background: i < bars ? color : '#e5e7eb' }} />
          ))}
        </div>
        <p className="text-[11px] mt-1 font-medium" style={{ color }}>{label}</p>
      </div>
  );
}
interface OtpVerifyProps { email: string; onVerified: () => void; onBack: () => void; }
function OtpVerify({ email, onVerified, onBack }: OtpVerifyProps) {
  const { loginWithToken } = useAuth();
  const { toast }          = useToast();
  const { t }              = useLanguage();
  const [digits, setDigits]   = useState<string[]>(Array(6).fill(''));
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [wait, setWait]       = useState(60);
  const inputs                = useRef<HTMLInputElement[]>([]);

  useEffect(() => { inputs.current[0]?.focus(); }, []);
  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait(w => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const code = digits.join('');

  function handleChange(i: number, val: string) {
    if (!/^\d?$/.test(val)) return;
    setError('');
    const next = [...digits]; next[i] = val; setDigits(next);
    if (val && i < 5) inputs.current[i + 1]?.focus();
  }
  function handleKey(i: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[i] && i > 0) inputs.current[i - 1]?.focus();
  }
  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) { setDigits(pasted.split('')); inputs.current[5]?.focus(); }
  }
  async function submit() {
    if (code.length < 6 || loading) return;
    setLoading(true); setError('');
    try {
      const res  = await fetch(`${API}/api/auth/verify-otp`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, code }) });
      const data = await res.json();
      if (!res.ok) { setError(t('otpInvalid')); setDigits(Array(6).fill('')); inputs.current[0]?.focus(); return; }
      loginWithToken(data.token, data.user); onVerified();
    } finally { setLoading(false); }
  }
  async function handleResend() {
    setError('');
    const res  = await fetch(`${API}/api/auth/resend-otp`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
    const data = await res.json();
    if (res.status === 429) { setWait(data.wait ?? 60); return; }
    if (!res.ok) { toast({ title: t('authError'), description: t('authFailed'), variant: 'destructive' }); return; }
    setWait(60); setDigits(Array(6).fill('')); inputs.current[0]?.focus();
    toast({ title: t('otpResent'), description: t('checkInbox') });
  }

  return (
      <div className="w-full space-y-6 text-center">
        <div className="text-5xl">✉️</div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t('otpTitle')}</h2>
          <p className="text-sm text-gray-500 mt-2">
            {t('otpSent')}<br />
            <span className="font-semibold text-gray-700">{email}</span>
          </p>
        </div>
        <div className="flex gap-2 justify-center">
          {digits.map((d, i) => (
              <input key={i} ref={el => { if (el) inputs.current[i] = el; }}
                     type="text" inputMode="numeric" maxLength={1} value={d}
                     onChange={e => handleChange(i, e.target.value)}
                     onKeyDown={e => handleKey(i, e)} onPaste={handlePaste}
                     className="w-11 text-center text-xl font-bold rounded-xl border-2 outline-none transition-all"
                     style={{ borderColor: error ? '#ef4444' : d ? '#0865FE' : '#e5e7eb', color: '#1a1440', height: '52px' }} />
          ))}
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button onClick={submit} disabled={code.length < 6 || loading}
                className="w-full h-12 rounded-xl flex items-center justify-center gap-2 text-sm font-bold text-white disabled:opacity-50 transition-all"
                style={{ background: '#0865FE' }}>
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('otpVerifying')}</> : <><ArrowRight className="w-4 h-4" /> {t('otpConfirm')}</>}
        </button>
        <p className="text-sm text-gray-500">
            <span className="text-xs text-gray-400 block mb-1">{t('checkSpam')}</span>
            {t('noOtpReceived')}{' '}
            {wait > 0 ? <span className="text-gray-400">{t('resendIn')} {wait}s</span>
              : <button onClick={handleResend} className="font-semibold" style={{ color: '#0865FE' }}>{t('resend')}</button>}
        </p>
        <button onClick={onBack} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
          {t('backToRegistration')}
        </button>
      </div>
  );
}

const Login = () => {
  const { toast }                                         = useToast();
  const { t, language }                                   = useLanguage();
  const { signIn, signInWithGoogle, signUp, user, isAdmin, loginWithToken } = useAuth();
  const navigate                                          = useNavigate();
  const [searchParams]                                    = useSearchParams();
  const redirect                                          = searchParams.get('redirect') || '/';

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail]           = useState('');
  const [phone, setPhone]           = useState('');
  const [password, setPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName]             = useState('');
  const [lastName, setLastName]     = useState('');
  const [showPw, setShowPw]         = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [otpEmail, setOtpEmail]     = useState<string | null>(null);
  const [emailErr, setEmailErr]     = useState('');
  const [phoneErr, setPhoneErr]     = useState('');
  const [nameErr, setNameErr]       = useState('');
  const [lastNameErr, setLastNameErr] = useState('');
  const [shake, setShake] = useState<Record<string, number>>({});
  const [passwordErr, setPasswordErr] = useState('');
  const [confirmPasswordErr, setConfirmPasswordErr] = useState('');

  useEffect(() => {
    if (!user) return;
    if (isAdmin) navigate('/admin', { replace: true });
    else navigate(redirect, { replace: true });
  }, [user, isAdmin]);

  function triggerShake(field: string) {
    setShake(s => ({ ...s, [field]: (s[field] ?? 0) + 1 }));
  }
  function switchTab(toRegister: boolean) {
    setIsRegister(toRegister);
    setEmailErr(''); setPhoneErr(''); setNameErr(''); setLastNameErr(''); setPasswordErr(''); setConfirmPasswordErr('');
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const eErr = validateEmail(email, t);
    const pErr = isRegister ? validatePhone(phone, t) : '';
    const nErr = isRegister ? validateName(name, t) : '';
    const lErr = isRegister ? validateLastName(lastName, t) : '';
    const pwErr = isRegister ? validatePassword(password, t) : validatePasswordLogin(password, t);
    const confirmErr = isRegister && password !== confirmPassword ? t('passwordMismatch') : '';
    setEmailErr(eErr); setPhoneErr(pErr); setNameErr(nErr); setLastNameErr(lErr); setPasswordErr(pwErr); setConfirmPasswordErr(confirmErr);
    if (eErr || pErr || nErr || lErr || pwErr || confirmErr) {
      if (nErr) triggerShake('name');
      if (lErr) triggerShake('lastName');
      if (eErr) triggerShake('email');
      if (pErr) triggerShake('phone');
      if (pwErr) triggerShake('password');
      if (confirmErr) triggerShake('confirmPassword');
      return;
    }
    setLoading(true);
    if (isRegister) {
      const rawPhone = phone.replace(/\s/g, '');
      const { error, otpEmail: pendingEmail } = await signUp(email, password, rawPhone, name.trim(), lastName.trim());
      if (error) toast({ title: t('authError'), description: t('signupFailed'), variant: 'destructive' });
      else setOtpEmail(pendingEmail!);
    } else {
      const { error, code } = await signIn(email, password);
      if (error) {
        if (code === 'email_not_verified') setOtpEmail(email);
        else toast({ title: t('authError'), description: t('authFailed'), variant: 'destructive' });
      } else {
        toast({ title: t('loginSuccess'), description: t('welcomeToBookingo') });
        navigate(redirect, { replace: true });
      }
    }
    setLoading(false);
  };

  const handleVerified = () => {
    toast({ title: t('accountVerified'), description: t('welcomeToBookingo') });
    navigate(redirect, { replace: true });
  };

  const handleGoogleSuccess = async ({ credential }: CredentialResponse) => {
    if (!credential || googleLoading) {
      if (!credential) toast({ title: t('authError'), description: t('googleTokenMissing'), variant: 'destructive' });
      return;
    }

    setGoogleLoading(true);
    const { error, code } = await signInWithGoogle(credential);
    setGoogleLoading(false);

    if (error) {
      const description = code === 'google_link_required' ? t('googleLinkRequired') : t('authFailed');
      toast({ title: t('googleLoginFailed'), description, variant: 'destructive' });
      return;
    }

    toast({ title: t('loginSuccess'), description: t('welcomeToBookingo') });
    navigate(redirect, { replace: true });
  };

  const renderFormPanel = () => (
      <div>
        <div className="mb-3">
          <h1 className="text-2xl font-bold text-[#1775FF]">
            {isRegister ? t('loginCreateAccount') : t('loginWelcome')}
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {isRegister
                ? t('loginJoinSubtitle')
                : redirect !== '/' ? t('loginContinueSubtitle') : t('loginSubtitle')}
          </p>
        </div>

        <div className="flex gap-1 p-1 rounded-xl mb-2" style={{ background: '#F0F2F8' }}>
          <button type="button" onClick={() => switchTab(false)}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all"
                  style={!isRegister
                      ? { background: '#0865FE', color: '#fff', boxShadow: '0 2px 8px rgba(8,101,254,0.3)' }
                      : { color: '#9CA3AF', background: 'transparent' }}>
            {t('loginTab')}
          </button>
          <button type="button" onClick={() => switchTab(true)}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all"
                  style={isRegister
                      ? { background: '#0865FE', color: '#fff', boxShadow: '0 2px 8px rgba(8,101,254,0.3)' }
                      : { color: '#9CA3AF', background: 'transparent' }}>
            {t('registerTab')}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-2">

          {isRegister && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">{t('lastName')}</label>
                  <div key={shake.name ?? 0} className={`flex items-center h-12 px-4 rounded-xl border-[1.5px] bg-gray-50 transition-all focus-within:bg-white ${
                      nameErr ? 'border-red-400 bg-red-50 animate-shake' : 'border-gray-200 focus-within:border-blue-400'
                  }`}>
                    <input type="text" value={name}
                            onChange={e => { setName(e.target.value); if (nameErr) setNameErr(validateName(e.target.value, t)); }}
                           onBlur={() => {
                             const err = validateName(name, t);
                             setNameErr(err);
                             if (err) triggerShake('name');
                           }}
                           required placeholder={t('lastName')}
                           className="flex-1 bg-transparent text-sm outline-none text-gray-800 placeholder:text-gray-400" />
                  </div>
                  {nameErr && <p className="text-[11px] text-red-500 pl-1">{nameErr}</p>}
                </div>
                <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">{t('firstName')}</label>
                  <div key={shake.lastName ?? 0} className={`flex items-center h-12 px-4 rounded-xl border-[1.5px] bg-gray-50 transition-all focus-within:bg-white ${
                      lastNameErr ? 'border-red-400 bg-red-50 animate-shake' : 'border-gray-200 focus-within:border-blue-400'
                  }`}>
                    <input type="text" value={lastName}
                            onChange={e => { setLastName(e.target.value); if (lastNameErr) setLastNameErr(validateLastName(e.target.value, t)); }}
                           onBlur={() => {
                             const err = validateLastName(lastName, t);
                             setLastNameErr(err);
                             if (err) triggerShake('lastName');
                           }}
                           required placeholder={t('firstName')}
                           className="flex-1 bg-transparent text-sm outline-none text-gray-800 placeholder:text-gray-400" />
                  </div>
                  {lastNameErr && <p className="text-[11px] text-red-500 pl-1">{lastNameErr}</p>}
                </div>
              </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">{t('emailLabel')}</label>
            <div key={shake.email ?? 0} className={`flex items-center h-12 px-4 rounded-xl border-[1.5px] bg-gray-50 transition-all focus-within:bg-white ${
                emailErr ? 'border-red-400 bg-red-50 animate-shake' : 'border-gray-200 focus-within:border-blue-400'
            }`}>
              <svg className="w-4 h-4 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <input   type="email" value={email}
                       onChange={e => { setEmail(e.target.value); if (emailErr) setEmailErr(validateEmail(e.target.value, t)); }}
                       onBlur={() => {
                         const err = validateEmail(email, t);
                         setEmailErr(err);
                         if (err) triggerShake('email');
                       }}
                       required placeholder={t('emailPlaceholder')}
                       className="flex-1 bg-transparent text-sm outline-none text-gray-800 placeholder:text-gray-400" />
            </div>
            {emailErr && <p className="text-[11px] text-red-500 pl-1">{emailErr}</p>}
          </div>

          {isRegister && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">{t('phone')}</label>
                <div key={shake.phone ?? 0} className={`flex items-center h-12 px-4 rounded-xl border-[1.5px] bg-gray-50 transition-all focus-within:bg-white ${
                    phoneErr ? 'border-red-400 bg-red-50 animate-shake' : 'border-gray-200 focus-within:border-blue-400'
                }`}>
                  <div className="flex items-center gap-1.5 px-3 h-full shrink-0 border-r border-gray-200">
                    <img
                        src="https://flagcdn.com/w40/dz.png"
                        alt="DZ"
                        className="w-6 h-4 object-cover rounded-sm"
                    />
                    <span className="text-sm font-semibold text-gray-600">+213</span>
                    <ChevronDown className="w-3 h-3 text-gray-400" />
                  </div>
                  <input type="tel" value={phone}
                         onChange={e => { const fmt = formatDzPhone(e.target.value); setPhone(fmt); if (phoneErr) setPhoneErr(validatePhone(fmt, t)); }}
                         onBlur={() => {
                           const err = validatePhone(phone, t);
                           setPhoneErr(err);
                           if (err) triggerShake('phone');
                         }}
                         placeholder={t('phonePlaceholder')}
                         inputMode="numeric"
                         className="flex-1 bg-transparent text-sm outline-none text-gray-800 placeholder:text-gray-400 px-3" />
                </div>
                {phoneErr && <p className="text-[11px] text-red-500 pl-1">{phoneErr}</p>}
              </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">{t('passwordLabel')}</label>
            <div key={shake.password ?? 0} className={`flex items-center gap-2.5 h-12 px-4 rounded-xl border-[1.5px] bg-gray-50 transition-all focus-within:bg-white ${
                passwordErr ? 'border-red-400 bg-red-50 animate-shake' : 'border-gray-200 focus-within:border-blue-400'
            }`}>
              <svg className="w-4 h-4 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <input type={showPw ? 'text' : 'password'} value={password}
                     onChange={e => {
                       setPassword(e.target.value);
                       if (passwordErr) setPasswordErr(isRegister ? validatePassword(e.target.value, t) : validatePasswordLogin(e.target.value, t));
                     }}
                     onBlur={() => {
                       const err = isRegister ? validatePassword(password, t) : validatePasswordLogin(password, t);
                       setPasswordErr(err);
                       if (err) triggerShake('password');
                     }}
                     required placeholder="••••••••"
                     className="flex-1 bg-transparent text-sm outline-none text-gray-800 placeholder:text-gray-400" />
              <button type="button" onClick={() => setShowPw(p => !p)}
                      className="text-gray-400 hover:text-gray-600 transition-colors">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Only show the strength meter on register — login doesn't need it */}
            {isRegister && <PasswordStrengthMeter password={password} />}

            {passwordErr && <p className="text-[11px] text-red-500 pl-1 mt-1">{passwordErr}</p>}
          </div>

          {isRegister && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">{t('confirmPasswordLabel')}</label>
              <div key={shake.confirmPassword ?? 0} className={`flex items-center gap-2.5 h-12 px-4 rounded-xl border-[1.5px] bg-gray-50 transition-all focus-within:bg-white ${
                confirmPasswordErr ? 'border-red-400 bg-red-50 animate-shake' : 'border-gray-200 focus-within:border-blue-400'
              }`}>
                <svg className="w-4 h-4 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <input
                  type={showConfirmPw ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => {
                    setConfirmPassword(e.target.value);
                    if (confirmPasswordErr) setConfirmPasswordErr(e.target.value === password ? '' : t('passwordMismatch'));
                  }}
                  onBlur={() => {
                    const err = confirmPassword === password ? '' : t('passwordMismatch');
                    setConfirmPasswordErr(err);
                    if (err) triggerShake('confirmPassword');
                  }}
                  required
                  placeholder="••••••••"
                  className="flex-1 bg-transparent text-sm outline-none text-gray-800 placeholder:text-gray-400"
                />
                <button type="button" onClick={() => setShowConfirmPw(p => !p)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPasswordErr && <p className="text-[11px] text-red-500 pl-1">{confirmPasswordErr}</p>}
            </div>
          )}

          {!isRegister && (
              <div className="text-right -mt-1">
                <button
                    type="button"
                    onClick={() => navigate('/forgot-password')}
                    className="text-xs font-semibold hover:underline"
                    style={{ color: '#0865FE' }}
                >
                  {t('forgotPasswordLink')}
                </button>
              </div>
          )}

          <button type="submit" disabled={loading}
                  className="w-full h-12 rounded-xl flex items-center justify-center gap-2 text-sm font-bold text-white disabled:opacity-60 hover:opacity-90 transition-all"
                  style={{ background: '#0865FE' }}>
            {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('loading')}</>
                : <>{isRegister ? t('registerSubmit') : t('loginSubmit')} <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>

        {!isRegister && (
            <div className="mt-5">
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400 font-medium whitespace-nowrap">{t('continueWith')}</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
              {import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
                <div className={`mt-3 flex w-full justify-center ${googleLoading ? 'pointer-events-none opacity-60' : ''}`}>
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => toast({ title: t('googleLoginCancelled'), description: t('googleRetry'), variant: 'destructive' })}
                    text="continue_with"
                    shape="rectangular"
                    logo_alignment="center"
                    width="400"
                  />
                </div>
              ) : (
              <div className="grid grid-cols-1 gap-2.5 mt-3">
                <button
                    type="button"
                    disabled
                    title={t('comingSoon')}
                    className="relative flex items-center justify-center gap-1.5 h-10 rounded-xl border border-gray-200 bg-gray-50 text-xs font-medium text-gray-400 cursor-not-allowed opacity-70"
                >
                  <svg className="w-4 h-4 shrink-0 grayscale opacity-60" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google
                  <span className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded-full bg-[#F5A623] text-white text-[9px] font-bold leading-none">
                {t('comingSoon')}
            </span>
                </button>
              </div>
              )}
            </div>
        )}

        <p className="text-center text-sm text-gray-500 mt-5">
          {isRegister ? t('hasAccountPrompt') : t('noAccountPrompt')}{' '}
          <button type="button" onClick={() => switchTab(!isRegister)}
                  className="font-semibold hover:underline" style={{ color: '#0865FE' }}>
            {isRegister ? t('loginTab') : t('registerTab')}
          </button>
        </p>

      </div>

  );

  return (
      <>
        {/* MOBILE — normal flow, image is a real element, form anchored top not centered */}
        <div className="lg:hidden bg-white">
          <div className="relative w-full h-96 sm:h-80 overflow-hidden">
            <img
                src="/assets/login/login.png"
                alt=""
                className="w-full h-full object-cover scale-110"
            />
            {/* subtle darken so the small text stays readable */}
            <div className="absolute inset-0 bg-black/25" />

            {/* blend into the white page below — no hard seam */}
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white via-white/60 to-transparent" />

            {/* small text, pinned near the top */}
            <div className="absolute top-40 left-5 right-5">
              <h2 className="text-2xl font-bold leading-tight text-white drop-shadow-lg">
                {t('heroAdventure')}<br />
                {t('heroBegins')} <span style={{ color: '#FFB400' }}>{t('heroHere')}</span>
              </h2>
              <p className="text-sm mt-3 text-white/90 drop-shadow">
                {t('heroRegisterPitch')}
              </p>
            </div>
          </div>

          <div className="px-5 -mt-10 relative z-10 pb-10">
            <div className="bg-white rounded-t-3xl shadow-xl p-5">
              {otpEmail
                  ? <OtpVerify email={otpEmail} onVerified={handleVerified} onBack={() => { setOtpEmail(null); setIsRegister(true); }} />
                  : renderFormPanel()}
            </div>
          </div>
        </div>

        {/* DESKTOP — your existing image-background + floating card layout */}
        {/* DESKTOP — your existing image-background + floating card layout */}
        <div
            className="hidden lg:flex relative items-center justify-end px-6 lg:px-20 py-10 h-screen"
            style={{
              backgroundImage: "url('/assets/login/login.png')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
        >
          <div className="absolute inset-0 bg-black/5" />
          <div className="flex flex-col justify-center max-w-md mr-auto text-blue-950 z-50 mb-32">
            <h2 className="text-4xl font-bold leading-tight">
              {t('heroAdventure')}<br />
              {t('heroBegins')} <span style={{ color: '#FFB400' }}>{t('heroHere')}</span>
            </h2>
            <p className="text-base mt-4 text-gray-100">
                {t('heroRegisterPitch')}
            </p>
          </div>

          <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-transparent pointer-events-none" />

          <div className="relative min-w-[448px] max-w-md bg-white rounded-xl shadow-2xl p-6">
            {otpEmail
                ? <OtpVerify email={otpEmail} onVerified={handleVerified} onBack={() => { setOtpEmail(null); setIsRegister(true); }} />
                : renderFormPanel()}
          </div>
        </div>
      </>
  );
};

export default Login;
