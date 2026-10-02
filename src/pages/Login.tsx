import { useState, useRef, useEffect, type ClipboardEvent, type KeyboardEvent } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/i18n/LanguageContext';
import { Eye, EyeOff, ArrowRight, ArrowLeft, Loader2, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const API = import.meta.env.VITE_API_URL;

const DZ_PHONE_RE = /^(05|06|07)\d{8}$/;

const authTexts = {
  fr: {
    heroTitle: 'Votre aventure',
    heroTitleHighlight: 'commence ici',
    heroSubtitle: "Créez votre compte BookinGO et profitez d'un monde de possibilités.",
    welcomeBack: 'Bon retour',
    createAccount: 'Créer un compte',
    loginSubtitle: 'Connectez-vous à votre compte',
    loginSubtitleRedirect: 'Connectez-vous à votre compte pour continuer',
    registerSubtitle: 'Rejoignez BookinGO et commencez votre demande',
    tabLogin: 'Connexion',
    tabRegister: 'Créer un compte',
    firstName: 'Nom',
    lastName: 'Prénom',
    firstNamePlaceholder: 'Amine',
    lastNamePlaceholder: 'Benali',
    email: 'Adresse email',
    emailPlaceholder: 'vous@exemple.com',
    phone: 'Téléphone',
    phonePlaceholder: '06 12 34 56 78',
    password: 'Mot de passe',
    passwordPlaceholder: '••••••••',
    forgotPassword: 'Mot de passe oublié ?',
    submitLogin: 'Se connecter',
    submitRegister: 'Créer mon compte',
    loading: 'Chargement...',
    orContinueWith: 'ou continuer avec',
    soon: 'Bientôt',
    alreadyAccount: 'Déjà un compte ?',
    noAccount: 'Pas encore de compte ?',
    signInLink: 'Se connecter',
    signUpLink: 'Créer un compte',
    loginSuccess: 'Connexion réussie !',
    welcomeMsg: 'Bienvenue sur BookinGO.',
    accountVerified: 'Compte vérifié 🎉',
    verifyEmailTitle: 'Vérifiez votre e-mail',
    verifyEmailDesc: 'Un code à 6 chiffres a été envoyé à',
    verifying: 'Vérification...',
    confirm: 'Confirmer',
    checkSpam: 'Vérifiez aussi vos spams.',
    noCode: "Vous n'avez pas reçu de code ?",
    resend: 'Renvoyer',
    resendIn: 'Renvoyer dans {wait}s',
    backToRegister: "← Revenir à l'inscription",
    codeResent: 'Code renvoyé',
    codeResentDesc: 'Vérifiez votre boîte mail.',
    invalidCode: 'Code invalide.',
    errEmail: 'Adresse e-mail invalide.',
    errPhoneRequired: 'Le numéro de téléphone est requis.',
    errPhoneInvalid: 'Numéro invalide. Format : 06 XX XX XX XX',
    errFieldRequired: 'Ce champ est requis.',
    errPasswordRequired: 'Le mot de passe est requis.',
    errPasswordMin: 'Minimum 8 caractères.',
    strengthWeak: 'Faible',
    strengthFair: 'Moyen',
    strengthGood: 'Bon',
    strengthStrong: 'Fort',
  },
  en: {
    heroTitle: 'Your adventure',
    heroTitleHighlight: 'starts here',
    heroSubtitle: 'Create your BookinGO account and unlock a world of possibilities.',
    welcomeBack: 'Welcome back',
    createAccount: 'Create an account',
    loginSubtitle: 'Log in to your account',
    loginSubtitleRedirect: 'Log in to your account to continue',
    registerSubtitle: 'Join BookinGO and start your journey',
    tabLogin: 'Sign In',
    tabRegister: 'Create Account',
    firstName: 'First name',
    lastName: 'Last name',
    firstNamePlaceholder: 'Amine',
    lastNamePlaceholder: 'Benali',
    email: 'Email address',
    emailPlaceholder: 'you@example.com',
    phone: 'Phone number',
    phonePlaceholder: '06 12 34 56 78',
    password: 'Password',
    passwordPlaceholder: '••••••••',
    forgotPassword: 'Forgot password?',
    submitLogin: 'Sign In',
    submitRegister: 'Create my account',
    loading: 'Loading...',
    orContinueWith: 'or continue with',
    soon: 'Soon',
    alreadyAccount: 'Already have an account?',
    noAccount: "Don't have an account yet?",
    signInLink: 'Sign In',
    signUpLink: 'Create an account',
    loginSuccess: 'Login successful!',
    welcomeMsg: 'Welcome to BookinGO.',
    accountVerified: 'Account verified 🎉',
    verifyEmailTitle: 'Verify your email',
    verifyEmailDesc: 'A 6-digit verification code has been sent to',
    verifying: 'Verifying...',
    confirm: 'Confirm',
    checkSpam: 'Also check your spam folder.',
    noCode: "Didn't receive a code?",
    resend: 'Resend',
    resendIn: 'Resend in {wait}s',
    backToRegister: '← Back to sign up',
    codeResent: 'Code resent',
    codeResentDesc: 'Please check your mailbox.',
    invalidCode: 'Invalid code.',
    errEmail: 'Invalid email address.',
    errPhoneRequired: 'Phone number is required.',
    errPhoneInvalid: 'Invalid number. Format: 06 XX XX XX XX',
    errFieldRequired: 'This field is required.',
    errPasswordRequired: 'Password is required.',
    errPasswordMin: 'Minimum 8 characters.',
    strengthWeak: 'Weak',
    strengthFair: 'Fair',
    strengthGood: 'Good',
    strengthStrong: 'Strong',
  },
  ar: {
    heroTitle: 'مغامرتك',
    heroTitleHighlight: 'تبدأ هنا',
    heroSubtitle: 'أنشئ حسابك على BookinGO واستمتع بعالم مليء بالفرص وإمكانيات السفر.',
    welcomeBack: 'مرحباً بعودتك',
    createAccount: 'إنشاء حساب جديد',
    loginSubtitle: 'سجّل الدخول إلى حسابك',
    loginSubtitleRedirect: 'سجّل الدخول إلى حسابك للمتابعة',
    registerSubtitle: 'انضم إلى BookinGO وابدأ طلبك بكل سهولة',
    tabLogin: 'تسجيل الدخول',
    tabRegister: 'إنشاء حساب',
    firstName: 'الاسم',
    lastName: 'اللقب',
    firstNamePlaceholder: 'أمين',
    lastNamePlaceholder: 'بن علي',
    email: 'البريد الإلكتروني',
    emailPlaceholder: 'you@example.com',
    phone: 'رقم الهاتف',
    phonePlaceholder: '06 12 34 56 78',
    password: 'كلمة المرور',
    passwordPlaceholder: '••••••••',
    forgotPassword: 'نسيت كلمة المرور؟',
    submitLogin: 'تسجيل الدخول',
    submitRegister: 'إنشاء حسابي',
    loading: 'جارٍ التحميل...',
    orContinueWith: 'أو المتابعة باستخدام',
    soon: 'قريباً',
    alreadyAccount: 'لديك حساب بالفعل؟',
    noAccount: 'ليس لديك حساب بعد؟',
    signInLink: 'تسجيل الدخول',
    signUpLink: 'إنشاء حساب',
    loginSuccess: 'تم تسجيل الدخول بنجاح!',
    welcomeMsg: 'مرحباً بك في BookinGO.',
    accountVerified: 'تم التحقق من الحساب بنجاح 🎉',
    verifyEmailTitle: 'تحقق من بريدك الإلكتروني',
    verifyEmailDesc: 'تم إرسال رمز تحقق مكون من 6 أرقام إلى',
    verifying: 'جارٍ التحقق...',
    confirm: 'تأكيد',
    checkSpam: 'يرجى مراجعة مجلد الرسائل غير المرغوب فيها (Spam).',
    noCode: 'لم تتلق الرمز؟',
    resend: 'إعادة الإرسال',
    resendIn: 'إعادة الإرسال بعد {wait}ث',
    backToRegister: '← العودة إلى التسجيل',
    codeResent: 'تمت إعادة إرسال الرمز',
    codeResentDesc: 'يرجى مراجعة بريدك الإلكتروني.',
    invalidCode: 'رمز غير صالح.',
    errEmail: 'البريد الإلكتروني غير صالح.',
    errPhoneRequired: 'رقم الهاتف مطلوب.',
    errPhoneInvalid: 'رقم غير صالح. التنسيق: 06 XX XX XX XX',
    errFieldRequired: 'هذا الحقل مطلوب.',
    errPasswordRequired: 'كلمة المرور مطلوبة.',
    errPasswordMin: '8 أحرف على الأقل.',
    strengthWeak: 'ضعيفة',
    strengthFair: 'متوسطة',
    strengthGood: 'جيدة',
    strengthStrong: 'قوية',
  },
};

type AuthTexts = typeof authTexts.fr;

function validateEmail(v: string, txt: AuthTexts) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : txt.errEmail;
}
function validatePhone(v: string, txt: AuthTexts) {
  const digits = v.replace(/\s/g, '');
  if (!digits) return txt.errPhoneRequired;
  if (!DZ_PHONE_RE.test(digits)) return txt.errPhoneInvalid;
  return '';
}
function validateName(v: string, txt: AuthTexts) {
  return v.trim().length >= 2 ? '' : txt.errFieldRequired;
}
function validateLastName(v: string, txt: AuthTexts) {
  return v.trim().length >= 2 ? '' : txt.errFieldRequired;
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
function validatePassword(v: string, txt: AuthTexts) {
  if (!v) return txt.errPasswordRequired;
  if (v.length < 8) return txt.errPasswordMin;
  return '';
}
function validatePasswordLogin(v: string, txt: AuthTexts) {
  return v ? '' : txt.errPasswordRequired;
}

function PasswordStrengthMeter({ password, txt }: { password: string; txt: AuthTexts }) {
  const { strength } = getPasswordStrength(password);
  if (!password) return null;

  const config: Record<PasswordStrength, { label: string; color: string; bars: number }> = {
    empty: { label: '', color: '#e5e7eb', bars: 0 },
    weak: { label: txt.strengthWeak, color: '#ef4444', bars: 1 },
    fair: { label: txt.strengthFair, color: '#f59e0b', bars: 2 },
    good: { label: txt.strengthGood, color: '#3b82f6', bars: 3 },
    strong: { label: txt.strengthStrong, color: '#22c55e', bars: 4 },
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

interface OtpVerifyProps {
  email: string;
  onVerified: () => void;
  onBack: () => void;
  txt: AuthTexts;
  isRtl: boolean;
}
function OtpVerify({ email, onVerified, onBack, txt, isRtl }: OtpVerifyProps) {
  const { loginWithToken } = useAuth();
  const { toast } = useToast();
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [wait, setWait] = useState(60);
  const inputs = useRef<HTMLInputElement[]>([]);

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
      const res = await fetch(`${API}/api/auth/verify-otp`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, code }) });
      const data = await res.json();
      if (!res.ok) { setError(data.message ?? txt.invalidCode); setDigits(Array(6).fill('')); inputs.current[0]?.focus(); return; }
      loginWithToken(data.token, data.user); onVerified();
    } finally { setLoading(false); }
  }
  async function handleResend() {
    setError('');
    const res = await fetch(`${API}/api/auth/resend-otp`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
    const data = await res.json();
    if (res.status === 429) { setWait(data.wait ?? 60); return; }
    if (!res.ok) { toast({ title: 'Erreur', description: data.message, variant: 'destructive' }); return; }
    setWait(60); setDigits(Array(6).fill('')); inputs.current[0]?.focus();
    toast({ title: txt.codeResent, description: txt.codeResentDesc });
  }

  return (
    <div className="w-full space-y-6 text-center" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="text-5xl">✉️</div>
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{txt.verifyEmailTitle}</h2>
        <p className="text-sm text-gray-500 mt-2">
          {txt.verifyEmailDesc}<br />
          <span className="font-semibold text-gray-700" dir="ltr">{email}</span>
        </p>
      </div>
      <div className="flex gap-2 justify-center" dir="ltr">
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
        className="w-full h-12 rounded-xl flex items-center justify-center gap-2 text-sm font-bold text-white disabled:opacity-50 transition-all cursor-pointer"
        style={{ background: '#0865FE' }}>
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> {txt.verifying}</> : <>{txt.confirm} <ArrowRight className={cn("w-4 h-4", isRtl && "rotate-180")} /></>}
      </button>
      <p className="text-sm text-gray-500">
        <span className="text-xs text-gray-400 block mb-1">{txt.checkSpam}</span>
        {txt.noCode}{' '}
        {wait > 0 ? <span className="text-gray-400">{txt.resendIn.replace('{wait}', String(wait))}</span>
          : <button onClick={handleResend} className="font-semibold cursor-pointer" style={{ color: '#0865FE' }}>{txt.resend}</button>}
      </p>
      <button onClick={onBack} className="text-xs text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
        {txt.backToRegister}
      </button>
    </div>
  );
}

