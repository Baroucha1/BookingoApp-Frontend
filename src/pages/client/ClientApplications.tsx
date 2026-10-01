import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Eye, FileText, CheckCircle2, Clock, AlertCircle,
  XCircle, Plane, ExternalLink, Upload, Loader2,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { VisaApplication, VisaTypeDocumentRequirement, Passenger, ApplicationStatus, PaymentStatus } from '@/lib/types';
import { getApplicationsByClient } from '@/service/visaApplication.service.ts';
import { initiateSatimPayment } from '@/service/payment.service';
import { useLanguage } from '@/i18n/LanguageContext';
import type { TranslationKey } from '@/i18n/translations';

const API = import.meta.env.VITE_API_URL;

type ApplyDraft = {
  step:          number;
  countryCode:   string;
  visaTypeId:    string;
  email:         string;
  phone:         string;
  startDate:     string;
  numberOfPeople: number;
  passengers:    any[];
};

const APP_STATUS_LABEL: Record<ApplicationStatus, TranslationKey> = {
  PENDING:      'clientStatusPending',
  UNDER_REVIEW: 'clientStatusUnderReview',
  APPROVED:     'approved',
  REJECTED:     'rejected',
  CANCELLED:    'clientStatusCancelled',
};
const APP_STATUS_COLOR: Record<ApplicationStatus, string> = {
  PENDING:      'bg-yellow-100 text-yellow-800 border-yellow-300',
  UNDER_REVIEW: 'bg-blue-100   text-blue-800   border-blue-300',
  APPROVED:     'bg-green-100  text-green-800  border-green-300',
  REJECTED:     'bg-red-100    text-red-800    border-red-300',
  CANCELLED:    'bg-gray-100   text-gray-800   border-gray-300',
};
const PAYMENT_STATUS_COLOR: Record<PaymentStatus, string> = {
  PENDING:  'bg-yellow-100 text-yellow-800 border-yellow-300',
  PAID:     'bg-green-100  text-green-800  border-green-300',
  FAILED:   'bg-red-100    text-red-800    border-red-300',
  REFUNDED: 'bg-orange-100 text-orange-800 border-orange-300',
};
const PAYMENT_STATUS_LABEL: Record<PaymentStatus, TranslationKey> = {
  PENDING: 'clientStatusPending',
  PAID: 'paid',
  FAILED: 'clientAppsPaymentFailed',
  REFUNDED: 'clientAppsRefunded',
};

const PAYMENT_METHOD_LABEL: Record<string, TranslationKey> = {
  STRIPE: 'clientAppsMethodStripe',
  SATIM: 'clientAppsMethodSatim',
  BANK_TRANSFER: 'clientAppsMethodBankTransfer',
  CASH: 'clientAppsMethodCash',
};

