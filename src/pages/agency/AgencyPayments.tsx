import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreditCard, Eye, CheckCircle2, RefreshCw, ExternalLink } from 'lucide-react';
import { seedAgencyPayments, type AgencyPaymentMock } from '@/lib/mockAdminData';
import { toast } from 'sonner';

const fmtMoney = (a: number, c: string) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: c, maximumFractionDigits: 0 }).format(a);
const fmtDateTime = (s: string) => new Date(s).toLocaleString('fr-FR');

const STATUS_COLOR: Record<string, string> = {
  paid: 'bg-accent text-accent-foreground border-0',
  pending: 'bg-[hsl(38_92%_50%)]/15 text-[hsl(38_92%_40%)] border-[hsl(38_92%_50%)]/30',
  refunded: 'bg-muted text-muted-foreground border',
  failed: 'bg-destructive/15 text-destructive border-destructive/30',
};

const AgencyPayments = () => {
  const [payments, setPayments] = useState<AgencyPaymentMock[]>(seedAgencyPayments);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState<AgencyPaymentMock | null>(null);

  const filtered = payments.filter(p => statusFilter === 'all' || p.status === statusFilter);

  const markPaid = (id: string) => {
    setPayments(prev => prev.map(p => p.id === id ? { ...p, status: 'paid', paidAt: new Date().toISOString() } : p));
    toast.success('Paiement marqué comme payé');
  };

  const simulatePay = (id: string) => {
    toast.loading('Redirection vers la passerelle…', { id: 'pay' });
    setTimeout(() => {
      setPayments(prev => prev.map(p => p.id === id ? { ...p, status: 'paid', paidAt: new Date().toISOString() } : p));
      toast.success('Paiement effectué avec succès', { id: 'pay' });
    }, 1500);
  };

  return (
    <div className="space-y-4">
      <Card className="animate-fade-in-up"><CardContent className="p-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="paid">Payés</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="refunded">Remboursés</SelectItem>
            <SelectItem value="failed">Échoués</SelectItem>
          </SelectContent>
        </Select>
      </CardContent></Card>

      <Card className="animate-fade-in-up"><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Référence</TableHead>
            <TableHead>Demande</TableHead>
            <TableHead>Montant</TableHead>
            <TableHead>Méthode</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-end">Actions</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.map(p => (
              <TableRow key={p.id} className="row-hover">
                <TableCell className="font-mono text-xs">{p.reference}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{p.applicationRef}</TableCell>
                <TableCell className="font-semibold">{fmtMoney(p.amount, p.currency)}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={p.currency === 'DZD' ? 'border-secondary text-secondary' : 'border-primary text-primary'}>
                    <CreditCard className="w-3 h-3 me-1" />
                    {p.currency === 'DZD' ? 'SATIM' : 'STRIPE'}
                  </Badge>
                </TableCell>
                <TableCell><Badge variant="outline" className={STATUS_COLOR[p.status]}>{p.status}</Badge></TableCell>
                <TableCell className="text-xs text-muted-foreground">{fmtDateTime(p.date)}</TableCell>
                <TableCell className="text-end">
                  <div className="flex justify-end gap-1">
                    {p.status === 'pending' && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => simulatePay(p.id)}><RefreshCw className="w-3 h-3 me-1" />Payer</Button>
                        <Button size="sm" variant="ghost" onClick={() => markPaid(p.id)}><CheckCircle2 className="w-4 h-4" /></Button>
                      </>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => setSelected(p)}><Eye className="w-4 h-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                <CreditCard className="w-10 h-10 mx-auto mb-2 opacity-50" />Aucun paiement
              </TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent></Card>

      <Dialog open={!!selected} onOpenChange={o => !o && setSelected(null)}>
        <DialogContent>
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="font-mono">{selected.reference}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 mt-2">
                <Row label="Montant" value={fmtMoney(selected.amount, selected.currency)} highlight />
                <Row label="Statut" value={selected.status} />
                <Row label="Méthode" value={selected.currency === 'DZD' ? 'SATIM' : 'STRIPE'} />
                <Row label="Demande liée" value={selected.applicationRef} />
                <Row label="Date" value={fmtDateTime(selected.date)} />
                {selected.paidAt && <Row label="Payé le" value={fmtDateTime(selected.paidAt)} />}
                {selected.satimOrderId && <Row label="SATIM Order ID" value={selected.satimOrderId} mono />}
                {selected.stripePaymentIntentId && <Row label="Stripe Intent" value={selected.stripePaymentIntentId} mono />}
                {selected.status === 'paid' && (
                  <Button variant="outline" className="w-full"><ExternalLink className="w-4 h-4 me-2" />Télécharger le reçu</Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const Row = ({ label, value, mono, highlight }: { label: string; value: string; mono?: boolean; highlight?: boolean }) => (
  <div className={`flex justify-between items-center p-3 rounded-lg ${highlight ? 'bg-gradient-accent text-accent-foreground' : 'border'}`}>
    <span className="text-xs uppercase tracking-wider opacity-80">{label}</span>
    <span className={`text-sm font-semibold ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
  </div>
);

export default AgencyPayments;
