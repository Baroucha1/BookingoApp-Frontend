import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  CheckCircle2, Lock, User, Mail, Phone, ShieldCheck,
  Eye, EyeOff, KeyRound, Check, Plane, FileCheck2, Wifi,
  CreditCard, Wallet, Bell, ChevronRight, ArrowLeft, LogOut,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { updateMe, changePassword, setPassword } from '../../hooks/useAuth.tsx';

const ClientProfile = () => {
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'overview' | 'info' | 'security'>('overview');

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
      toast({ title: 'Profil mis à jour', description: 'Vos informations ont été enregistrées avec succès.' });
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const savePassword = async () => {
    if (hasPassword === null) return;
    if ((hasPassword && !currentPassword) || !newPassword) {
      toast({ title: 'Champs manquants', description: 'Renseignez votre mot de passe actuel et le nouveau.', variant: 'destructive' });
      return;
    }
    if (newPassword.length < 8) {
      toast({ title: 'Mot de passe trop court', description: 'Le nouveau mot de passe doit contenir au moins 8 caractères.', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'Les mots de passe ne correspondent pas', description: 'Vérifiez la confirmation.', variant: 'destructive' });
      return;
    }

    setPwdLoading(true);
    try {
      if (!hasPassword) {
        await setPassword(newPassword);
        setHasPassword(true);
        toast({ title: 'Mot de passe créé', description: 'Vous pouvez maintenant vous connecter avec votre e-mail et ce mot de passe.' });
        setNewPassword('');
        setConfirmPassword('');
        return;
      }
      await changePassword(currentPassword, newPassword);
      toast({ title: 'Mot de passe modifié', description: 'Votre mot de passe a été mis à jour avec succès.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setActiveTab('overview');
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    } finally {
      setPwdLoading(false);
    }
  };

  const handleLogout = () => {
    signOut();
    navigate('/login');
  };

  const email = user?.email ?? '';
  const fullName = name && lastName ? `${name} ${lastName}` : email.split('@')[0];
  const initials = (name && lastName ? `${name[0]}${lastName[0]}` : email.slice(0, 2)).toUpperCase();

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Hero Header */}
      <div className="rounded-3xl overflow-hidden relative bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-700 text-white p-6 sm:p-8 shadow-sm">
        {/* Background decorative flight trails */}
        <Plane className="absolute top-6 right-8 w-28 h-28 text-white/10 -rotate-[15deg] pointer-events-none" strokeWidth={1} />
        <svg className="absolute bottom-0 right-32 w-48 h-24 text-white/10 pointer-events-none" viewBox="0 0 200 80" fill="none">
          <path d="M0 60 Q 70 10, 140 40 T 220 20" stroke="currentColor" strokeWidth="2" strokeDasharray="6 6" />
        </svg>

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-10">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 text-white flex items-center justify-center text-xl sm:text-2xl font-bold shrink-0 shadow-md">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold truncate tracking-tight">{fullName}</h1>
                {isVerified ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-400/20 text-emerald-300 border border-emerald-400/40 rounded-full px-2.5 py-0.5">
                    <CheckCircle2 className="w-3 h-3" /> Vérifié
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-amber-400/20 text-amber-200 border border-amber-400/40 rounded-full px-2.5 py-0.5">
                    <Sparkles className="w-3 h-3" /> Client
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-blue-100/90 truncate mt-0.5">{email}</p>
              {phone && <p className="text-xs text-blue-100/70 truncate mt-0.5">{phone}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 sm:pt-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab(activeTab === 'info' ? 'overview' : 'info')}
              className="bg-white/15 hover:bg-white/25 text-white border-white/25 rounded-xl text-xs font-medium h-9 backdrop-blur-sm"
            >
              <User className="w-3.5 h-3.5 mr-1.5" />
              {activeTab === 'info' ? 'Vue d\'ensemble' : 'Éditer le profil'}
            </Button>
          </div>
        </div>
      </div>



      {/* TAB 1: OVERVIEW (MOBILE-FIRST HUB) */}
      {activeTab === 'overview' && (
        <div className="space-y-5">

          {/* Quick Shortcuts Matrix */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link
              to="/client/flights"
              className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xs hover:border-blue-200 dark:hover:border-blue-800 transition-all flex flex-col items-center text-center gap-2 group"
            >
              <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Plane className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-xs sm:text-sm text-gray-900 dark:text-gray-100">Mes vols</p>
                <p className="text-[11px] text-gray-400">Billets & Horaires</p>
              </div>
            </Link>

            <Link
              to="/client/applications"
              className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xs hover:border-blue-200 dark:hover:border-blue-800 transition-all flex flex-col items-center text-center gap-2 group"
            >
              <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-xs sm:text-sm text-gray-900 dark:text-gray-100">Mes visas</p>
                <p className="text-[11px] text-gray-400">Suivi dossier</p>
              </div>
            </Link>

            <Link
              to="/client/esim"
              className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xs hover:border-blue-200 dark:hover:border-blue-800 transition-all flex flex-col items-center text-center gap-2 group"
            >
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Wifi className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-xs sm:text-sm text-gray-900 dark:text-gray-100">Mes eSIM</p>
                <p className="text-[11px] text-gray-400">Data mobile</p>
              </div>
            </Link>

            <Link
              to="/client/payments"
              className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xs hover:border-blue-200 dark:hover:border-blue-800 transition-all flex flex-col items-center text-center gap-2 group"
            >
              <div className="w-11 h-11 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-xs sm:text-sm text-gray-900 dark:text-gray-100">Paiements</p>
                <p className="text-[11px] text-gray-400">Reçus & Factures</p>
              </div>
            </Link>
          </div>

          {/* Group 1: Profil & Identité */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-xs">
            <div className="px-5 pt-4 pb-2">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Mon Compte & Paramètres</p>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              <button
                onClick={() => setActiveTab('info')}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors text-left"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Informations personnelles</p>
                    <p className="text-xs text-gray-400 truncate">{fullName} • {email}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
              </button>

              <button
                onClick={() => setActiveTab('security')}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors text-left"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center shrink-0">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Mot de passe & Sécurité</p>
                    <p className="text-xs text-gray-400">Modifier mon mot de passe d'accès</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
              </button>

              <Link
                to="/client/notifications"
                className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center shrink-0">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Notifications & Alertes</p>
                    <p className="text-xs text-gray-400">Mises à jour de vos vols et visas</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
              </Link>
            </div>
          </div>

          {/* Group 2: Finances & Demandes */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-xs">
            <div className="px-5 pt-4 pb-2">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Facturation & Règlements</p>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              <Link
                to="/client/payments"
                className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Historique des paiements</p>
                    <p className="text-xs text-gray-400">Consulter tous vos reçus de règlement</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
              </Link>

              <Link
                to="/client/custom-payments"
                className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center shrink-0">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Demandes de paiement</p>
                    <p className="text-xs text-gray-400">Règlements personnalisés en attente</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
              </Link>
            </div>
          </div>

          {/* Logout Section */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-xs">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-between p-4 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-left"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-600 flex items-center justify-center">
                  <LogOut className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-red-600">Se déconnecter</p>
                  <p className="text-xs text-red-400">Fermer la session sur cet appareil</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-red-400" />
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: INFORMATIONS PERSONNELLES */}
      {activeTab === 'info' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setActiveTab('overview')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 py-1"
            >
              <ArrowLeft className="w-4 h-4" /> Retour au compte
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <Card className="lg:col-span-2 rounded-3xl border-gray-100 dark:border-gray-800 dark:bg-gray-900 shadow-xs">
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  Informations personnelles
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-gray-600 dark:text-gray-300">Prénom</Label>
                    <div className="relative">
                      <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <Input
                        className="pl-10 rounded-xl h-12 border-gray-200 dark:border-gray-700 dark:bg-gray-800"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Votre prénom"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-gray-600 dark:text-gray-300">Nom</Label>
                    <div className="relative">
                      <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <Input
                        className="pl-10 rounded-xl h-12 border-gray-200 dark:border-gray-700 dark:bg-gray-800"
                        value={lastName}
                        onChange={e => setLastName(e.target.value)}
                        placeholder="Votre nom"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-gray-600 dark:text-gray-300">Email (non modifiable)</Label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <Input
                        className="pl-10 rounded-xl h-12 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-500"
                        type="email"
                        value={email}
                        disabled
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-gray-600 dark:text-gray-300">Numéro de téléphone</Label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <Input
                        className="pl-10 rounded-xl h-12 border-gray-200 dark:border-gray-700 dark:bg-gray-800"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="+33 6 12 34 56 78"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    onClick={saveProfile}
                    disabled={loading}
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl h-12 px-7 shadow-sm transition-colors"
                  >
                    {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="rounded-3xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <p className="font-bold text-sm text-blue-900 dark:text-blue-200">Confidentialité garantie</p>
                </div>
                <p className="text-xs sm:text-sm text-blue-800/80 dark:text-blue-300/80 leading-relaxed">
                  Vos coordonnées sont protégées selon les normes RGPD et ne sont partagées avec les compagnies aériennes et consulats que pour la validation de vos réservations.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-blue-200/50 dark:border-blue-800/50">
                <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-500" /> Données chiffrées de bout en bout
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MOT DE PASSE & SÉCURITÉ */}
      {activeTab === 'security' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setActiveTab('overview')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 py-1"
            >
              <ArrowLeft className="w-4 h-4" /> Retour au compte
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <Card className="lg:col-span-2 rounded-3xl border-gray-100 dark:border-gray-800 dark:bg-gray-900 shadow-xs">
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center">
                    <Lock className="w-4 h-4 text-amber-600" />
                  </div>
                  {hasPassword === false ? 'Créer un mot de passe' : 'Changer de mot de passe'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {hasPassword !== false && (
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-gray-600 dark:text-gray-300">Mot de passe actuel</Label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <Input
                        className="pl-10 pr-10 rounded-xl h-12 border-gray-200 dark:border-gray-700 dark:bg-gray-800"
                        type={showCurrent ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={currentPassword}
                        onChange={e => setCurrentPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrent(v => !v)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                      >
                        {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-gray-600 dark:text-gray-300">
                      {hasPassword === false ? 'Mot de passe' : 'Nouveau mot de passe'}
                    </Label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <Input
                        className="pl-10 pr-10 rounded-xl h-12 border-gray-200 dark:border-gray-700 dark:bg-gray-800"
                        type={showNew ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNew(v => !v)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                      >
                        {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-gray-600 dark:text-gray-300">Confirmer le mot de passe</Label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <Input
                        className="pl-10 pr-10 rounded-xl h-12 border-gray-200 dark:border-gray-700 dark:bg-gray-800"
                        type={showConfirm ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(v => !v)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                      >
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    onClick={savePassword}
                    disabled={pwdLoading || hasPassword === null}
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl h-12 px-7 shadow-sm transition-colors"
                  >
                    {pwdLoading
                      ? 'Modification en cours...'
                      : hasPassword === false
                      ? 'Créer mon mot de passe'
                      : 'Changer le mot de passe'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="rounded-3xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/50 p-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <p className="font-bold text-sm text-amber-900 dark:text-amber-200">Recommandations</p>
              </div>
              <ul className="space-y-2.5">
                <li className="flex items-start gap-2 text-xs text-amber-900/80 dark:text-amber-300">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  Au moins 8 caractères
                </li>
                <li className="flex items-start gap-2 text-xs text-amber-900/80 dark:text-amber-300">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  Mélangez lettres majuscules et chiffres
                </li>
                <li className="flex items-start gap-2 text-xs text-amber-900/80 dark:text-amber-300">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  Ne réutilisez pas le même mot de passe
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientProfile;