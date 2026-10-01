import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CreditCard, Banknote, Wallet, Building2, Eye,
  User, Building, Loader2, FileText, Clock,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getPayments } from '@/service/payment.service';

// ── Types (real DB shape) ─────────────────────────────────────────────────────
type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
type PaymentMethod = 'SATIM' | 'STRIPE' | 'CASH' | 'PAYPAL' | 'BANK_TRANSFER';

interface PaymentRow {
  id:           string;
  amount:       number;
  currency:     string;
  method:       PaymentMethod;
  status:       PaymentStatus;
  satimOrderId: string | null;
  paidAt:       string | null;
  createdAt:    string;
  clientId:     string | null;
  agencyId:     string | null;
  client: null | {
    id: string;
    user: { id: string; email: string; phone: string | null };
  };
  visaApplication: null | {
    id:     string;
    status: string;
    numberOfPeople: number;
    visaType: {
      nameFr: string;
      duration: number;
      processingDelay: number;
      price: number;
      country: { nameFr: string; nameAr: string; nameEn: string };
    };
    passengers: { id: string; firstName: string; lastName: string; passportNumber: string }[];
  };
}

// ── Display maps ──────────────────────────────────────────────────────────────
const STATUS_LABEL: Record<PaymentStatus, string> = {
  PENDING:  'En attente',
  PAID:     'Payé',
  FAILED:   'Échoué',
  REFUNDED: 'Remboursé',
};
const STATUS_COLOR: Record<PaymentStatus, string> = {
  PENDING:  'bg-yellow-100 text-yellow-800 border-yellow-300',
  PAID:     'bg-green-100  text-green-800  border-green-300',
  FAILED:   'bg-red-100    text-red-800    border-red-300',
  REFUNDED: 'bg-orange-100 text-orange-800 border-orange-300',
};
const METHOD_LABEL: Record<PaymentMethod, string> = {
  SATIM:         'SATIM / Chargily',
  STRIPE:        'Stripe',
  CASH:          'Espèces',
  PAYPAL:        'PayPal',
  BANK_TRANSFER: 'Virement',
};
const METHOD_ICON: Record<PaymentMethod, typeof CreditCard> = {
  SATIM:         Building2,
  STRIPE:        CreditCard,
  CASH:          Wallet,
  PAYPAL:        Wallet,
  BANK_TRANSFER: Banknote,
};
const APP_STATUS_COLOR: Record<string, string> = {
  PENDING:      'bg-yellow-100 text-yellow-800 border-yellow-300',
  UNDER_REVIEW: 'bg-blue-100   text-blue-800   border-blue-300',
  APPROVED:     'bg-green-100  text-green-800  border-green-300',
  REJECTED:     'bg-red-100    text-red-800    border-red-300',
  CANCELLED:    'bg-gray-100   text-gray-800   border-gray-300',
};

