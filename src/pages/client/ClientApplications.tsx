import { useState, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Eye, FileText, CheckCircle2, Clock, AlertCircle,
  XCircle, Plane, ExternalLink, Upload, Loader2, ChevronRight,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { VisaApplication, VisaTypeDocumentRequirement, Passenger, ApplicationStatus, PaymentStatus } from '@/lib/types';
import { getApplicationsByClient } from '@/service/visaApplication.service.ts';
import { initiateSatimPayment } from '@/service/payment.service';
import { setAppSession } from '@/lib/satimRedirect';
import AppLoading from '@/components/common/AppLoading';

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

const APP_STATUS_LABEL: Record<ApplicationStatus, string> = {
  PENDING:      'En attente',
  UNDER_REVIEW: 'En cours',
  APPROVED:     'Approuvé',
  REJECTED:     'Rejeté',
  CANCELLED:    'Annulé',
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
const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  PENDING: 'En attente', PAID: 'Payé', FAILED: 'Échoué', REFUNDED: 'Remboursé',
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

  const { toast }  = useToast();
  const inputRef   = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);


  const uploaded = passenger.documents.find(d => d.requirementId === req.id);
  // Only allow upload/replace if application is not yet approved
  const canEdit = !(['APPROVED', 'CANCELLED'] as ApplicationStatus[]).includes(app.status);

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
      if (!res.ok) throw new Error(data.message ?? 'Erreur upload');
      onUploaded(passenger.id, req.id, data.data);
      toast({ title: uploaded ? 'Document remplacé' : 'Document uploadé', description: file.name });
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
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
            {req.documentType.labelFr}
            {!req.isRequired && <span className="ml-1 text-xs text-muted-foreground">(optionnel)</span>}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {passenger.firstName} {passenger.lastName}
            {uploaded && <span className="ml-1">· {uploaded.originalName}</span>}
          </p>
        </div>

        {/* Verification badge */}
        {uploaded && (
            uploaded.isVerified
                ? <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full shrink-0">Vérifié</span>
                : <Clock className="w-4 h-4 text-muted-foreground shrink-0" title="En attente de vérification" />
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
                  ? <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Envoi...</>
                  : <><Upload className="w-3.5 h-3.5 mr-1" />{uploaded ? 'Remplacer' : 'Uploader'}</>}
            </Button>
        )}
      </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const ClientApplications = () => {
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
        toast({ title: 'reCAPTCHA requis', description: 'Veuillez valider le reCAPTCHA.', variant: 'destructive' });
        return;
      }
      const { formUrl } = await initiateSatimPayment(captchaModal, captchaToken);
      setAppSession();
      window.location.href = formUrl;
    } catch (err: any) {
      toast({ title: 'Erreur paiement', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };
  return (
      <div className="space-y-6">
        {error && <div className="text-center py-8 text-destructive text-sm">{error}</div>}

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Suivez l'état de toutes vos demandes de visa.</p>
          <Button asChild className="bg-gradient-primary">
            <Link to="/apply"><Plane className="w-4 h-4 mr-2" /> Nouvelle demande</Link>
          </Button>
        </div>

        {/* Cards Grid */}
        <div className="space-y-4">
          {/* Loading Skeletons */}
          {loading && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 py-12">
              <AppLoading
                fullScreen={false}
                message="Chargement de vos demandes de visa..."
                subMessage="Récupération de vos dossiers en cours..."
              />
            </div>
          )}

          {/* Empty State */}
          {!loading && applications.length === 0 && !draft && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Aucune demande de visa</h3>
              <p className="text-xs sm:text-sm text-gray-500 max-w-sm mx-auto">
                Vous n'avez pas encore de dossier de visa. Initiez votre première demande dès maintenant.
              </p>
              <Button asChild className="rounded-xl mt-2">
                <Link to="/apply">
                  <Plane className="w-4 h-4 mr-2" /> Déposer une demande
                </Link>
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Draft card */}
            {draft && (
              <div className="bg-amber-50/70 dark:bg-amber-950/30 rounded-2xl border-2 border-dashed border-amber-300 dark:border-amber-700 p-5 shadow-xs flex flex-col justify-between gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={`https://flagcdn.com/w80/${draft.countryCode.toLowerCase()}.png`}
                      alt=""
                      className="w-11 h-11 rounded-xl object-cover shadow-xs border border-amber-200"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-gray-900 dark:text-gray-100 uppercase">
                          {draft.countryCode}
                        </h3>
                        <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 text-[10px] font-bold uppercase">
                          Brouillon
                        </Badge>
                      </div>
                      <p className="text-xs text-amber-800/80 dark:text-amber-300">
                        Demande non finalisée
                      </p>
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="w-8 h-8 text-gray-400 hover:text-red-500 rounded-full"
                    title="Supprimer le brouillon"
                    onClick={discardDraft}
                  >
                    <XCircle className="w-5 h-5" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-2 py-2 px-3 rounded-xl bg-amber-100/50 dark:bg-amber-900/30 text-xs">
                  <div>
                    <span className="text-amber-800/60 dark:text-amber-400 block text-[10px] uppercase font-medium">Voyageurs</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">{draft.numberOfPeople} personne(s)</span>
                  </div>
                  <div>
                    <span className="text-amber-800/60 dark:text-amber-400 block text-[10px] uppercase font-medium">Date prévue</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">{draft.startDate || 'Non renseignée'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-amber-200/60 dark:border-amber-800/60 gap-2">
                  <span className="text-xs text-amber-700 dark:text-amber-300 font-medium truncate">
                    Reprendre votre saisie
                  </span>
                  <Button
                    size="sm"
                    className="text-white text-xs font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xs shrink-0"
                    onClick={() => navigate(`/apply?country=${draft.countryCode}`)}
                  >
                    Continuer
                  </Button>
                </div>
              </div>
            )}

            {/* Applications cards */}
            {applications.map(app => (
              <div
                key={app.id}
                onClick={() => setSelected(app)}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-xs hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800 transition-all cursor-pointer flex flex-col justify-between gap-4 group"
              >
                {/* Header: Flag + Country/Visa + Status */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={`https://flagcdn.com/w80/${app.visaType.country.code.toLowerCase()}.png`}
                      alt={app.visaType.country.nameFr}
                      className="w-11 h-11 rounded-xl object-cover shadow-xs border border-gray-100 dark:border-gray-800 shrink-0"
                    />
                    <div className="min-w-0">
                      <h3 className="font-bold text-base text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-600 transition-colors">
                        {app.visaType.country.nameFr}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {app.visaType.nameFr}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className={`shrink-0 text-xs font-semibold rounded-full px-2.5 py-0.5 ${APP_STATUS_COLOR[app.status]}`}>
                    {APP_STATUS_LABEL[app.status]}
                  </Badge>
                </div>

                {/* Details Matrix */}
                <div className="grid grid-cols-3 gap-2 py-2 px-3 rounded-xl bg-gray-50/80 dark:bg-gray-800/50 text-xs">
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-medium">Référence</span>
                    <span className="font-mono font-semibold text-gray-700 dark:text-gray-200">
                      #{app.id.slice(0, 8).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-medium">Voyageurs</span>
                    <span className="font-semibold text-gray-700 dark:text-gray-200">
                      {app.numberOfPeople} {app.numberOfPeople > 1 ? 'personnes' : 'personne'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-medium">Date dépôt</span>
                    <span className="font-semibold text-gray-700 dark:text-gray-200">
                      {new Date(app.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>

                {/* Footer: Payment status & Action */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800 gap-2">
                  <div onClick={e => e.stopPropagation()}>
                    {app.payment?.status === 'PAID' && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-full px-2.5 py-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Payé
                      </span>
                    )}
                    {app.payment?.status === 'REFUNDED' && (
                      <Badge variant="outline" className={PAYMENT_STATUS_COLOR['REFUNDED']}>
                        {PAYMENT_STATUS_LABEL['REFUNDED']}
                      </Badge>
                    )}
                    {app.payment?.status === 'FAILED' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePayNow(app.id)}
                        className="text-xs border-red-300 text-red-600 hover:bg-red-50 h-8 rounded-xl font-medium"
                      >
                        Réessayer
                      </Button>
                    )}
                    {(!app.payment || app.payment?.status === 'PENDING') && !['CANCELLED', 'REJECTED'].includes(app.status) && (
                      <Button
                        size="sm"
                        onClick={() => handlePayNow(app.id)}
                        className="text-xs text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 h-8 rounded-xl font-semibold shadow-xs"
                      >
                        Payer maintenant
                      </Button>
                    )}
                    {!app.payment && ['CANCELLED', 'REJECTED'].includes(app.status) && (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition-transform">
                    <span>Détails & Documents</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detail dialog */}
        <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            {selected && (
                <>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-3 flex-wrap">
                      <img src={`https://flagcdn.com/w40/${selected.visaType.country.code.toLowerCase()}.png`} alt="" className="w-7 h-7 rounded-full object-cover" />
                      {selected.visaType.country.nameFr} — {selected.id.slice(0, 8).toUpperCase()}
                      <Badge variant="outline" className={APP_STATUS_COLOR[selected.status]}>{APP_STATUS_LABEL[selected.status]}</Badge>
                    </DialogTitle>
                  </DialogHeader>

                  <Tabs defaultValue="info" className="mt-4">
                    <TabsList className="grid grid-cols-3 w-full">
                      <TabsTrigger value="info">Infos</TabsTrigger>
                      <TabsTrigger value="passengers">Voyageurs</TabsTrigger>
                      <TabsTrigger value="documents">Documents</TabsTrigger>
                    </TabsList>

                    {/* ── Info ── */}
                    <TabsContent value="info" className="space-y-4 pt-4">
                      <div className="grid grid-cols-2 gap-3 text-sm rounded-lg border p-4 bg-muted/30">
                        <div><span className="text-muted-foreground">Visa:</span> <strong>{selected.visaType.nameFr}</strong></div>
                        <div><span className="text-muted-foreground">Voyageurs:</span> <strong>{selected.numberOfPeople}</strong></div>
                        <div><span className="text-muted-foreground">Email:</span> <strong>{selected.email}</strong></div>
                        <div><span className="text-muted-foreground">Téléphone:</span> <strong>{selected.phone}</strong></div>
                        <div><span className="text-muted-foreground">Départ:</span> <strong>{selected.startDate}</strong></div>
                        <div><span className="text-muted-foreground">Total:</span> <strong className="text-primary">{(Number(selected.visaType.price) * selected.numberOfPeople).toLocaleString('fr-FR')} {selected.visaType.currency}</strong></div>
                      </div>

                      {selected.payment && (
                          <div className="rounded-lg border p-4 space-y-2 text-sm">
                            <p className="font-semibold">Paiement</p>
                            <div className="grid grid-cols-2 gap-2">
                              <div><span className="text-muted-foreground">Statut:</span> <Badge variant="outline" className={PAYMENT_STATUS_COLOR[selected.payment.status]}>{PAYMENT_STATUS_LABEL[selected.payment.status]}</Badge></div>
                              <div><span className="text-muted-foreground">Montant:</span> <strong>{Number(selected.payment.amount).toLocaleString('fr-FR')} {selected.payment.currency?.toUpperCase()}</strong></div>
                              <div><span className="text-muted-foreground">Méthode:</span> <strong>{selected.payment.method}</strong></div>
                              {selected.payment.paidAt && <div><span className="text-muted-foreground">Payé le:</span> <strong>{new Date(selected.payment.paidAt).toLocaleString('fr-FR', { hour12: false })}</strong></div>}
                            </div>
                          </div>
                      )}


                      {(!selected.payment || selected.payment.status === 'PENDING') && selected.status !== 'CANCELLED' && (
                          <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4 flex items-center justify-between gap-3">
                            <p className="text-sm text-yellow-800">
                              {selected.payment?.status === 'PENDING'
                                  ? 'Votre paiement est en attente.'
                                  : 'Cette demande est en attente de paiement.'}
                            </p>
                            <Button
                                size="sm"
                                disabled={payingId === selected.id}
                                className="text-white"
                                style={{ background: 'linear-gradient(135deg, #0865FE, #3B2F7E)' }}
                                onClick={() => handlePayNow(selected.id)}
                            >
                              {payingId === selected.id
                                  ? <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Redirection...</>
                                  : 'Payer maintenant'}
                            </Button>
                          </div>
                      )}
                    </TabsContent>

                    {/* ── Passengers ── */}
                    <TabsContent value="passengers" className="space-y-3 pt-4">
                      {selected.passengers.map((p, i) => (
                          <div key={p.id} className="border rounded-lg p-4 space-y-2">
                            <div className="font-semibold text-sm">Voyageur {i + 1} — {p.firstName} {p.lastName}</div>
                            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                              <div>Né(e): {p.birthDate}{p.birthPlace ? ` à ${p.birthPlace}` : ''}</div>
                              <div>Nationalité: {p.nationality ?? '—'}</div>
                              <div>Passeport: {p.passportNumber}</div>
                              <div>Expiration: {p.passportExpiryDate}</div>
                            </div>
                          </div>
                      ))}
                    </TabsContent>

                    {/* ── Documents ── */}
                    <TabsContent value="documents" className="space-y-3 pt-4">
                      {['APPROVED', 'CANCELLED'].includes(selected.status) && (
                          <p className="text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
                            Les documents ne peuvent plus être modifiés — demande {APP_STATUS_LABEL[selected.status].toLowerCase()}.
                          </p>
                      )}
                      {selected.visaType.documentRequirements.length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-4">Aucun document requis pour ce visa.</p>
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