import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  ChevronLeft, ChevronRight, MapPin, FileText, Tag, User as UserIcon, Users, FileUp,
  CheckCircle2, Plus, Trash2, Sparkles, Upload, X, Loader2, PartyPopper,
} from 'lucide-react';
import {
  agencyVisaCatalog, getAgencyPrice, currentAgency, seedDocumentTypes,
} from '@/lib/mockAdminData';
import { toast } from 'sonner';

const fmtMoney = (a: number, c: string) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: c, maximumFractionDigits: 0 }).format(a);

type Passenger = {
  firstName: string; lastName: string; birthDate: string; birthPlace: string;
  nationality: string; passportNumber: string; passportIssueDate: string; passportExpiryDate: string;
  email: string;
};

type DocFile = { key: string; label: string; filename: string; previewUrl: string };

const STEPS = [
  { id: 1, label: 'Pays', icon: MapPin },
  { id: 2, label: 'Visa', icon: FileText },
  { id: 3, label: 'Tarif', icon: Tag },
  { id: 4, label: 'Infos', icon: UserIcon },
  { id: 5, label: 'Voyageurs', icon: Users },
  { id: 6, label: 'Documents', icon: FileUp },
  { id: 7, label: 'Validation', icon: CheckCircle2 },
];

const emptyPassenger = (): Passenger => ({
  firstName: '', lastName: '', birthDate: '', birthPlace: '', nationality: 'Algérienne',
  passportNumber: '', passportIssueDate: '', passportExpiryDate: '', email: '',
});

const NewApplication = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const [countryName, setCountryName] = useState('');
  const [visaTypeId, setVisaTypeId] = useState('');
  const [info, setInfo] = useState({ email: '', phone: '', startDate: '', numberOfPeople: 1 });
  const [passengers, setPassengers] = useState<Passenger[]>([emptyPassenger()]);
  const [docs, setDocs] = useState<Record<number, DocFile[]>>({}); // passengerIndex -> files

  const countries = useMemo(() => Array.from(new Set(agencyVisaCatalog.map(v => ({ name: v.countryName, flag: v.flagEmoji })).map(c => JSON.stringify(c)))).map(s => JSON.parse(s)), []);
  const visasForCountry = agencyVisaCatalog.filter(v => v.countryName === countryName);
  const selectedVisa = agencyVisaCatalog.find(v => v.id === visaTypeId);
  const pricing = visaTypeId ? getAgencyPrice(visaTypeId, currentAgency.groupId) : null;
  const totalPrice = pricing ? pricing.price * info.numberOfPeople : 0;

  // Sync passengers count
  const updatePeople = (n: number) => {
    const num = Math.max(1, Math.min(20, n));
    setInfo({ ...info, numberOfPeople: num });
    setPassengers(prev => {
      if (num > prev.length) return [...prev, ...Array(num - prev.length).fill(0).map(emptyPassenger)];
      return prev.slice(0, num);
    });
  };

  const updatePassenger = (i: number, patch: Partial<Passenger>) =>
    setPassengers(prev => prev.map((p, idx) => idx === i ? { ...p, ...patch } : p));

  const requiredDocs = selectedVisa?.requiredDocuments ?? [];
  const docMeta = (key: string) => seedDocumentTypes.find(d => d.key === key);

  const fakeUpload = (passengerIdx: number, key: string) => {
    toast.loading('Upload en cours…', { id: `up-${passengerIdx}-${key}` });
    setTimeout(() => {
      const meta = docMeta(key);
      const file: DocFile = {
        key, label: meta?.labelFr ?? key,
        filename: `${key}_p${passengerIdx + 1}_${Date.now()}.pdf`,
        previewUrl: 'https://images.unsplash.com/photo-1569949381669-ecf31ae8e613?w=400',
      };
      setDocs(prev => ({ ...prev, [passengerIdx]: [...(prev[passengerIdx] ?? []).filter(d => d.key !== key), file] }));
      toast.success('Document téléversé', { id: `up-${passengerIdx}-${key}` });
    }, 800);
  };

  const removeDoc = (passengerIdx: number, key: string) =>
    setDocs(prev => ({ ...prev, [passengerIdx]: (prev[passengerIdx] ?? []).filter(d => d.key !== key) }));

  // Validation
  const canNext = () => {
    if (step === 1) return !!countryName;
    if (step === 2) return !!visaTypeId;
    if (step === 3) return !!pricing;
    if (step === 4) return !!info.email && !!info.phone && !!info.startDate && info.numberOfPeople >= 1;
    if (step === 5) return passengers.every(p => p.firstName && p.lastName && p.passportNumber && p.birthDate);
    if (step === 6) return passengers.every((_, i) => requiredDocs.every(rd => docs[i]?.some(d => d.key === rd)));
    return true;
  };

  const submit = () => {
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setDone(true);
      toast.success('Demande créée avec succès !');
    }, 1500);
  };

  if (done) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="text-center animate-fade-in-up shadow-elegant">
          <CardContent className="py-12">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-accent flex items-center justify-center mb-4 shadow-elegant">
              <PartyPopper className="w-10 h-10 text-accent-foreground" />
            </div>
            <h2 className="text-2xl font-bold">Demande envoyée !</h2>
            <p className="text-muted-foreground mt-2">Votre demande de visa a été créée et est en cours de traitement.</p>
            <div className="mt-4 inline-block px-4 py-2 rounded-lg bg-muted font-mono text-sm">
              VAG-{new Date().getFullYear()}{String(new Date().getMonth() + 1).padStart(2, '0')}-{String(Math.floor(Math.random() * 999)).padStart(3, '0')}
            </div>
            <div className="mt-6 flex gap-3 justify-center">
              <Button variant="outline" onClick={() => navigate('/agency/applications')}>Voir mes demandes</Button>
              <Button onClick={() => { setDone(false); setStep(1); setCountryName(''); setVisaTypeId(''); setPassengers([emptyPassenger()]); setDocs({}); setInfo({ email: '', phone: '', startDate: '', numberOfPeople: 1 }); }}
                className="bg-gradient-primary text-primary-foreground">Nouvelle demande</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Stepper */}
      <Card className="animate-fade-in-up">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-1 overflow-x-auto">
            {STEPS.map((s, idx) => {
              const active = step === s.id;
              const done = step > s.id;
              return (
                <div key={s.id} className="flex items-center flex-1 min-w-0">
                  <div className="flex flex-col items-center min-w-0">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
                      done ? 'bg-accent text-accent-foreground' :
                      active ? 'bg-gradient-primary text-primary-foreground shadow-elegant scale-110' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {done ? <CheckCircle2 className="w-4 h-4" /> : <s.icon className="w-4 h-4" />}
                    </div>
                    <div className={`text-[10px] mt-1 hidden md:block ${active ? 'font-semibold text-primary' : 'text-muted-foreground'}`}>{s.label}</div>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-1 transition-colors ${done ? 'bg-accent' : 'bg-muted'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Step content */}
      <Card key={step} className="animate-step-in min-h-[400px]">
        <CardContent className="p-6">

          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Choisissez le pays de destination</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {countries.map(c => (
                  <button key={c.name} onClick={() => setCountryName(c.name)}
                    className={`p-4 rounded-xl border-2 transition-all text-start hover:shadow-elegant ${
                      countryName === c.name ? 'border-primary bg-primary/5 shadow-elegant' : 'border-border hover:border-primary/50'
                    }`}>
                    <div className="text-3xl">{c.flag}</div>
                    <div className="font-medium mt-2">{c.name}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Sélectionnez le type de visa</h3>
              <div className="space-y-2">
                {visasForCountry.map(v => {
                  const p = getAgencyPrice(v.id, currentAgency.groupId);
                  return (
                    <button key={v.id} onClick={() => setVisaTypeId(v.id)}
                      className={`w-full p-4 rounded-xl border-2 transition-all text-start hover:shadow-elegant flex items-center justify-between ${
                        visaTypeId === v.id ? 'border-primary bg-primary/5 shadow-elegant' : 'border-border hover:border-primary/50'
                      }`}>
                      <div>
                        <div className="font-semibold">{v.visaTypeName}</div>
                        <div className="text-xs text-muted-foreground mt-1">{v.description}</div>
                        <div className="text-xs text-muted-foreground mt-1">⏱ {v.processingTime} · {v.durationDays} jours</div>
                      </div>
                      <div className="text-end">
                        {p.isDiscounted && <div className="text-xs line-through text-muted-foreground">{fmtMoney(p.base, p.currency)}</div>}
                        <div className="text-xl font-bold text-primary">{fmtMoney(p.price, p.currency)}</div>
                        {p.isDiscounted && <Badge className="bg-gradient-accent text-accent-foreground border-0 text-[10px] mt-1">Votre prix</Badge>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 3 && pricing && selectedVisa && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Tarification</h3>
              <Card className={pricing.isDiscounted ? 'bg-gradient-accent text-accent-foreground border-0 shadow-elegant' : ''}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-3xl">{selectedVisa.flagEmoji}</div>
                      <div className="text-xl font-bold mt-2">{selectedVisa.countryName}</div>
                      <div className="text-sm opacity-80">{selectedVisa.visaTypeName}</div>
                    </div>
                    {pricing.isDiscounted && (
                      <Badge className="bg-white/20 text-current border-0"><Sparkles className="w-3 h-3 me-1" />Tarif Premium</Badge>
                    )}
                  </div>
                  <Separator className="my-4 opacity-30" />
                  <div className="space-y-2">
                    {pricing.isDiscounted && (
                      <div className="flex justify-between text-sm opacity-80 line-through">
                        <span>Prix standard</span><span>{fmtMoney(pricing.base, pricing.currency)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-baseline">
                      <span className="font-medium">Prix par voyageur</span>
                      <span className="text-3xl font-bold">{fmtMoney(pricing.price, pricing.currency)}</span>
                    </div>
                    {pricing.isDiscounted && (
                      <div className="text-xs">Vous économisez {fmtMoney(pricing.base - pricing.price, pricing.currency)} par voyageur</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Informations de la demande</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>Email du contact *</Label><Input type="email" value={info.email} onChange={e => setInfo({ ...info, email: e.target.value })} /></div>
                <div><Label>Téléphone *</Label><Input value={info.phone} onChange={e => setInfo({ ...info, phone: e.target.value })} /></div>
                <div><Label>Date de départ *</Label><Input type="date" value={info.startDate} onChange={e => setInfo({ ...info, startDate: e.target.value })} /></div>
                <div><Label>Nombre de voyageurs *</Label><Input type="number" min={1} max={20} value={info.numberOfPeople} onChange={e => updatePeople(parseInt(e.target.value || '1'))} /></div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Voyageurs ({passengers.length})</h3>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => updatePeople(passengers.length - 1)} disabled={passengers.length <= 1}>
                    <Trash2 className="w-3 h-3 me-1" />Retirer
                  </Button>
                  <Button size="sm" onClick={() => updatePeople(passengers.length + 1)}>
                    <Plus className="w-3 h-3 me-1" />Ajouter
                  </Button>
                </div>
              </div>
              <div className="space-y-3">
                {passengers.map((p, i) => (
                  <Card key={i} className="animate-fade-in-up">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge className="bg-gradient-primary text-primary-foreground">Voyageur #{i + 1}</Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div><Label>Prénom *</Label><Input value={p.firstName} onChange={e => updatePassenger(i, { firstName: e.target.value })} /></div>
                        <div><Label>Nom *</Label><Input value={p.lastName} onChange={e => updatePassenger(i, { lastName: e.target.value })} /></div>
                        <div><Label>Date de naissance *</Label><Input type="date" value={p.birthDate} onChange={e => updatePassenger(i, { birthDate: e.target.value })} /></div>
                        <div><Label>Lieu de naissance</Label><Input value={p.birthPlace} onChange={e => updatePassenger(i, { birthPlace: e.target.value })} /></div>
                        <div><Label>Nationalité</Label>
                          <Select value={p.nationality} onValueChange={v => updatePassenger(i, { nationality: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Algérienne">Algérienne</SelectItem>
                              <SelectItem value="Tunisienne">Tunisienne</SelectItem>
                              <SelectItem value="Marocaine">Marocaine</SelectItem>
                              <SelectItem value="Française">Française</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div><Label>Email</Label><Input type="email" value={p.email} onChange={e => updatePassenger(i, { email: e.target.value })} /></div>
                        <div><Label>N° Passeport *</Label><Input value={p.passportNumber} onChange={e => updatePassenger(i, { passportNumber: e.target.value })} /></div>
                        <div><Label>Date d'émission</Label><Input type="date" value={p.passportIssueDate} onChange={e => updatePassenger(i, { passportIssueDate: e.target.value })} /></div>
                        <div className="md:col-span-2"><Label>Date d'expiration</Label><Input type="date" value={p.passportExpiryDate} onChange={e => updatePassenger(i, { passportExpiryDate: e.target.value })} /></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Documents requis</h3>
              <p className="text-sm text-muted-foreground">Téléversez les documents pour chaque voyageur.</p>
              <div className="space-y-3">
                {passengers.map((p, i) => (
                  <Card key={i}><CardContent className="p-4">
                    <div className="font-semibold mb-3">Voyageur #{i + 1} — {p.firstName || '...'} {p.lastName}</div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {requiredDocs.map(rd => {
                        const meta = docMeta(rd);
                        const uploaded = docs[i]?.find(d => d.key === rd);
                        return (
                          <div key={rd} className={`p-3 rounded-lg border-2 transition-all ${uploaded ? 'border-accent bg-accent/5' : 'border-dashed border-border'}`}>
                            <div className="text-xs font-medium">{meta?.labelFr ?? rd}</div>
                            <div className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{meta?.description}</div>
                            {uploaded ? (
                              <div className="mt-2 flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-xs text-accent min-w-0">
                                  <CheckCircle2 className="w-3 h-3 shrink-0" />
                                  <span className="truncate">{uploaded.filename}</span>
                                </div>
                                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => removeDoc(i, rd)}><X className="w-3 h-3" /></Button>
                              </div>
                            ) : (
                              <Button size="sm" variant="outline" className="w-full mt-2" onClick={() => fakeUpload(i, rd)}>
                                <Upload className="w-3 h-3 me-1" />Téléverser
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent></Card>
                ))}
              </div>
            </div>
          )}

          {step === 7 && selectedVisa && pricing && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Récapitulatif</h3>
              <Card className="bg-gradient-hero text-white border-0 shadow-elegant">
                <CardContent className="p-6">
                  <div className="text-sm opacity-80">Total à payer</div>
                  <div className="text-4xl font-bold mt-1">{fmtMoney(totalPrice, pricing.currency)}</div>
                  <div className="text-sm opacity-80 mt-1">{info.numberOfPeople} voyageur(s) × {fmtMoney(pricing.price, pricing.currency)}</div>
                </CardContent>
              </Card>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <SummaryRow label="Pays" value={`${selectedVisa.flagEmoji} ${selectedVisa.countryName}`} />
                <SummaryRow label="Type de visa" value={selectedVisa.visaTypeName} />
                <SummaryRow label="Date de départ" value={info.startDate || '—'} />
                <SummaryRow label="Voyageurs" value={String(info.numberOfPeople)} />
                <SummaryRow label="Email contact" value={info.email} />
                <SummaryRow label="Téléphone" value={info.phone} />
              </div>
              <Card><CardContent className="p-4">
                <div className="text-sm font-semibold mb-2">Voyageurs</div>
                <div className="space-y-1">
                  {passengers.map((p, i) => (
                    <div key={i} className="text-sm flex justify-between border-b last:border-0 py-1">
                      <span>#{i + 1} {p.firstName} {p.lastName}</span>
                      <span className="text-muted-foreground text-xs">{p.passportNumber}</span>
                    </div>
                  ))}
                </div>
              </CardContent></Card>
            </div>
          )}

        </CardContent>
      </Card>

      {/* Nav */}
      <div className="flex justify-between gap-2">
        <Button variant="outline" onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1}>
          <ChevronLeft className="w-4 h-4 me-1" />Précédent
        </Button>
        {step < 7 ? (
          <Button onClick={() => setStep(s => s + 1)} disabled={!canNext()} className="bg-gradient-primary text-primary-foreground">
            Suivant<ChevronRight className="w-4 h-4 ms-1" />
          </Button>
        ) : (
          <Button onClick={submit} disabled={submitting} className="bg-gradient-accent text-accent-foreground">
            {submitting ? <><Loader2 className="w-4 h-4 me-1 animate-spin" />Envoi…</> : <><CheckCircle2 className="w-4 h-4 me-1" />Soumettre la demande</>}
          </Button>
        )}
      </div>
    </div>
  );
};

const SummaryRow = ({ label, value }: { label: string; value: string }) => (
  <div className="p-3 rounded-lg border bg-muted/30">
    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    <div className="text-sm font-medium mt-0.5 truncate">{value}</div>
  </div>
);

export default NewApplication;
