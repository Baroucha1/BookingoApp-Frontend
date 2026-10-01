import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Eye, FileText, Users, ShieldCheck, Mail, Phone,
  Calendar, MapPin, Globe, ExternalLink, Loader2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { VisaApplication, ApplicationStatus } from '@/lib/types';

const API = import.meta.env.VITE_API_URL;

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  PENDING:      'En attente',
  UNDER_REVIEW: 'En cours',
  APPROVED:     'Approuvé',
  REJECTED:     'Rejeté',
  CANCELLED:    'Annulé',
};
const STATUS_COLOR: Record<ApplicationStatus, string> = {
  PENDING:      'bg-yellow-100 text-yellow-800 border-yellow-300',
  UNDER_REVIEW: 'bg-blue-100   text-blue-800   border-blue-300',
  APPROVED:     'bg-green-100  text-green-800  border-green-300',
  REJECTED:     'bg-red-100    text-red-800    border-red-300',
  CANCELLED:    'bg-gray-100   text-gray-800   border-gray-300',
};

const ApplicationsAdmin = () => {
  const { toast } = useToast();
  const [apps, setApps]               = useState<VisaApplication[]>([]);
  const [loading, setLoading]         = useState(true);
  const [selected, setSelected]       = useState<VisaApplication | null>(null);
  const [adminNotes, setAdminNotes]   = useState('');
  const [updating, setUpdating]       = useState(false);
  const [statusFilter, setStatusFilter]   = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');

  const load = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res   = await fetch(`${API}/api/applications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.status === 'success') setApps(json.data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  // ── Derived ──
  const countryOptions = useMemo(() => {
    const map = new Map<string, string>();
    apps.forEach(a => map.set(a.visaType.country.code, a.visaType.country.nameFr));
    return Array.from(map.entries()).map(([code, name]) => ({ code, name }));
  }, [apps]);

  const filtered = useMemo(() => apps.filter(a => {
    if (statusFilter  !== 'all' && a.status !== statusFilter) return false;
    if (countryFilter !== 'all' && a.visaType.country.code !== countryFilter) return false;
    return true;
  }), [apps, statusFilter, countryFilter]);

  const counts = useMemo(() => {
    const c: Partial<Record<ApplicationStatus, number>> = {};
    apps.forEach(a => { c[a.status] = (c[a.status] ?? 0) + 1; });
    return c;
  }, [apps]);

  // ── Status update ──
  const updateStatus = async (status: ApplicationStatus) => {
    if (!selected) return;
    setUpdating(true);
    try {
      const token = localStorage.getItem('token');
      const res   = await fetch(`${API}/api/applications/${selected.id}/status`, {
        method:  'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status, adminNotes: adminNotes || null }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      toast({ title: `Statut mis à jour : ${STATUS_LABEL[status]}` });
      setSelected(null);
      load();
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    } finally {
      setUpdating(false);
    }
  };

  return (
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h1 className="text-2xl font-bold">Demandes de visa</h1>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Statut" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                {(Object.keys(STATUS_LABEL) as ApplicationStatus[]).map(s =>
                    <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
                )}
              </SelectContent>
            </Select>
            <Select value={countryFilter} onValueChange={setCountryFilter}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Pays" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous pays</SelectItem>
                {countryOptions.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          {(Object.keys(STATUS_LABEL) as ApplicationStatus[]).map(s => (
              <Card key={s}>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">{STATUS_LABEL[s]}</p>
                  <p className="text-2xl font-bold mt-1">{counts[s] ?? 0}</p>
                </CardContent>
              </Card>
          ))}
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Référence</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Pays / Visa</TableHead>
                  <TableHead>Voyageurs</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-16" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Chargement...</TableCell></TableRow>
                )}
                {!loading && filtered.length === 0 && (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Aucune demande</TableCell></TableRow>
                )}
                {filtered.map(app => (
                    <TableRow key={app.id} className="cursor-pointer hover:bg-muted/40" onClick={() => { setSelected(app); setAdminNotes(''); }}>
                      <TableCell className="font-mono text-xs">{app.id.slice(0, 8).toUpperCase()}</TableCell>
                      <TableCell className="text-sm">{app.email}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <img src={`https://flagcdn.com/w40/${app.visaType.country.code.toLowerCase()}.png`} alt="" className="w-5 h-3.5 rounded object-cover" />
                          <div>
                            <p className="text-sm font-medium">{app.visaType.country.nameFr}</p>
                            <p className="text-xs text-muted-foreground">{app.visaType.nameFr}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{app.numberOfPeople}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={STATUS_COLOR[app.status]}>{STATUS_LABEL[app.status]}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(app.createdAt).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon"><Eye className="w-4 h-4" /></Button>
                      </TableCell>
                    </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Detail dialog */}
        <Dialog open={!!selected} onOpenChange={o => { if (!o) setSelected(null); }}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            {selected && (
                <>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 flex-wrap">
                      <img src={`https://flagcdn.com/w40/${selected.visaType.country.code.toLowerCase()}.png`} alt="" className="w-6 h-4 rounded object-cover" />
                      {selected.visaType.country.nameFr} — {selected.id.slice(0, 8).toUpperCase()}
                      <Badge variant="outline" className={STATUS_COLOR[selected.status]}>{STATUS_LABEL[selected.status]}</Badge>
                    </DialogTitle>
                  </DialogHeader>

                  <Tabs defaultValue="info" className="mt-4">
                    <TabsList className="grid grid-cols-3 w-full">
                      <TabsTrigger value="info">Infos</TabsTrigger>
                      <TabsTrigger value="passengers">
                        Voyageurs <Badge variant="secondary" className="ms-1.5 h-5 px-1.5 text-xs">{selected.passengers.length}</Badge>
                      </TabsTrigger>
                      <TabsTrigger value="notes">Notes</TabsTrigger>
                    </TabsList>

                    {/* ── Info ── */}
                    <TabsContent value="info" className="mt-4 space-y-4">
                      <div className="grid grid-cols-2 gap-3 text-sm rounded-lg border p-4 bg-muted/30">
                        <div className="flex items-start gap-2"><Mail className="w-4 h-4 text-muted-foreground mt-0.5" /><div><p className="text-xs text-muted-foreground">Email</p><p className="font-medium break-all">{selected.email}</p></div></div>
                        <div className="flex items-start gap-2"><Phone className="w-4 h-4 text-muted-foreground mt-0.5" /><div><p className="text-xs text-muted-foreground">Téléphone</p><p className="font-medium">{selected.phone}</p></div></div>
                        <div className="flex items-start gap-2"><Calendar className="w-4 h-4 text-muted-foreground mt-0.5" /><div><p className="text-xs text-muted-foreground">Date de départ</p><p className="font-medium">{new Date(selected.startDate).toLocaleDateString('fr-FR')}</p></div></div>
                        <div className="flex items-start gap-2"><Users className="w-4 h-4 text-muted-foreground mt-0.5" /><div><p className="text-xs text-muted-foreground">Voyageurs</p><p className="font-medium">{selected.numberOfPeople}</p></div></div>
                        <div className="flex items-start gap-2"><Globe className="w-4 h-4 text-muted-foreground mt-0.5" /><div><p className="text-xs text-muted-foreground">Visa</p><p className="font-medium">{selected.visaType.nameFr}</p></div></div>
                        <div className="flex items-start gap-2"><Calendar className="w-4 h-4 text-muted-foreground mt-0.5" /><div><p className="text-xs text-muted-foreground">Soumis le</p><p className="font-medium">{new Date(selected.createdAt).toLocaleDateString('fr-FR')}</p></div></div>
                      </div>
                      {selected.payment && (
                          <div className="rounded-lg border p-4 text-sm space-y-1">
                            <p className="font-semibold mb-2">Paiement</p>
                            <div className="grid grid-cols-2 gap-2">
                              <div><span className="text-muted-foreground">Statut: </span><strong>{selected.payment.status}</strong></div>
                              <div><span className="text-muted-foreground">Montant: </span><strong>{Number(selected.payment.amount).toLocaleString('fr-FR')} {selected.payment.currency?.toUpperCase()}</strong></div>
                            </div>
                          </div>
                      )}
                    </TabsContent>

                    {/* ── Passengers ── */}
                    <TabsContent value="passengers" className="mt-4 space-y-3">
                      {selected.passengers.map((p, i) => (
                          <Card key={p.id}>
                            <CardContent className="p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <Badge variant="outline">Voyageur {i + 1}</Badge>
                                <h4 className="font-semibold">{p.firstName} {p.lastName}</h4>
                              </div>
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="flex items-start gap-2"><Calendar className="w-4 h-4 text-muted-foreground mt-0.5" /><div><p className="text-xs text-muted-foreground">Naissance</p><p className="font-medium">{new Date(p.birthDate).toLocaleDateString('fr-FR')}</p></div></div>
                                <div className="flex items-start gap-2"><MapPin className="w-4 h-4 text-muted-foreground mt-0.5" /><div><p className="text-xs text-muted-foreground">Lieu de naissance</p><p className="font-medium">{p.birthPlace}</p></div></div>
                                <div className="flex items-start gap-2"><Globe className="w-4 h-4 text-muted-foreground mt-0.5" /><div><p className="text-xs text-muted-foreground">Nationalité</p><p className="font-medium">{p.nationality ?? '—'}</p></div></div>
                                {p.email && <div className="flex items-start gap-2"><Mail className="w-4 h-4 text-muted-foreground mt-0.5" /><div><p className="text-xs text-muted-foreground">Email</p><p className="font-medium break-all">{p.email}</p></div></div>}
                              </div>
                              <div className="mt-3 rounded-md bg-muted/40 p-3">
                                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Passeport</p>
                                <div className="grid grid-cols-3 gap-3 text-sm">
                                  <div><p className="text-xs text-muted-foreground">N°</p><p className="font-mono font-medium">{p.passportNumber}</p></div>
                                  <div><p className="text-xs text-muted-foreground">Émis le</p><p className="font-medium">{new Date(p.passportIssueDate).toLocaleDateString('fr-FR')}</p></div>
                                  <div><p className="text-xs text-muted-foreground">Expire le</p><p className="font-medium">{new Date(p.passportExpiryDate).toLocaleDateString('fr-FR')}</p></div>
                                </div>
                              </div>

                              {/* Documents */}
                              {p.documents.length > 0 && (
                                  <div className="mt-4 pt-4 border-t space-y-2">
                                    <div className="flex items-center gap-2 mb-2">
                                      <FileText className="w-4 h-4 text-muted-foreground" />
                                      <span className="text-sm font-medium">Documents</span>
                                      <Badge variant="secondary" className="text-xs">
                                        {p.documents.filter(d => d.isVerified).length}/{p.documents.length} vérifiés
                                      </Badge>
                                    </div>
                                    {p.documents.map(d => (
                                        <div key={d.id} className="flex items-center gap-3 rounded-md border bg-card px-3 py-2">
                                          <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                                          <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium">{d.requirement?.documentType?.labelFr ?? d.requirementId}</p>
                                            <p className="text-xs text-muted-foreground truncate">{d.originalName}</p>
                                          </div>
                                          {d.isVerified
                                              ? <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 shrink-0"><ShieldCheck className="w-3 h-3 me-1" />Vérifié</Badge>
                                              : <Badge variant="outline" className="shrink-0">Non vérifié</Badge>}
                                          <a href={d.fileUrl} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>
                                            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground hover:text-primary" />
                                          </a>
                                        </div>
                                    ))}
                                  </div>
                              )}
                            </CardContent>
                          </Card>
                      ))}
                    </TabsContent>

                    {/* ── Notes ── */}
                    <TabsContent value="notes" className="mt-4">
                      <Label>Notes admin</Label>
                      <Textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} placeholder="Ajouter une note..." rows={5} className="mt-1" />
                    </TabsContent>
                  </Tabs>

                  {/* Action buttons */}
                  <div className="flex gap-2 mt-6 pt-4 border-t">
                    <Button className="flex-1" variant="outline" disabled={updating} onClick={() => updateStatus('UNDER_REVIEW')}>
                      {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'En cours'}
                    </Button>
                    <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white" disabled={updating} onClick={() => updateStatus('APPROVED')}>
                      Approuver
                    </Button>
                    <Button className="flex-1" variant="destructive" disabled={updating} onClick={() => updateStatus('REJECTED')}>
                      Rejeter
                    </Button>
                  </div>
                </>
            )}
          </DialogContent>
        </Dialog>
      </div>
  );
};

export default ApplicationsAdmin;