// ── Document row with upload / replace ───────────────────────────────────────
const DocRow = ({
                  app, passenger, req,
                  onUploaded,
                }: {
  app: VisaApplication;
  passenger: Passenger;
  req: VisaTypeDocumentRequirement;
  onUploaded: (passengerId: string, requirementId: string, doc: any) => void;
}) => {

  const { t, language } = useLanguage();
  const { toast }  = useToast();
  const inputRef   = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);


  const uploaded = passenger.documents.find(d => d.requirementId === req.id);
  const canEdit = app.status === 'PENDING';

  const handleFile = async (file: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const token    = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);

      const res  = await fetch(
          `${API}/api/applications/${app.id}/passengers/${passenger.id}/documents/${req.id}`,
          { method: 'PATCH', headers: { Authorization: `Bearer ${token}` }, body: formData },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? t('clientAppsUploadError'));
      onUploaded(passenger.id, req.id, data.data);
      toast({ title: uploaded ? t('clientAppsDocumentReplaced') : t('clientAppsDocumentUploaded'), description: file.name });
    } catch (err: any) {
      toast({ title: t('profileError'), description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  return (
      <div className="border rounded-xl p-3 flex items-center gap-3 text-sm transition-all"
           style={{ borderColor: uploaded ? 'rgba(16,185,129,0.35)' : 'rgba(8,101,254,0.15)', background: uploaded ? 'rgba(16,185,129,0.03)' : '#fff' }}>

        {/* Hidden file input */}
        <input
            ref={inputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
        />

        {/* Icon */}
        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white shrink-0"
             style={{ background: uploaded ? '#10B981' : 'linear-gradient(135deg, #0865FE, #3B2F7E)' }}>
          {uploaded ? <CheckCircle2 className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
        </div>

        {/* Label + passenger */}
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">
            {language === 'en' ? req.documentType.labelEn : language === 'ar' ? req.documentType.labelAr : req.documentType.labelFr}
            {!req.isRequired && <span className="ml-1 text-xs text-muted-foreground">{t('clientAppsOptional')}</span>}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {passenger.firstName} {passenger.lastName}
            {uploaded && <span className="ml-1">· {uploaded.originalName}</span>}
          </p>
        </div>

        {/* Verification badge */}
        {uploaded && (
            uploaded.isVerified
                ? <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full shrink-0">{t('clientAppsVerified')}</span>
                : <Clock className="w-4 h-4 text-muted-foreground shrink-0" title={t('clientAppsPendingVerification')} />
        )}

        {/* View link */}
        {uploaded && (
            <a href={uploaded.fileUrl} target="_blank" rel="noreferrer" className="shrink-0">
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground hover:text-primary" />
            </a>
        )}

        {/* Upload / Replace button */}
        {canEdit && (
            <Button
                size="sm"
                variant={uploaded ? 'outline' : 'default'}
                disabled={uploading}
                onClick={() => inputRef.current?.click()}
                className="shrink-0"
                style={!uploaded ? { background: 'linear-gradient(135deg, #0865FE, #3B2F7E)', color: '#fff' } : undefined}
            >
              {uploading
                  ? <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> {t('clientAppsUploading')}</>
                  : <><Upload className="w-3.5 h-3.5 mr-1" />{uploaded ? t('clientAppsReplace') : t('clientAppsUpload')}</>}
            </Button>
        )}
      </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const ClientApplications = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [selected, setSelected]         = useState<VisaApplication | null>(null);
  const [loading, setLoading]           = useState(true);
  const [applications, setApplications] = useState<VisaApplication[]>([]);
  const [error, setError]               = useState<string | null>(null);
  const [draft, setDraft] = useState<ApplyDraft | null>(null);
  const navigate = useNavigate();
  const { toast }     = useToast();
  const [captchaModal, setCaptchaModal]     = useState<string | null>(null); // holds applicationId
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [submitting, setSubmitting]           = useState(false);
  const recaptchaRef                          = useRef<HTMLDivElement>(null);
  const recaptchaWidgetId                     = useRef<number | null>(null);
  const dateLocale = language === 'ar' ? 'ar-DZ' : language === 'en' ? 'en-US' : 'fr-FR';

  const [payingId, setPayingId] = useState<string | null>(null);

  const handlePayNow = (applicationId: string) => {
    navigate(`/client/pay/${applicationId}`);
  };


  useEffect(() => {
    try {
      const raw = localStorage.getItem('apply_draft');
      if (!raw) return;
      const parsed: ApplyDraft = JSON.parse(raw);
      // Only show if the draft has meaningful data (at least a visa selected)
      if (parsed.visaTypeId && parsed.countryCode) setDraft(parsed);
    } catch { /* ignore */ }
  }, []);

  const discardDraft = () => {
    localStorage.removeItem('apply_draft');
    setDraft(null);
  };

  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem('token');
    fetch(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(me => {
          const clientId = me.profile?.id;
          if (!clientId) throw new Error('Profil client introuvable');
          return getApplicationsByClient(clientId);
        })
        .then(data => { if (data) setApplications(data.data); })
        .catch(err => setError(err.message ?? 'Une erreur est survenue'))
        .finally(() => setLoading(false));
  }, [user]);

  // Update a single document in state after upload without re-fetching everything
  const handleDocUploaded = (passengerId: string, requirementId: string, newDoc: any) => {
    const patch = (app: VisaApplication): VisaApplication => ({
      ...app,
      passengers: app.passengers.map(p => {
        if (p.id !== passengerId) return p;
        const exists = p.documents.find(d => d.requirementId === requirementId);
        return {
          ...p,
          documents: exists
              ? p.documents.map(d => d.requirementId === requirementId ? newDoc : d)
              : [...p.documents, newDoc],
        };
      }),
    });
    setApplications(prev => prev.map(a => a.id === selected?.id ? patch(a) : a));
    setSelected(prev => prev ? patch(prev) : null);
  };

  // reCAPTCHA script loader
  useEffect(() => {
    if (document.getElementById('recaptcha-script')) return;
    const script = document.createElement('script');
    script.id  = 'recaptcha-script';
    script.src = 'https://www.google.com/recaptcha/api.js?render=explicit';
    script.async = true; script.defer = true;
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!captchaModal) return;
    const tryRender = () => {
      if (!window.grecaptcha || !recaptchaRef.current) { setTimeout(tryRender, 300); return; }
      if (recaptchaWidgetId.current !== null) return;
      recaptchaWidgetId.current = window.grecaptcha.render(recaptchaRef.current, {
        sitekey:           import.meta.env.VITE_RECAPTCHA_SITE_KEY,
        callback:          () => setCaptchaVerified(true),
        'expired-callback': () => setCaptchaVerified(false),
      });
    };
    setTimeout(tryRender, 300);
  }, [captchaModal]);

  const handleConfirmPay = async () => {
    if (!captchaModal) return;
    setSubmitting(true);
    try {
      const captchaToken = window.grecaptcha.getResponse(recaptchaWidgetId.current);
      if (!captchaToken) {
        toast({ title: t('clientAppsRecaptchaRequired'), description: t('clientAppsRecaptchaDescription'), variant: 'destructive' });
        return;
      }
      const { formUrl } = await initiateSatimPayment(captchaModal, captchaToken);
      window.location.href = formUrl;
    } catch (err: any) {
      toast({ title: t('clientAppsPaymentError'), description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };
  return (
      <div className="space-y-6">
        {error && <div className="text-center py-8 text-destructive text-sm">{error}</div>}

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{t('clientAppsDescription')}</p>
          <Button asChild className="bg-gradient-primary">
            <Link to="/apply"><Plane className="w-4 h-4 mr-2" /> {t('clientAppsNewApplication')}</Link>
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('clientAppsReference')}</TableHead>
                  <TableHead>{t('clientAppsCountry')}</TableHead>
                  <TableHead>{t('clientAppsVisa')}</TableHead>
                  <TableHead>{t('clientAppsTravelers')}</TableHead>
                  <TableHead>{t('clientAppsDate')}</TableHead>
                  <TableHead>{t('clientAppsApplicationStatus')}</TableHead>
                  <TableHead>{t('clientAppsPaymentStatus')}</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Draft row */}
                {draft && (
                    <TableRow className="bg-amber-50 hover:bg-amber-100 border-l-4 border-l-amber-400">
                      <TableCell className="font-mono text-xs text-muted-foreground italic">{t('clientAppsDraft')}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <img
                              src={`https://flagcdn.com/w40/${draft.countryCode}.png`}
                              alt=""
                              className="w-6 h-6 rounded-full object-cover"
                          />
                          <span className="uppercase text-sm font-medium">{draft.countryCode}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground italic">—</TableCell>
                      <TableCell>{draft.numberOfPeople}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {draft.startDate || '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 font-semibold">
                          {t('clientAppsDraft')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">—</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                              size="sm"
                              className="text-white text-xs"
                              style={{ background: 'linear-gradient(135deg, #0865FE, #3B2F7E)' }}
                              onClick={() => navigate(`/apply?country=${draft.countryCode}`)}
                          >
                            {t('clientAppsContinue')}
                          </Button>
                          <Button
                              size="icon"
                              variant="ghost"
                              className="w-7 h-7 text-muted-foreground hover:text-destructive"
                              title={t('clientAppsDiscardDraft')}
                              onClick={discardDraft}
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                )}

                {/* Real applications */}
                {loading && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">{t('clientAppsLoading')}</TableCell>
                    </TableRow>
                )}
                {!loading && applications.length === 0 && !draft && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">{t('clientAppsEmpty')}</TableCell>
                    </TableRow>
                )}
                {applications.map(app => (
                    <TableRow key={app.id} className="cursor-pointer hover:bg-muted/40" onClick={() => setSelected(app)}>
                      <TableCell className="font-mono text-xs">{app.id.slice(0, 8).toUpperCase()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <img src={`https://flagcdn.com/w40/${app.visaType.country.code.toLowerCase()}.png`} alt="" className="w-6 h-6 rounded-full object-cover" />
                              {language === 'en' ? app.visaType.country.nameEn : language === 'ar' ? app.visaType.country.nameAr : app.visaType.country.nameFr}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div>{language === 'en' ? app.visaType.nameEn : language === 'ar' ? app.visaType.nameAr : app.visaType.nameFr}</div>
                        {app.office && (
                          <div className="mt-0.5 text-xs text-muted-foreground">
                            {t('clientAppsOffice')}: {app.office.name} · {app.office.wilaya}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{app.numberOfPeople}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{new Date(app.createdAt).toLocaleDateString(dateLocale)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={APP_STATUS_COLOR[app.status]}>{t(APP_STATUS_LABEL[app.status])}</Badge>
                      </TableCell>

                      <TableCell onClick={e => e.stopPropagation()}>
                        {app.payment?.status === 'PAID' && (
                            <Badge variant="outline" className={PAYMENT_STATUS_COLOR['PAID']}>
                              {t(PAYMENT_STATUS_LABEL['PAID'])}
                            </Badge>
                        )}
                        {app.payment?.status === 'REFUNDED' && (
                            <Badge variant="outline" className={PAYMENT_STATUS_COLOR['REFUNDED']}>
                              {t(PAYMENT_STATUS_LABEL['REFUNDED'])}
                            </Badge>
                        )}
                        {app.payment?.status === 'FAILED' && (
                            <Button size="sm" variant="outline"
                                    onClick={() => handlePayNow(app.id)}
                                    className="text-xs border-red-300 text-red-600 hover:bg-red-50 h-7 rounded-full">
                              {t('clientAppsRetry')}
                            </Button>
                        )}
                        {(!app.payment || app.payment?.status === 'PENDING') && !['CANCELLED', 'REJECTED'].includes(app.status) && (
                            <Button size="sm" variant="outline"
                                    onClick={() => handlePayNow(app.id)}
                                    className="text-xs border-yellow-400 text-yellow-700 hover:bg-yellow-50 h-7 rounded-full">
                              {t('clientAppsPay')}
                            </Button>
                        )}
                        {!app.payment && ['CANCELLED', 'REJECTED'].includes(app.status) && (
                            <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" aria-label={t('clientAppsDetails')}><Eye className="w-4 h-4" /></Button>
                      </TableCell>
                    </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Detail dialog */}
        <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            {selected && (
                <>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-3 flex-wrap">
                      <img src={`https://flagcdn.com/w40/${selected.visaType.country.code.toLowerCase()}.png`} alt="" className="w-7 h-7 rounded-full object-cover" />
                      {language === 'en' ? selected.visaType.country.nameEn : language === 'ar' ? selected.visaType.country.nameAr : selected.visaType.country.nameFr} — {selected.id.slice(0, 8).toUpperCase()}
                      <Badge variant="outline" className={APP_STATUS_COLOR[selected.status]}>{t(APP_STATUS_LABEL[selected.status])}</Badge>
                    </DialogTitle>
                  </DialogHeader>

                  <Tabs defaultValue="info" className="mt-4">
                    <TabsList className="grid grid-cols-3 w-full">
                      <TabsTrigger value="info">{t('clientAppsInfoTab')}</TabsTrigger>
                      <TabsTrigger value="passengers">{t('clientAppsPassengersTab')}</TabsTrigger>
                      <TabsTrigger value="documents">{t('clientAppsDocumentsTab')}</TabsTrigger>
                    </TabsList>

                    {/* ── Info ── */}
                    <TabsContent value="info" className="space-y-4 pt-4">
                      <div className="grid grid-cols-2 gap-3 text-sm rounded-lg border p-4 bg-muted/30">
                        <div><span className="text-muted-foreground">{t('clientAppsVisa')}:</span> <strong>{language === 'en' ? selected.visaType.nameEn : language === 'ar' ? selected.visaType.nameAr : selected.visaType.nameFr}</strong></div>
                        <div><span className="text-muted-foreground">{t('clientAppsTravelers')}:</span> <strong>{selected.numberOfPeople}</strong></div>
                        <div><span className="text-muted-foreground">{t('clientAppsEmail')}</span> <strong>{selected.email}</strong></div>
                        <div><span className="text-muted-foreground">{t('clientAppsPhone')}</span> <strong>{selected.phone}</strong></div>
                        <div><span className="text-muted-foreground">{t('clientAppsDeparture')}</span> <strong>{new Date(`${selected.startDate}T00:00:00`).toLocaleDateString(dateLocale)}</strong></div>
                        {selected.office && <div><span className="text-muted-foreground">{t('clientAppsOffice')}:</span> <strong>{selected.office.name} · {selected.office.wilaya}</strong></div>}
                        <div><span className="text-muted-foreground">{t('clientAppsTotal')}</span> <strong className="text-primary">{(Number(selected.visaType.price) * selected.numberOfPeople).toLocaleString(dateLocale)} {selected.visaType.currency}</strong></div>
                      </div>

                      {selected.payment && (
                          <div className="rounded-lg border p-4 space-y-2 text-sm">
                            <p className="font-semibold">{t('clientAppsPayment')}</p>
                            <div className="grid grid-cols-2 gap-2">
                              <div><span className="text-muted-foreground">{t('clientAppsStatus')}</span> <Badge variant="outline" className={PAYMENT_STATUS_COLOR[selected.payment.status]}>{t(PAYMENT_STATUS_LABEL[selected.payment.status])}</Badge></div>
                              <div><span className="text-muted-foreground">{t('clientAppsAmount')}</span> <strong>{Number(selected.payment.amount).toLocaleString(dateLocale)} {selected.payment.currency?.toUpperCase()}</strong></div>
                              <div><span className="text-muted-foreground">{t('clientAppsMethod')}</span> <strong>{PAYMENT_METHOD_LABEL[selected.payment.method] ? t(PAYMENT_METHOD_LABEL[selected.payment.method]) : selected.payment.method}</strong></div>
                              {selected.payment.paidAt && <div><span className="text-muted-foreground">{t('clientAppsPaidOn')}</span> <strong>{new Date(selected.payment.paidAt).toLocaleString(dateLocale)}</strong></div>}
                            </div>
                          </div>
                      )}


                      {(!selected.payment || selected.payment.status === 'PENDING') && selected.status !== 'CANCELLED' && (
                          <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4 flex items-center justify-between gap-3">
                            <p className="text-sm text-yellow-800">
                              {selected.payment?.status === 'PENDING'
                                  ? t('clientAppsPaymentPending')
                                  : t('clientAppsAwaitingPayment')}
                            </p>
                            <Button
                                size="sm"
                                disabled={payingId === selected.id}
                                className="text-white"
                                style={{ background: 'linear-gradient(135deg, #0865FE, #3B2F7E)' }}
                                onClick={() => handlePayNow(selected.id)}
                            >
                              {payingId === selected.id
                                  ? <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> {t('clientAppsRedirecting')}</>
                                  : t('clientAppsPayNow')}
                            </Button>
                          </div>
                      )}
                    </TabsContent>

                    {/* ── Passengers ── */}
                    <TabsContent value="passengers" className="space-y-3 pt-4">
                      {selected.passengers.map((p, i) => (
                            <div key={p.id} className="border rounded-lg p-4 space-y-2">
                            <div className="font-semibold text-sm">{t('clientAppsPassenger')} {i + 1} — {p.firstName} {p.lastName}</div>
                            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                              <div>{t('clientAppsBorn')} {p.birthDate}{p.birthPlace ? ` ${t('clientAppsBirthPlaceIn')} ${p.birthPlace}` : ''}</div>
                              <div>{t('clientAppsNationality')} {p.nationality ?? '—'}</div>
                              <div>{t('clientAppsPassport')} {p.passportNumber}</div>
                              <div>{t('clientAppsPassportExpiry')} {p.passportExpiryDate}</div>
                            </div>
                          </div>
                      ))}
                    </TabsContent>

                    {/* ── Documents ── */}
                    <TabsContent value="documents" className="space-y-3 pt-4">
                      {['APPROVED', 'CANCELLED'].includes(selected.status) && (
                          <p className="text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
                            {t('clientAppsDocumentsLocked')} {t(APP_STATUS_LABEL[selected.status]).toLocaleLowerCase(dateLocale)}
                          </p>
                      )}
                      {selected.visaType.documentRequirements.length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-4">{t('clientAppsNoDocuments')}</p>
                      )}
                      {selected.visaType.documentRequirements.map(req =>
                          selected.passengers.map(p => (
                              <DocRow
                                  key={`${p.id}-${req.id}`}
                                  app={selected}
                                  passenger={p}
                                  req={req}
                                  onUploaded={handleDocUploaded}
                              />
                          ))
                      )}
                    </TabsContent>
                  </Tabs>
                </>
            )}
          </DialogContent>
        </Dialog>
      </div>
  );
};

export default ClientApplications;