const Login = () => {
  const { toast } = useToast();
  const { signIn, signInWithGoogle, signUp, user, isAdmin } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const txt = authTexts[language] || authTexts.fr;
  const isRtl = language === 'ar';

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleBtnWidth, setGoogleBtnWidth] = useState<number>(300);
  const googleContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateWidth = () => {
      if (googleContainerRef.current) {
        const w = googleContainerRef.current.offsetWidth;
        if (w > 0) {
          setGoogleBtnWidth(Math.min(400, Math.max(200, Math.floor(w))));
        }
      }
    };
    updateWidth();
    const timer = setTimeout(updateWidth, 100);
    window.addEventListener('resize', updateWidth);

    let ro: ResizeObserver | null = null;
    if (googleContainerRef.current && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => updateWidth());
      ro.observe(googleContainerRef.current);
    }

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateWidth);
      if (ro) ro.disconnect();
    };
  }, [isRegister]);

  const [otpEmail, setOtpEmail] = useState<string | null>(null);
  const [emailErr, setEmailErr] = useState('');
  const [phoneErr, setPhoneErr] = useState('');
  const [nameErr, setNameErr] = useState('');
  const [lastNameErr, setLastNameErr] = useState('');
  const [shake, setShake] = useState<Record<string, number>>({});
  const [passwordErr, setPasswordErr] = useState('');

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
    setEmailErr(''); setPhoneErr(''); setNameErr(''); setLastNameErr(''); setPasswordErr('');
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const eErr = validateEmail(email, txt);
    const pErr = isRegister ? validatePhone(phone, txt) : '';
    const nErr = isRegister ? validateName(name, txt) : '';
    const lErr = isRegister ? validateLastName(lastName, txt) : '';
    const pwErr = isRegister ? validatePassword(password, txt) : validatePasswordLogin(password, txt);
    setEmailErr(eErr); setPhoneErr(pErr); setNameErr(nErr); setLastNameErr(lErr); setPasswordErr(pwErr);
    if (eErr || pErr || nErr || lErr || pwErr) {
      if (nErr) triggerShake('name');
      if (lErr) triggerShake('lastName');
      if (eErr) triggerShake('email');
      if (pErr) triggerShake('phone');
      if (pwErr) triggerShake('password');
      return;
    }
    setLoading(true);
    if (isRegister) {
      const rawPhone = phone.replace(/\s/g, '');
      const { error, otpEmail: pendingEmail } = await signUp(email, password, rawPhone, name.trim(), lastName.trim());
      if (error) toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
      else setOtpEmail(pendingEmail!);
    } else {
      const { error, code } = await signIn(email, password);
      if (error) {
        if (code === 'email_not_verified') setOtpEmail(email);
        else toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: txt.loginSuccess, description: txt.welcomeMsg });
        navigate(redirect, { replace: true });
      }
    }
    setLoading(false);
  };

  const handleVerified = () => {
    toast({ title: txt.accountVerified, description: txt.welcomeMsg });
    navigate(redirect, { replace: true });
  };

  const handleGoogleSuccess = async ({ credential }: CredentialResponse) => {
    if (!credential || googleLoading) {
      if (!credential) {
        toast({
          title: isRtl ? 'خطأ' : 'Erreur',
          description: isRtl ? 'لم يقم Google بتوفير رمز تسجيل الدخول.' : 'Google n’a pas fourni de jeton de connexion.',
          variant: 'destructive',
        });
      }
      return;
    }

    setGoogleLoading(true);
    const { error, code } = await signInWithGoogle(credential);
    setGoogleLoading(false);

    if (error) {
      const description = code === 'google_link_required'
        ? (isRtl ? 'يوجد حساب بالفعل بهذا البريد الإلكتروني. يرجى تسجيل الدخول بكلمة المرور أولاً.' : 'Un compte existe déjà avec cette adresse. Connectez-vous d’abord avec votre mot de passe.')
        : error.message;
      toast({
        title: isRtl ? 'تعذر تسجيل الدخول بـ Google' : 'Connexion Google impossible',
        description,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: isRtl ? 'تم تسجيل الدخول بنجاح!' : 'Connexion réussie !',
      description: isRtl ? 'مرحبًا بك في BookinGO.' : 'Bienvenue sur BookinGO.',
    });
    navigate(redirect, { replace: true });
  };

  const renderFormPanel = () => (
    <div dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="mb-3">
        <h1 className="text-2xl font-bold text-[#1775FF]">
          {isRegister ? txt.createAccount : txt.welcomeBack}
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          {isRegister
            ? txt.registerSubtitle
            : redirect !== '/' ? txt.loginSubtitleRedirect : txt.loginSubtitle}
        </p>
      </div>

      <div className="flex gap-1 p-1 rounded-xl mb-3" style={{ background: '#F0F2F8' }}>
        <button type="button" onClick={() => switchTab(false)}
          className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer"
          style={!isRegister
            ? { background: '#0865FE', color: '#fff', boxShadow: '0 2px 8px rgba(8,101,254,0.3)' }
            : { color: '#9CA3AF', background: 'transparent' }}>
          {txt.tabLogin}
        </button>
        <button type="button" onClick={() => switchTab(true)}
          className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer"
          style={isRegister
            ? { background: '#0865FE', color: '#fff', boxShadow: '0 2px 8px rgba(8,101,254,0.3)' }
            : { color: '#9CA3AF', background: 'transparent' }}>
          {txt.tabRegister}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2.5">
        {isRegister && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">{txt.firstName}</label>
              <div key={shake.name ?? 0} className={`flex items-center h-12 px-4 rounded-xl border-[1.5px] bg-gray-50 transition-all focus-within:bg-white ${nameErr ? 'border-red-400 bg-red-50 animate-shake' : 'border-gray-200 focus-within:border-blue-400'
                }`}>
                <input type="text" value={name}
                  onChange={e => { setName(e.target.value); if (nameErr) setNameErr(validateName(e.target.value, txt)); }}
                  onBlur={() => {
                    const err = validateName(name, txt);
                    setNameErr(err);
                    if (err) triggerShake('name');
                  }}
                  required placeholder={txt.firstNamePlaceholder}
                  className="flex-1 bg-transparent text-sm outline-none text-gray-800 placeholder:text-gray-400" />
              </div>
              {nameErr && <p className="text-[11px] text-red-500 pl-1">{nameErr}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">{txt.lastName}</label>
              <div key={shake.lastName ?? 0} className={`flex items-center h-12 px-4 rounded-xl border-[1.5px] bg-gray-50 transition-all focus-within:bg-white ${lastNameErr ? 'border-red-400 bg-red-50 animate-shake' : 'border-gray-200 focus-within:border-blue-400'
                }`}>
                <input type="text" value={lastName}
                  onChange={e => { setLastName(e.target.value); if (lastNameErr) setLastNameErr(validateLastName(e.target.value, txt)); }}
                  onBlur={() => {
                    const err = validateLastName(lastName, txt);
                    setLastNameErr(err);
                    if (err) triggerShake('lastName');
                  }}
                  required placeholder={txt.lastNamePlaceholder}
                  className="flex-1 bg-transparent text-sm outline-none text-gray-800 placeholder:text-gray-400" />
              </div>
              {lastNameErr && <p className="text-[11px] text-red-500 pl-1">{lastNameErr}</p>}
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">{txt.email}</label>
          <div key={shake.email ?? 0} className={`flex items-center h-12 px-4 rounded-xl border-[1.5px] bg-gray-50 transition-all focus-within:bg-white ${emailErr ? 'border-red-400 bg-red-50 animate-shake' : 'border-gray-200 focus-within:border-blue-400'
            }`}>
            <svg className="w-4 h-4 shrink-0 text-gray-400 me-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <input type="email" value={email}
              onChange={e => { setEmail(e.target.value); if (emailErr) setEmailErr(validateEmail(e.target.value, txt)); }}
              onBlur={() => {
                const err = validateEmail(email, txt);
                setEmailErr(err);
                if (err) triggerShake('email');
              }}
              required placeholder={txt.emailPlaceholder}
              className="flex-1 bg-transparent text-sm outline-none text-gray-800 placeholder:text-gray-400" />
          </div>
          {emailErr && <p className="text-[11px] text-red-500 pl-1">{emailErr}</p>}
        </div>

        {isRegister && (
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">{txt.phone}</label>
            <div key={shake.phone ?? 0} className={`flex items-center h-12 px-4 rounded-xl border-[1.5px] bg-gray-50 transition-all focus-within:bg-white ${phoneErr ? 'border-red-400 bg-red-50 animate-shake' : 'border-gray-200 focus-within:border-blue-400'
              }`}>
              <div className="flex items-center gap-1.5 px-2 h-full shrink-0 border-e border-gray-200 me-2" dir="ltr">
                <img
                  src="https://flagcdn.com/w40/dz.png"
                  alt="DZ"
                  className="w-5 h-3.5 object-cover rounded-xs"
                />
                <span className="text-xs font-semibold text-gray-600">+213</span>
              </div>
              <input type="tel" value={phone}
                onChange={e => { const fmt = formatDzPhone(e.target.value); setPhone(fmt); if (phoneErr) setPhoneErr(validatePhone(fmt, txt)); }}
                onBlur={() => {
                  const err = validatePhone(phone, txt);
                  setPhoneErr(err);
                  if (err) triggerShake('phone');
                }}
                placeholder={txt.phonePlaceholder}
                inputMode="numeric"
                dir="ltr"
                className="flex-1 bg-transparent text-sm outline-none text-gray-800 placeholder:text-gray-400" />
            </div>
            {phoneErr && <p className="text-[11px] text-red-500 pl-1">{phoneErr}</p>}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">{txt.password}</label>
          <div key={shake.password ?? 0} className={`flex items-center gap-2.5 h-12 px-4 rounded-xl border-[1.5px] bg-gray-50 transition-all focus-within:bg-white ${passwordErr ? 'border-red-400 bg-red-50 animate-shake' : 'border-gray-200 focus-within:border-blue-400'
            }`}>
            <svg className="w-4 h-4 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <input type={showPw ? 'text' : 'password'} value={password}
              onChange={e => {
                setPassword(e.target.value);
                if (passwordErr) setPasswordErr(isRegister ? validatePassword(e.target.value, txt) : validatePasswordLogin(e.target.value, txt));
              }}
              onBlur={() => {
                const err = isRegister ? validatePassword(password, txt) : validatePasswordLogin(password, txt);
                setPasswordErr(err);
                if (err) triggerShake('password');
              }}
              required placeholder={txt.passwordPlaceholder}
              className="flex-1 bg-transparent text-sm outline-none text-gray-800 placeholder:text-gray-400" />
            <button type="button" onClick={() => setShowPw(p => !p)}
              className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {isRegister && <PasswordStrengthMeter password={password} txt={txt} />}

          {passwordErr && <p className="text-[11px] text-red-500 pl-1 mt-1">{passwordErr}</p>}
        </div>

        {!isRegister && (
          <div className="text-end -mt-1">
            <button
              type="button"
              onClick={() => navigate('/forgot-password')}
              className="text-xs font-semibold hover:underline cursor-pointer"
              style={{ color: '#0865FE' }}
            >
              {txt.forgotPassword}
            </button>
          </div>
        )}

        <button type="submit" disabled={loading}
          className="w-full h-12 rounded-xl flex items-center justify-center gap-2 text-sm font-bold text-white disabled:opacity-60 hover:opacity-90 transition-all cursor-pointer"
          style={{ background: '#0865FE' }}>
          {loading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> {txt.loading}</>
            : <>{isRegister ? txt.submitRegister : txt.submitLogin} <ArrowRight className={cn("w-4 h-4", isRtl && "rotate-180")} /></>}
        </button>
      </form>

      {!isRegister && (
        <div className="mt-5">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium whitespace-nowrap">{txt.orContinueWith}</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
            <div
              ref={googleContainerRef}
              className={`mt-3 flex w-full justify-center overflow-hidden max-w-full [&>div]:max-w-full [&>div>iframe]:max-w-full ${googleLoading ? 'pointer-events-none opacity-60' : ''}`}
            >
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => toast({
                  title: isRtl ? 'تم إلغاء تسجيل الدخول بـ Google' : 'Connexion Google annulée',
                  description: isRtl ? 'أعد المحاولة أو استخدم بريدك الإلكتروني.' : 'Réessayez ou utilisez votre adresse e-mail.',
                  variant: 'destructive',
                })}
                text="continue_with"
                shape="rectangular"
                logo_alignment="center"
                width={String(googleBtnWidth)}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2.5 mt-3">
              <button
                type="button"
                disabled
                title={txt.soon}
                className="relative flex items-center justify-center gap-1.5 h-10 rounded-xl border border-gray-200 bg-gray-50 text-xs font-medium text-gray-400 cursor-not-allowed opacity-70"
              >
                <svg className="w-4 h-4 shrink-0 grayscale opacity-60" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google
                <span className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded-full bg-[#F5A623] text-white text-[9px] font-bold leading-none">
                  {txt.soon}
                </span>
              </button>
            </div>
          )}
        </div>
      )}

      <p className="text-center text-sm text-gray-500 mt-5">
        {isRegister ? txt.alreadyAccount : txt.noAccount}{' '}
        <button type="button" onClick={() => switchTab(!isRegister)}
          className="font-semibold hover:underline cursor-pointer" style={{ color: '#0865FE' }}>
          {isRegister ? txt.signInLink : txt.signUpLink}
        </button>
      </p>
    </div>
  );

  return (
    <>
      {/* MOBILE */}
      <div className="lg:hidden bg-[#0A1333] min-h-screen" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="relative w-full h-96 sm:h-80 overflow-hidden">
          <img
            src="/assets/login/login.png"
            alt=""
            className="w-full h-full object-cover scale-110"
          />
          <div className="absolute inset-0 bg-black/25" />
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/70 via-black/30 to-transparent pointer-events-none z-10" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0A1333] via-[#0A1333]/70 to-transparent" />

          <div className="absolute top-40 left-5 right-5 z-10">
            <h2 className="text-2xl font-bold leading-tight text-white drop-shadow-lg">
              {txt.heroTitle}<br />
              <span style={{ color: '#FFB400' }}>{txt.heroTitleHighlight}</span>
            </h2>
            <p className="text-sm mt-3 text-white/90 drop-shadow">
              {txt.heroSubtitle}
            </p>
          </div>
        </div>

        <div className="px-5 -mt-10 relative z-20 pb-10">
          <div className="bg-white rounded-3xl shadow-xl p-5">
            {otpEmail
              ? <OtpVerify email={otpEmail} onVerified={handleVerified} onBack={() => { setOtpEmail(null); setIsRegister(true); }} txt={txt} isRtl={isRtl} />
              : renderFormPanel()}
          </div>
        </div>
      </div>

      {/* DESKTOP */}
      <div
        className="hidden lg:flex relative items-center justify-end px-6 lg:px-20 py-10 h-screen"
        dir={isRtl ? 'rtl' : 'ltr'}
        style={{
          backgroundImage: "url('/assets/login/login.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/70 via-black/25 to-transparent pointer-events-none z-10" />
        <div className="flex flex-col justify-center max-w-md mr-auto text-white z-10 mb-32">
          <h2 className="text-4xl font-bold leading-tight">
            {txt.heroTitle}<br />
            <span style={{ color: '#FFB400' }}>{txt.heroTitleHighlight}</span>
          </h2>
          <p className="text-base mt-4 text-gray-100">
            {txt.heroSubtitle}
          </p>
        </div>

        <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-transparent pointer-events-none" />

        <div className="relative min-w-[500px] max-w-md bg-white rounded-xl shadow-2xl p-6">
          {otpEmail
            ? <OtpVerify email={otpEmail} onVerified={handleVerified} onBack={() => { setOtpEmail(null); setIsRegister(true); }} txt={txt} isRtl={isRtl} />
            : renderFormPanel()}
        </div>
      </div>
    </>
  );
};

export default Login;