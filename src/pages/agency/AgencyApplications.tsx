import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, FileText, Search, CheckCircle2, Clock, XCircle, FileCheck, MapPin, Mail, Phone, Calendar, Users } from 'lucide-react';
import {
  seedAgencyApplications, APP_STATUS_LABEL, APP_STATUS_COLOR, type AgencyApplicationMock,
} from '@/lib/mockAdminData';

const fmtMoney = (a: number, c: string) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: c, maximumFractionDigits: 0 }).format(a);
const fmtDate = (s: string) => new Date(s).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

const TIMELINE_ICON = {
  PENDING: Clock,
  UNDER_REVIEW: FileCheck,
  APPROVED: CheckCircle2,
  REJECTED: XCircle,
};

const AgencyApplications = () => {
  const [apps] = useState<AgencyApplicationMock[]>(seedAgencyApplications);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [selected, setSelected] = useState<AgencyApplicationMock | null>(null);

  const countries = useMemo(() => Array.from(new Set(apps.map(a => a.countryName))), [apps]);

  const filtered = apps.filter(a => {
    const matchSearch = !search ||
      a.reference.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase()) ||
      a.countryName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    const matchCountry = countryFilter === 'all' || a.countryName === countryFilter;
    return matchSearch && matchStatus && matchCountry;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="animate-fade-in-up">
        <CardContent className="p-4 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Rechercher par référence, pays, email…" value={search} onChange={e => setSearch(e.target.value)} className="ps-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="md:w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="PENDING">En attente</SelectItem>
              <SelectItem value="UNDER_REVIEW">En cours</SelectItem>
              <SelectItem value="APPROVED">Approuvées</SelectItem>
              <SelectItem value="REJECTED">Rejetées</SelectItem>
            </SelectContent>
          </Select>
          <Select value={countryFilter} onValueChange={setCountryFilter}>
            <SelectTrigger className="md:w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les pays</SelectItem>
              {countries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="animate-fade-in-up">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Référence</TableHead>
                <TableHead>Pays / Visa</TableHead>
                <TableHead className="text-center">Voyageurs</TableHead>
                <TableHead>Date départ</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-end">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(a => (
                <TableRow key={a.id} className="row-hover">
                  <TableCell className="font-mono text-xs">{a.reference}</TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">{a.countryName}</div>
                    <div className="text-xs text-muted-foreground">{a.visaTypeName}</div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="gap-1"><Users className="w-3 h-3" />{a.numberOfPeople}</Badge>
                  </TableCell>
                  <TableCell className="text-xs">{fmtDate(a.startDate)}</TableCell>
                  <TableCell className="font-semibold">{fmtMoney(a.totalPrice, a.currency)}</TableCell>
                  <TableCell><Badge variant="outline" className={APP_STATUS_COLOR[a.status]}>{APP_STATUS_LABEL[a.status]}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{fmtDate(a.createdAt)}</TableCell>
                  <TableCell className="text-end">
                    <Button size="sm" variant="ghost" onClick={() => setSelected(a)}><Eye className="w-4 h-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                  <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />Aucune demande
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={o => !o && setSelected(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className="font-mono text-sm">{selected.reference}</span>
                  <Badge variant="outline" className={APP_STATUS_COLOR[selected.status]}>{APP_STATUS_LABEL[selected.status]}</Badge>
                </DialogTitle>
              </DialogHeader>
              <Tabs defaultValue="info" className="mt-3">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="info">Info</TabsTrigger>
                  <TabsTrigger value="passengers">Voyageurs ({selected.passengers.length})</TabsTrigger>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                  <TabsTrigger value="timeline">Suivi</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-3 mt-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Field icon={MapPin} label="Pays" value={selected.countryName} />
                    <Field icon={FileText} label="Type de visa" value={selected.visaTypeName} />
                    <Field icon={Users} label="Nombre de voyageurs" value={String(selected.numberOfPeople)} />
                    <Field icon={Calendar} label="Date de départ" value={fmtDate(selected.startDate)} />
                    <Field icon={Mail} label="Email contact" value={selected.email} />
                    <Field icon={Phone} label="Téléphone" value={selected.phone} />
                  </div>
                  <div className="p-4 rounded-lg bg-gradient-accent text-accent-foreground flex items-center justify-between">
                    <span className="text-sm font-medium">Montant total</span>
                    <span className="text-xl font-bold">{fmtMoney(selected.totalPrice, selected.currency)}</span>
                  </div>
                </TabsContent>

                <TabsContent value="passengers" className="space-y-3 mt-4">
                  {selected.passengers.map((p, i) => (
                    <Card key={p.id}><CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="font-semibold">Voyageur #{i + 1} — {p.firstName} {p.lastName}</div>
                        {p.valid ? <Badge className="bg-accent text-accent-foreground border-0">Validé</Badge> : <Badge variant="outline">À vérifier</Badge>}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div><span className="text-muted-foreground">Naissance:</span> {fmtDate(p.birthDate)} · {p.birthPlace}</div>
                        <div><span className="text-muted-foreground">Nationalité:</span> {p.nationality}</div>
                        <div><span className="text-muted-foreground">Passeport:</span> {p.passportNumber}</div>
                        <div><span className="text-muted-foreground">Email:</span> {p.email}</div>
                        <div><span className="text-muted-foreground">Délivré:</span> {fmtDate(p.passportIssueDate)}</div>
                        <div><span className="text-muted-foreground">Expire:</span> {fmtDate(p.passportExpiryDate)}</div>
                      </div>
                    </CardContent></Card>
                  ))}
                </TabsContent>

                <TabsContent value="documents" className="space-y-3 mt-4">
                  {selected.passengers.map(p => (
                    <Card key={p.id}><CardContent className="p-4">
                      <div className="font-semibold mb-3">{p.firstName} {p.lastName}</div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {p.documents.map(d => (
                          <div key={d.id} className="border rounded-lg p-2">
                            {d.previewUrl && <img src={d.previewUrl} alt={d.label} className="w-full h-24 object-cover rounded mb-2" />}
                            <div className="text-xs font-medium truncate">{d.label}</div>
                            <Badge variant="outline" className={`text-[10px] mt-1 ${d.verified ? 'border-accent text-accent' : 'border-[hsl(38_92%_50%)] text-[hsl(38_92%_50%)]'}`}>
                              {d.verified ? 'Vérifié' : 'À vérifier'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent></Card>
                  ))}
                </TabsContent>

                <TabsContent value="timeline" className="mt-4">
                  <div className="space-y-3">
                    {selected.timeline.map((t, i) => {
                      const Icon = TIMELINE_ICON[t.status];
                      return (
                        <div key={i} className="flex gap-3 animate-fade-in-up" style={{ animationDelay: `${i * 80}ms` }}>
                          <div className="flex flex-col items-center">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center ${APP_STATUS_COLOR[t.status]}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            {i < selected.timeline.length - 1 && <div className="w-0.5 flex-1 bg-border my-1" />}
                          </div>
                          <div className="flex-1 pb-3">
                            <div className="text-sm font-medium">{APP_STATUS_LABEL[t.status]}</div>
                            <div className="text-xs text-muted-foreground">{new Date(t.date).toLocaleString('fr-FR', { hour12: false })}</div>
                            {t.note && <div className="text-xs mt-1">{t.note}</div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const Field = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
  <div className="p-3 rounded-lg border">
    <div className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><Icon className="w-3 h-3" />{label}</div>
    <div className="text-sm font-medium mt-1 truncate">{value}</div>
  </div>
);

export default AgencyApplications;
