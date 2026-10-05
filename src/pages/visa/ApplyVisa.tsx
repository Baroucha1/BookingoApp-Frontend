import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Upload, CheckCircle2, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/i18n/LanguageContext.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Label } from '@/components/ui/label.tsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.tsx';
import { useToast } from '@/hooks/use-toast.ts';
import { cn } from '@/lib/utils.ts';

import { useAuth } from '@/hooks/useAuth.tsx';
import { parseRequirements, getDocLabel, DEFAULT_REQUIREMENTS, type DocumentRequirement } from '@/lib/visaDocuments.ts';

interface VisaTypeDB {
  id: string;
  country_name_fr: string;
  country_name_en: string;
  country_name_ar: string;
  country_code: string;
  visa_type_name_fr: string;
  visa_type_name_en: string;
  visa_type_name_ar: string;
  price: number;
  currency: string;
  stay_duration: number;
  processing_time: string;
  requirements: unknown;
}

const stepKeys = ['personalInfo', 'travelDetails', 'documents', 'reviewSubmit'] as const;

const ApplyVisa = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [visaTypes, setVisaTypes] = useState<VisaTypeDB[]>([]);
  const [selectedVisaId, setSelectedVisaId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [passportNumber, setPassportNumber] = useState('');
  const [travelDate, setTravelDate] = useState('');

  // Document uploads keyed by requirement key
  const [docFiles, setDocFiles] = useState<Record<string, File>>({});
  const [docPaths, setDocPaths] = useState<Record<string, string>>({});
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});



  // Auto-fill account info if logged in or when token info loads
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (user) {
      const full = [user.name, user.lastName].filter(Boolean).join(' ');
      if (full) setFullName(prev => prev || full);
      if (user.email) setEmail(prev => prev || user.email);
      if (user.phone) setPhone(prev => prev || user.phone || '');
    }
    if (token) {
      fetch(`${import.meta.env.VITE_API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (!data) return;
          const full = [data.name, data.lastName].filter(Boolean).join(' ');
          if (full) setFullName(prev => prev || full);
          if (data.email) setEmail(prev => prev || data.email);
          if (data.phone) setPhone(prev => prev || data.phone);
          if (data.profile?.passportNumber) setPassportNumber(prev => prev || data.profile.passportNumber);
        })
        .catch(() => {});
    }
  }, [user]);

  // Fetch visa types
  useEffect(() => {
    const fetchVisas = async () => {
      if (!slug) return;
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/visa-types?slug=${slug}`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setVisaTypes(data);
        const preselected = searchParams.get('visa');
        const found = data.find((d: VisaTypeDB) => d.id === preselected);
        setSelectedVisaId(found ? found.id : data[0].id);
      }
      setLoading(false);
    };
    fetchVisas();
  }, [slug, searchParams]);

  // Prefill from Auth + profile
  useEffect(() => {
    if (!user) return;
    setEmail(user.email ?? '');
  }, [user]);

  if (loading) return <div className="container py-20 text-center text-muted-foreground">Loading...</div>;


  if (visaTypes.length === 0) {
    return (
      <div className="container py-20 text-center">
        <p className="text-muted-foreground">Country not found</p>
        <Link to="/destinations"><Button className="mt-4">{t('destinations')}</Button></Link>
      </div>
    );
  }

  const selected = visaTypes.find(v => v.id === selectedVisaId) || visaTypes[0];
  const countryName = language === 'ar' ? selected.country_name_ar : language === 'fr' ? selected.country_name_fr : selected.country_name_en;
  const visaName = language === 'ar' ? selected.visa_type_name_ar : language === 'fr' ? selected.visa_type_name_fr : selected.visa_type_name_en;

  // Resolve requirements for the selected visa type (fallback to defaults)
  const requirements: DocumentRequirement[] = (() => {
    const parsed = parseRequirements(selected.requirements);
    return parsed.length ? parsed : DEFAULT_REQUIREMENTS;
  })();
  const uploadableReqs = requirements.filter(r => r.uploadable);
  const infoReqs = requirements.filter(r => !r.uploadable);

  // Validation per step
  const isPersonalValid = fullName.trim() && email.trim() && phone.trim() && passportNumber.trim();
  const isTravelValid = !!travelDate;
  const isDocumentsValid = uploadableReqs.every(r => !!docPaths[r.key]);

  const requiredMsg = (label: string) =>
    language === 'fr' ? `${label} est requis` : language === 'ar' ? `${label} مطلوب` : `${label} is required`;

  const handleNext = () => {
    if (currentStep === 0 && !isPersonalValid) {
      toast({
        title: language === 'fr' ? 'Champs obligatoires' : language === 'ar' ? 'حقول مطلوبة' : 'Required fields',
        description: language === 'fr'
          ? 'Veuillez remplir toutes les informations personnelles.'
          : language === 'ar'
          ? 'يرجى ملء جميع المعلومات الشخصية.'
          : 'Please fill in all personal information.',
        variant: 'destructive',
      });
      return;
    }
    if (currentStep === 1 && !isTravelValid) {
      toast({
        title: requiredMsg(t('travelDate')),
        variant: 'destructive',
      });
      return;
    }
    if (currentStep === 2 && !isDocumentsValid) {
      const missing = uploadableReqs.find(r => !docPaths[r.key]);
      toast({
        title: requiredMsg(missing ? getDocLabel(missing.key, language as 'fr' | 'en' | 'ar') : t('documents')),
        variant: 'destructive',
      });
      return;
    }
    setCurrentStep(currentStep + 1);
  };

  const handleDocSelect = async (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large (max 5MB)', variant: 'destructive' });
      return;
    }
    setDocFiles(prev => ({ ...prev, [key]: file }));
    setDocPaths(prev => ({ ...prev, [key]: file.name }));
    toast({ title: language === 'fr' ? 'Document sélectionné' : 'Document selected' });
  };

  const handleSubmit = async () => {
    if (!isPersonalValid || !isTravelValid || !isDocumentsValid) {
      toast({ title: language === 'fr' ? 'Formulaire incomplet' : 'Incomplete form', variant: 'destructive' });
      return;
    }
    const token = localStorage.getItem('token');
    if (!token && !user) {
      toast({
        title: language === 'fr' ? 'Connexion requise' : language === 'ar' ? 'تسجيل الدخول مطلوب' : 'Login required',
        description: language === 'fr' ? 'Veuillez vous connecter pour envoyer votre demande de visa.' : 'Please log in to submit your visa application.',
        variant: 'destructive',
      });
      navigate('/login?redirect=' + encodeURIComponent(window.location.pathname + window.location.search));
      return;
    }
    setSubmitting(true);
    const form = new FormData();
    form.append('visaTypeId', selected.id);
    form.append('fullName', fullName);
    form.append('email', email);
    form.append('phone', phone);
    form.append('passportNumber', passportNumber);
    form.append('travelDate', travelDate);
    Object.entries(docFiles).forEach(([key, file]) => form.append(key, file));

    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/applications`, {
      method: 'POST',
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: form,
    });
    setSubmitting(false);
    if (!res.ok) {
      const err = await res.json();
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
      return;
    }
    toast({ title: t('submit'), description: language === 'fr' ? 'Demande soumise avec succès!' : 'Application submitted!' });
    if (user) {
      navigate('/client/applications');
    } else {
      navigate('/visa');
    }
  };

  const req = <span className="text-destructive ml-0.5">*</span>;

  return (
    <div
      className="container max-w-2xl px-4 pb-6 sm:pb-10"
      style={{
        paddingTop: 'calc(max(env(safe-area-inset-top, 0px), 48px) + 0.75rem)',
        paddingBottom: 'calc(max(env(safe-area-inset-bottom, 0px), 20px) + 2rem)',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
      }}
    >
      <button
        type="button"
        onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/visa')}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 text-gray-700 hover:text-[#0865FE] hover:border-[#0865FE]/30 font-semibold text-xs shadow-xs hover:shadow-sm transition-all mb-6 cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>{countryName ? `Retour à ${countryName}` : 'Retour aux visas'}</span>
      </button>

      <h1 className="text-2xl font-bold mb-1">{t('applyNow')} - {countryName}</h1>
      <p className="text-sm text-muted-foreground mb-6">{visaName}</p>

      {visaTypes.length > 1 && (
        <div className="mb-6">
          <Label>{language === 'ar' ? 'نوع التأشيرة' : language === 'fr' ? 'Type de visa' : 'visa type'}</Label>
          <Select value={selectedVisaId} onValueChange={setSelectedVisaId}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {visaTypes.map(vt => {
                const vtName = language === 'ar' ? vt.visa_type_name_ar : language === 'fr' ? vt.visa_type_name_fr : vt.visa_type_name_en;
                return <SelectItem key={vt.id} value={vt.id}>{vtName} — {vt.price.toLocaleString()} {vt.currency}</SelectItem>;
              })}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex items-center gap-1 mb-8">
        {stepKeys.map((step, i) => (
          <div key={step} className="flex-1 flex items-center">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0",
              i <= currentStep ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}>
              {i + 1}
            </div>
            {i < stepKeys.length - 1 && (
              <div className={cn("flex-1 h-1 mx-1 rounded", i < currentStep ? "bg-primary" : "bg-muted")} />
            )}
          </div>
        ))}
      </div>

      <motion.div key={currentStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
        {currentStep === 0 && (
          <Card>
            <CardHeader><CardTitle>{t('personalInfo')}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('fullName')}{req}</Label>
                  <Input required value={fullName} onChange={e => setFullName(e.target.value)} placeholder="John Doe" />
                </div>
                <div className="space-y-2">
                  <Label>{t('passportNumber')}{req}</Label>
                  <Input required value={passportNumber} onChange={e => setPassportNumber(e.target.value)} placeholder="A12345678" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('email')}{req}</Label>
                  <Input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" />
                </div>
                <div className="space-y-2">
                  <Label>{t('phone')}{req}</Label>
                  <Input required value={phone} onChange={e => setPhone(e.target.value)} placeholder="+213 ..." />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {language === 'fr'
                  ? 'Les informations sont pré-remplies depuis votre compte. Vérifiez et corrigez si besoin.'
                  : language === 'ar'
                  ? 'تم ملء البيانات تلقائيًا من حسابك. تحقق منها وعدّلها إذا لزم الأمر.'
                  : 'Information is prefilled from your account. Review and edit if needed.'}
              </p>
            </CardContent>
          </Card>
        )}

        {currentStep === 1 && (
          <Card>
            <CardHeader><CardTitle>{t('travelDetails')}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t('travelDate')}{req}</Label>
                <Input required type="date" value={travelDate} onChange={e => setTravelDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 2 && (
          <Card>
            <CardHeader><CardTitle>{t('documents')}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {requirements.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  {language === 'fr' ? 'Aucun document requis pour ce visa.' : language === 'ar' ? 'لا توجد مستندات مطلوبة.' : 'No documents required.'}
                </p>
              )}

              {/* Uploadable documents */}
              {uploadableReqs.map(req => {
                const label = getDocLabel(req.key, language as 'fr' | 'en' | 'ar');
                const path = docPaths[req.key];
                const file = docFiles[req.key];
                const isUploading = uploadingKey === req.key;
                return (
                  <div key={req.key}>
                    <input
                      ref={(el) => { fileInputRefs.current[req.key] = el; }}
                      type="file"
                      accept="application/pdf,image/jpeg,image/png"
                      className="hidden"
                      onChange={(e) => handleDocSelect(req.key, e)}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRefs.current[req.key]?.click()}
                      disabled={isUploading}
                      className={cn(
                        "w-full border-2 border-dashed rounded-xl p-6 text-center transition-colors",
                        path ? "border-accent bg-accent/5" : "border-input hover:border-primary/50",
                        isUploading && "opacity-60 cursor-wait"
                      )}
                    >
                      {isUploading ? (
                        <Loader2 className="w-8 h-8 mx-auto text-muted-foreground mb-2 animate-spin" />
                      ) : path ? (
                        <CheckCircle2 className="w-8 h-8 mx-auto text-accent mb-2" />
                      ) : (
                        <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                      )}
                      <p className="text-sm font-medium">
                        {label}<span className="text-destructive ml-0.5">*</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {file ? file.name : 'PDF, JPG, PNG (max 5MB)'}
                      </p>
                    </button>
                  </div>
                );
              })}

              {/* Info-only documents */}
              {infoReqs.map(req => (
                <div key={req.key} className="border rounded-xl p-4 bg-muted/40 flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-accent mt-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{getDocLabel(req.key, language as 'fr' | 'en' | 'ar')}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {language === 'fr'
                        ? 'Document requis — à fournir ultérieurement (pas d\'upload nécessaire ici)'
                        : language === 'ar'
                        ? 'مستند مطلوب — يُقدَّم لاحقًا (لا حاجة للرفع هنا)'
                        : 'Required document — to be provided later (no upload needed here)'}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {currentStep === 3 && (
          <Card>
            <CardHeader><CardTitle>{t('reviewSubmit')}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted rounded-xl p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('destinations')}</span>
                  <span className="font-medium">{countryName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-medium">{visaName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('fullName')}</span>
                  <span className="font-medium">{fullName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('passportNumber')}</span>
                  <span className="font-medium">{passportNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('travelDate')}</span>
                  <span className="font-medium">{travelDate}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('price')}</span>
                  <span className="font-bold text-primary">{selected.price.toLocaleString()} {selected.currency}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('stayDuration')}</span>
                  <span>{selected.stay_duration} {t('days')}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>

      <div className="flex justify-between mt-6">
        {currentStep > 0 ? (
          <Button
            variant="outline"
            onClick={() => setCurrentStep(currentStep - 1)}
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            {t('previous')}
          </Button>
        ) : (
          <div />
        )}
        {currentStep < stepKeys.length - 1 ? (
          <Button onClick={handleNext}>{t('next')}</Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {t('submit')} →
          </Button>
        )}
      </div>
    </div>
  );
};

export default ApplyVisa;
