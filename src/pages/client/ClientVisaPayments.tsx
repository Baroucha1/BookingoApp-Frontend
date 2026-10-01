
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CreditCard, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getClientPayments } from '@/service/payment.service.ts';
import type { Payment } from '@/lib/types.ts';
import AppLoading from '@/components/common/AppLoading';


const statusBadge: Record<string, string> = {
  PAID:     'bg-green-100 text-green-800 border-green-300',
  PENDING:  'bg-yellow-100 text-yellow-800 border-yellow-300',
  REFUNDED: 'bg-blue-100 text-blue-800 border-blue-300',
  FAILED:   'bg-red-100 text-red-800 border-red-300',
};

const statusLabel: Record<string, string> = {
  paid: 'Payé',
  pending: 'En attente',
  refunded: 'Remboursé',
  failed: 'Échec',
};

const ClientVisaPayments = () => {

  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading]   = useState(true);


  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem('token');
    fetch(`${import.meta.env.VITE_API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
        .then(r => r.json())
        .then(me => {
          const clientId = me.profile?.id;
          if (!clientId) return;
          return getClientPayments(clientId);
        })
        .then(data => { if (data) setPayments(data); })
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    getClientPayments(user.id)
        .then(data => {
          if (data) setPayments(data);
        })
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
  }, [user]);
  const total = payments.filter(p => p.status.toLowerCase() === 'paid').reduce((s, p) =>  s + Number(p.amount), 0);
  const pending = payments.filter(p => p.status.toLowerCase() === 'pending').reduce((s, p) => s + Number(p.amount), 0);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="card-hover">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground uppercase">Total payé</p>
            <p className="text-2xl font-bold mt-2 text-accent">{total.toLocaleString('fr-FR')} DZD</p>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground uppercase">En attente</p>
            <p className="text-2xl font-bold mt-2 text-warning">{pending.toLocaleString('fr-FR')} DZD</p>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground uppercase">Transactions</p>
            <p className="text-2xl font-bold mt-2">{payments.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>

            <TableHeader>

              <TableRow>
                <TableHead>Référence</TableHead>
                <TableHead>Demande</TableHead>
                <TableHead>Pays</TableHead>
                <TableHead>Méthode</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                  <TableRow>
                    <TableCell colSpan={7} className="p-8">
                      <AppLoading
                        fullScreen={false}
                        message="Chargement de vos paiements..."
                      />
                    </TableCell>
                  </TableRow>
              )}
              {payments.map(p => (
                <TableRow key={p.id} className="row-hover">
                  <TableCell className="font-mono text-xs">{p.id}</TableCell>
                  <TableCell className="font-mono text-xs">{p.visaApplication.id}</TableCell>
                  <TableCell>{p.visaApplication.visaType.country.nameFr}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm">
                      <CreditCard className="w-4 h-4 text-primary" /> {p.method}
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold">{p.amount.toLocaleString('fr-FR')} {p.currency}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(p.createdAt).toLocaleDateString('fr-FR')}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusBadge[p.status]}>
                      {p.status.toLowerCase() === 'paid' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                      {p.status.toLowerCase() === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                      {p.status.toLowerCase() === 'failed' && <XCircle className="w-3 h-3 mr-1" />}
                      {statusLabel[p.status.toLowerCase()]}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientVisaPayments;
