import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  CheckCircle2, Lock, User, Mail, Phone, ShieldCheck,
  Eye, EyeOff, KeyRound, Check, Plane,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { updateMe, changePassword, setPassword } from '../../hooks/useAuth.tsx';
import { useLanguage } from '@/i18n/LanguageContext';

const ClientProfile = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuth();

  const [phone, setPhone]           = useState('');
  const [name, setName]             = useState(user?.name ?? '');
  const [lastName, setLastName]     = useState(user?.lastName ?? '');
  const [isVerified, setIsVerified] = useState(false);
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);
  const [loading, setLoading]       = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdLoading, setPwdLoading]           = useState(false);

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem('token');
    fetch(`${import.meta.env.VITE_API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
        .then(r => r.json())
        .then(data => {
          setPhone(data.phone ?? '');
          setIsVerified(data.profile?.isVerified ?? false);
          setHasPassword(Boolean(data.hasPassword));
        });
  }, [user]);

  useEffect(() => {
    if (user) { setName(user.name); setLastName(user.lastName); }
  }, [user]);

  const saveProfile = async () => {
    setLoading(true);
    try {
      await updateMe({ phone, name, lastName });
      toast({ title: t('profileUpdated'), description: t('profileSaved') });
    } catch (err: any) {
      toast({ title: t('profileError'), description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const savePassword = async () => {
    if (hasPassword === null) return;
    if ((hasPassword && !currentPassword) || !newPassword) {
      toast({ title: t('profileMissingFields'), description: t('profileMissingFieldsDescription'), variant: 'destructive' });
      return;
    }
    if (newPassword.length < 8) {
      toast({ title: t('profilePasswordTooShort'), description: t('profilePasswordTooShortDescription'), variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: t('profilePasswordsMismatch'), description: t('profilePasswordsMismatchDescription'), variant: 'destructive' });
      return;
    }

    setPwdLoading(true);
    try {
      if (!hasPassword) {
        await setPassword(newPassword);
        setHasPassword(true);
        toast({ title: t('profilePasswordCreated'), description: t('profilePasswordCreatedDescription') });
        setNewPassword('');
        setConfirmPassword('');
        return;
      }
      await changePassword(currentPassword, newPassword);
      toast({ title: t('profilePasswordChanged'), description: t('profilePasswordChangedDescription') });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast({ title: t('profileError'), description: err.message, variant: 'destructive' });
    } finally {
      setPwdLoading(false);
    }
  };

  const email = user?.email ?? '';
  const fullName = name && lastName ? `${name} ${lastName}` : email.split('@')[0];
  const initials = (name && lastName ? `${name[0]}${lastName[0]}` : email.slice(0, 2)).toUpperCase();

  return (
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Hero */}
        <div className="rounded-3xl overflow-hidden relative bg-gradient-to-r from-amber-50 via-amber-50 to-orange-100 p-6 lg:p-8">
          <Plane className="absolute top-8 right-16 w-20 h-20 text-amber-400 -rotate-[10deg]" strokeWidth={1.5} />
          <svg className="absolute top-10 right-56 w-24 h-16 text-amber-300" viewBox="0 0 100 60" fill="none">
            <path d="M2 50 Q 30 10, 60 30 T 98 15" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" />
          </svg>
          <div className="relative flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold shrink-0">
              {initials}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{fullName}</h2>
              <p className="text-sm text-gray-500">{email}</p>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 rounded-full px-3">
                  <User className="w-3 h-3 mr-1" /> {t('profileClientRole')}
                </Badge>
                {isVerified && (
                    <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200 rounded-full px-3">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> {t('profileVerified')}
                    </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Informations personnelles */}
          <Card className="lg:col-span-2 rounded-2xl border-gray-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
                  <User className="w-4 h-4 text-amber-600" />
                </div>
                {t('profilePersonalInfo')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm text-gray-600">{t('profileFirstName')}</Label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <Input
                        className="pl-10 rounded-xl h-11 border-gray-200"
                        value={name}
                        onChange={e => setName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-gray-600">{t('profileLastName')}</Label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <Input
                        className="pl-10 rounded-xl h-11 border-gray-200"
                        value={lastName}
                        onChange={e => setLastName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-gray-600">{t('profileEmail')}</Label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <Input
                        className="pl-10 rounded-xl h-11 border-gray-200 bg-gray-50"
                        type="email"
                        value={email}
                        disabled
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-gray-600">{t('profilePhone')}</Label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <Input
                        className="pl-10 rounded-xl h-11 border-gray-200"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <Button
                  onClick={saveProfile}
                  disabled={loading}
                  className="bg-amber-400 hover:bg-amber-500 text-gray-900 font-semibold rounded-xl h-11 px-6"
              >
                {loading ? t('profileSaving') : t('profileSaveChanges')}
              </Button>
            </CardContent>
          </Card>

          {/* Confidentialité */}
          <div className="rounded-2xl bg-amber-50 border border-amber-100 p-5">
            <div className="flex items-center gap-2 mb-2.5">
              <div className="w-7 h-7 rounded-full bg-amber-400 flex items-center justify-center">
                <ShieldCheck className="w-3.5 h-3.5 text-white" />
              </div>
              <p className="font-semibold text-sm text-amber-700">{t('profilePrivacyTitle')}</p>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              {t('profilePrivacyDescription')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Mot de passe */}
          <Card className="lg:col-span-2 rounded-2xl border-gray-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Lock className="w-4 h-4 text-amber-600" />
                </div>
                {hasPassword === false ? t('profileCreatePassword') : t('profilePasswordTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {hasPassword !== false && (
              <div className="space-y-2">
                <Label className="text-sm text-gray-600">{t('profileCurrentPassword')}</Label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <Input
                      className="pl-10 pr-10 rounded-xl h-11 border-gray-200"
                      type={showCurrent ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                  />
                  <button
                      type="button"
                      onClick={() => setShowCurrent(v => !v)}
                      aria-label={showCurrent ? t('profileHidePassword') : t('profileShowPassword')}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm text-gray-600">{t('profileNewPassword')}</Label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <Input
                        className="pl-10 pr-10 rounded-xl h-11 border-gray-200"
                        type={showNew ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                    />
                    <button
                        type="button"
                        onClick={() => setShowNew(v => !v)}
                        aria-label={showNew ? t('profileHidePassword') : t('profileShowPassword')}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-gray-600">{t('profileConfirmNewPassword')}</Label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <Input
                        className="pl-10 pr-10 rounded-xl h-11 border-gray-200"
                        type={showConfirm ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirm(v => !v)}
                        aria-label={showConfirm ? t('profileHidePassword') : t('profileShowPassword')}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <Button
                  onClick={savePassword}
                  disabled={pwdLoading || hasPassword === null}
                  className="bg-amber-400 hover:bg-amber-500 text-gray-900 font-semibold rounded-xl h-11 px-6"
              >
                {pwdLoading ? t('profilePasswordSaving') : hasPassword === false ? t('profileCreatePasswordButton') : t('profileChangePassword')}
              </Button>
            </CardContent>
          </Card>

          {/* Conseils de sécurité */}
          <div className="rounded-2xl bg-amber-50 border border-amber-100 p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-full bg-amber-400 flex items-center justify-center">
                <KeyRound className="w-3.5 h-3.5 text-white" />
              </div>
              <p className="font-semibold text-sm text-amber-700">{t('profileSecurityTips')}</p>
            </div>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-sm text-gray-600">
                <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                {t('profileTipPasswordLength')}
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-600">
                <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                {t('profileTipLettersNumbers')}
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-600">
                <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                {t('profileTipAvoidPersonalInfo')}
              </li>
            </ul>
          </div>
        </div>
      </div>
  );
};

export default ClientProfile;