// ── Component ─────────────────────────────────────────────────────────────────
const PaymentsAdmin = () => {
  const { toast } = useToast();

  const [payments, setPayments]           = useState<PaymentRow[]>([]);
  const [loading, setLoading]             = useState(true);
  const [statusFilter, setStatusFilter]   = useState('all');
  const [methodFilter, setMethodFilter]   = useState('all');
  const [selectedId, setSelectedId]       = useState<string | null>(null);

  // ── Load ──
  useEffect(() => {
    setLoading(true);
    getPayments()
        .then(data => setPayments(data as unknown as PaymentRow[]))
        .catch(() => toast({ title: 'Erreur chargement paiements', variant: 'destructive' }))
        .finally(() => setLoading(false));
  }, []);

  const selected = useMemo(() =>
          payments.find(p => p.id === selectedId) ?? null,
      [payments, selectedId]
  );

  const filtered = useMemo(() =>
          payments.filter(p =>
              (statusFilter === 'all' || p.status === statusFilter) &&
              (methodFilter === 'all' || p.method === methodFilter)
          ),
      [payments, statusFilter, methodFilter]
  );

  const totals = useMemo(() => ({
    paid:         payments.filter(p => p.status === 'PAID').reduce((s, p) => s + Number(p.amount), 0),
    pendingCount: payments.filter(p => p.status === 'PENDING').length,
    refunded:     payments.filter(p => p.status === 'REFUNDED').reduce((s, p) => s + Number(p.amount), 0),
    failedCount:  payments.filter(p => p.status === 'FAILED').length,
  }), [payments]);

  // ── Helpers ──
  const ref = (p: PaymentRow) =>
      p.satimOrderId ? p.satimOrderId.slice(0, 12).toUpperCase() : p.id.slice(0, 8).toUpperCase();

  const ownerEmail = (p: PaymentRow) => p.client?.user?.email ?? '—';
  const ownerType  = (p: PaymentRow): 'client' | 'agency' | null => {
    if (p.clientId) return 'client';
    if (p.agencyId) return 'agency';
    return null;
  };

  if (loading) return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
  );

  return (
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">Paiements</h1>
            <p className="text-sm text-muted-foreground mt-1">Suivi des transactions clients et agences</p>
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Statut" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                {(Object.keys(STATUS_LABEL) as PaymentStatus[]).map(s =>
                    <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
                )}
              </SelectContent>
            </Select>
            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Méthode" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes méthodes</SelectItem>
                {(Object.keys(METHOD_LABEL) as PaymentMethod[]).map(m =>
                    <SelectItem key={m} value={m}>{METHOD_LABEL[m]}</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <Card><CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Encaissé</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{totals.paid.toLocaleString('fr-FR')} DZD</p>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">En attente</p>
            <p className="text-2xl font-bold text-yellow-600 mt-1">{totals.pendingCount} paiement{totals.pendingCount !== 1 ? 's' : ''}</p>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Remboursé</p>
            <p className="text-2xl font-bold text-orange-600 mt-1">{totals.refunded.toLocaleString('fr-FR')} DZD</p>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Échoué</p>
            <p className="text-2xl font-bold text-red-500 mt-1">{totals.failedCount} paiement{totals.failedCount !== 1 ? 's' : ''}</p>
          </CardContent></Card>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Référence</TableHead>
                  <TableHead>Propriétaire</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Méthode</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-end">Détails</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(p => {
                  const Icon = METHOD_ICON[p.method] ?? CreditCard;
                  const type = ownerType(p);
                  return (
                      <TableRow key={p.id} className="hover:bg-muted/40 cursor-pointer" onClick={() => setSelectedId(p.id)}>
                        <TableCell className="font-mono text-xs">{ref(p)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {type === 'agency'
                                ? <Building className="w-3.5 h-3.5 text-muted-foreground" />
                                : <User className="w-3.5 h-3.5 text-muted-foreground" />}
                            <div>
                              <div className="text-sm font-medium truncate max-w-[140px]">{ownerEmail(p)}</div>
                              {type && (
                                  <Badge variant="outline" className="text-[10px] h-4 mt-0.5">
                                    {type === 'agency' ? 'Agence' : 'Client'}
                                  </Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {p.visaApplication?.visaType?.country?.nameFr ?? '—'}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {Number(p.amount).toLocaleString('fr-FR')} {p.currency?.toUpperCase()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-sm">
                            <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                            {METHOD_LABEL[p.method] ?? p.method}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={STATUS_COLOR[p.status] ?? ''}>
                            {STATUS_LABEL[p.status] ?? p.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(p.createdAt).toLocaleDateString('fr-FR')}
                        </TableCell>
                        <TableCell className="text-end" onClick={e => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" onClick={() => setSelectedId(p.id)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-10">
                        Aucun paiement trouvé
                      </TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Detail dialog */}
        <Dialog open={!!selected} onOpenChange={o => { if (!o) setSelectedId(null); }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 flex-wrap">
                <span>Paiement {selected && ref(selected)}</span>
                {selected && (
                    <Badge variant="outline" className={STATUS_COLOR[selected.status]}>
                      {STATUS_LABEL[selected.status]}
                    </Badge>
                )}
              </DialogTitle>
            </DialogHeader>

            {selected && (
                <Tabs defaultValue="info" className="mt-2">
                  <TabsList className="grid grid-cols-3 w-full">
                    <TabsTrigger value="info">Paiement</TabsTrigger>
                    <TabsTrigger value="owner">Propriétaire</TabsTrigger>
                    <TabsTrigger value="application">Demande</TabsTrigger>
                  </TabsList>

                  {/* ── Info ── */}
                  <TabsContent value="info" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-3 text-sm rounded-lg border p-4 bg-muted/30">
                      <div><span className="text-muted-foreground">ID:</span> <span className="font-mono text-xs">{selected.id}</span></div>
                      <div><span className="text-muted-foreground">Référence:</span> <span className="font-mono">{ref(selected)}</span></div>
                      <div><span className="text-muted-foreground">Montant:</span> <strong>{Number(selected.amount).toLocaleString('fr-FR')} {selected.currency?.toUpperCase()}</strong></div>
                      <div><span className="text-muted-foreground">Méthode:</span> {METHOD_LABEL[selected.method] ?? selected.method}</div>
                      <div><span className="text-muted-foreground">Créé le:</span> {new Date(selected.createdAt).toLocaleString('fr-FR')}</div>
                      <div><span className="text-muted-foreground">Payé le:</span> {selected.paidAt ? new Date(selected.paidAt).toLocaleString('fr-FR') : '—'}</div>
                      {selected.satimOrderId && (
                          <div className="col-span-2">
                            <span className="text-muted-foreground">Chargily ID:</span>{' '}
                            <span className="font-mono text-xs">{selected.satimOrderId}</span>
                          </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* ── Owner ── */}
                  <TabsContent value="owner" className="mt-4">
                    {selected.client ? (
                        <div className="rounded-lg border p-4 space-y-2">
                          <div className="flex items-center gap-2">
                            <User className="w-5 h-5 text-primary" />
                            <h3 className="font-semibold">{selected.client.user.email}</h3>
                            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Client</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{selected.client.user.phone ?? 'Aucun téléphone'}</p>
                          <p className="text-xs font-mono text-muted-foreground">ID: {selected.client.id}</p>
                        </div>
                    ) : selected.agencyId ? (
                        <div className="rounded-lg border p-4 space-y-2">
                          <div className="flex items-center gap-2">
                            <Building className="w-5 h-5 text-primary" />
                            <h3 className="font-semibold">Agence</h3>
                            <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">Agence</Badge>
                          </div>
                          <p className="text-xs font-mono text-muted-foreground">ID: {selected.agencyId}</p>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">Aucun propriétaire associé.</p>
                    )}
                  </TabsContent>

                  {/* ── Application ── */}
                  <TabsContent value="application" className="mt-4">
                    {selected.visaApplication ? (
                        <div className="space-y-4">
                          <div className="rounded-lg border p-4 bg-muted/30 grid grid-cols-2 gap-3 text-sm">
                            <div><span className="text-muted-foreground">Pays:</span> <strong>{selected.visaApplication.visaType?.country?.nameFr ?? '—'}</strong></div>
                            <div><span className="text-muted-foreground">Visa:</span> {selected.visaApplication.visaType?.nameFr ?? '—'}</div>
                            <div><span className="text-muted-foreground">Voyageurs:</span> {selected.visaApplication.numberOfPeople}</div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-muted-foreground">Délai:</span>
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-800">
                          <Clock className="w-3 h-3" /> {selected.visaApplication.visaType?.processingDelay} j. ouvrés
                        </span>
                            </div>
                            <div className="col-span-2 flex items-center gap-2">
                              <span className="text-muted-foreground">Statut demande:</span>
                              <Badge variant="outline" className={APP_STATUS_COLOR[selected.visaApplication.status] ?? ''}>
                                {selected.visaApplication.status}
                              </Badge>
                            </div>
                            <div className="col-span-2">
                              <span className="text-muted-foreground">ID:</span>{' '}
                              <span className="font-mono text-xs">{selected.visaApplication.id}</span>
                            </div>
                          </div>

                          {/* Passengers */}
                          {selected.visaApplication.passengers?.length > 0 && (
                              <div>
                                <h4 className="font-semibold mb-2 flex items-center gap-2">
                                  <FileText className="w-4 h-4 text-muted-foreground" /> Passagers
                                </h4>
                                <div className="space-y-1.5">
                                  {selected.visaApplication.passengers.map(p => (
                                      <div key={p.id} className="rounded-md border bg-card px-3 py-2 flex justify-between items-center">
                                        <span className="font-medium text-sm">{p.firstName} {p.lastName}</span>
                                        <span className="font-mono text-xs text-muted-foreground">{p.passportNumber}</span>
                                      </div>
                                  ))}
                                </div>
                              </div>
                          )}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">Aucune demande liée.</p>
                    )}
                  </TabsContent>
                </Tabs>
            )}
          </DialogContent>
        </Dialog>
      </div>
  );
};

export default PaymentsAdmin;