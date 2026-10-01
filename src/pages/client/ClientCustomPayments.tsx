import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wallet, CheckCircle2, Clock, XCircle, CreditCard } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
    getClientCustomPayments,

    type CustomPayment,
} from '@/service/payment.service.ts';
import {useNavigate} from "react-router-dom";
import AppLoading from '@/components/common/AppLoading';

const statusBadge: Record<string, string> = {
    PAID:    'bg-green-100 text-green-800 border-green-300',
    PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    FAILED:  'bg-red-100 text-red-800 border-red-300',
};

const statusLabel: Record<string, string> = {
    PAID:    'Payé',
    PENDING: 'En attente',
    FAILED:  'Échec',
};

const ClientCustomPayments = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [payments, setPayments] = useState<CustomPayment[]>([]);
    const [loading, setLoading]   = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadPayments = (clientId: string) => {
        getClientCustomPayments(clientId)
            .then(data => setPayments(data))
            .catch(err => setError(err.message ?? 'Impossible de charger les paiements'))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        if (!user) return;
        const token = localStorage.getItem('token');
        fetch(`${import.meta.env.VITE_API_URL}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(r => r.json())
            .then(me => {
                const clientId = me.profile?.id;
                if (!clientId) { setLoading(false); return; }
                loadPayments(clientId);
            })
            .catch(err => { console.error(err); setLoading(false); });
    }, [user]);


    const totalDue  = payments.filter(p => p.status === 'PENDING').reduce((s, p) => s + Number(p.amount), 0);
    const totalPaid = payments.filter(p => p.status === 'PAID').reduce((s, p) => s + Number(p.amount), 0);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="card-hover">
                    <CardContent className="p-5">
                        <p className="text-xs text-muted-foreground uppercase">À payer</p>
                        <p className="text-2xl font-bold mt-2 text-warning">{totalDue.toLocaleString('fr-FR')} DZD</p>
                    </CardContent>
                </Card>
                <Card className="card-hover">
                    <CardContent className="p-5">
                        <p className="text-xs text-muted-foreground uppercase">Total payé</p>
                        <p className="text-2xl font-bold mt-2 text-accent">{totalPaid.toLocaleString('fr-FR')} DZD</p>
                    </CardContent>
                </Card>
                <Card className="card-hover">
                    <CardContent className="p-5">
                        <p className="text-xs text-muted-foreground uppercase">Demandes</p>
                        <p className="text-2xl font-bold mt-2">{payments.length}</p>
                    </CardContent>
                </Card>
            </div>

            {error && (
                <div className="rounded-lg border border-red-300 bg-red-50 text-red-800 text-sm px-4 py-3">
                    {error}
                </div>
            )}

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Titre</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Montant</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && (
                                <TableRow>
                                    <TableCell colSpan={6} className="p-8">
                                        <AppLoading
                                            fullScreen={false}
                                            message="Chargement de vos demandes de paiement..."
                                        />
                                    </TableCell>
                                </TableRow>
                            )}
                            {!loading && payments.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        Aucune demande de paiement pour le moment
                                    </TableCell>
                                </TableRow>
                            )}
                            {payments.map(p => (
                                <TableRow key={p.id} className="row-hover">
                                    <TableCell className="font-medium flex items-center gap-2">
                                        <Wallet className="w-4 h-4 text-primary" /> {p.title}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                                        {p.description ?? '—'}
                                    </TableCell>
                                    <TableCell className="font-semibold">
                                        {Number(p.amount).toLocaleString('fr-FR')} {p.currency}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {new Date(p.createdAt).toLocaleDateString('fr-FR')}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={statusBadge[p.status]}>
                                            {p.status === 'PAID'    && <CheckCircle2 className="w-3 h-3 mr-1" />}
                                            {p.status === 'PENDING' && <Clock className="w-3 h-3 mr-1" />}
                                            {p.status === 'FAILED'  && <XCircle className="w-3 h-3 mr-1" />}
                                            {statusLabel[p.status]}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {p.status !== 'PAID' && (
                                            <Button size="sm" className="bg-gradient-primary text-white" onClick={() => navigate(`/client/custom-payments/${p.id}/pay`)}>
                                                <CreditCard className="w-4 h-4 mr-1" /> Payer
                                            </Button>
                                        )}
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

export default ClientCustomPayments;