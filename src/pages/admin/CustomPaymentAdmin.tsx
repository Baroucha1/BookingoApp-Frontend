import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Wallet, Loader2, Plus, CheckCircle2, Clock, XCircle, Search, User, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
    getAllCustomPayments,
    createCustomPayment,
    cancelCustomPayment,
    type CustomPayment,
} from '@/service/payment.service';
import { listUsers, type AdminUserRow } from '@/service/user.service';

const STATUS_LABEL: Record<string, string> = { PENDING: 'En attente', PAID: 'Payé', FAILED: 'Échoué' };
const STATUS_COLOR: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    PAID:    'bg-green-100 text-green-800 border-green-300',
    FAILED:  'bg-red-100 text-red-800 border-red-300',
};

const CustomPaymentsAdmin = () => {
    const { toast } = useToast();

    const [payments, setPayments] = useState<CustomPayment[]>([]);
    const [loading, setLoading]   = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);

    // ── client picker state ──
    const [allClients, setAllClients] = useState<AdminUserRow[]>([]);
    const [clientsLoaded, setClientsLoaded] = useState(false);
    const [clientsLoading, setClientsLoading] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedClient, setSelectedClient] = useState<AdminUserRow | null>(null);

    // ── create-form state ──
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const load = () => {
        setLoading(true);
        getAllCustomPayments()
            .then(setPayments)
            .catch(() => toast({ title: 'Erreur chargement paiements', variant: 'destructive' }))
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    // load the client list once, the first time the dialog opens
    useEffect(() => {
        if (!dialogOpen || clientsLoaded) return;
        setClientsLoading(true);
        listUsers('CLIENT')
            .then(users => { setAllClients(users); setClientsLoaded(true); })
            .catch(() => toast({ title: 'Erreur chargement clients', variant: 'destructive' }))
            .finally(() => setClientsLoading(false));
    }, [dialogOpen, clientsLoaded]);

    const results = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (q.length < 2) return [];
        return allClients.filter(u =>
            u.email.toLowerCase().includes(q) ||
            u.name.toLowerCase().includes(q) ||
            u.lastname.toLowerCase().includes(q)
        ).slice(0, 8);
    }, [allClients, query]);

    const resetForm = () => {
        setQuery(''); setSelectedClient(null);
        setTitle(''); setDescription(''); setAmount('');
    };

    const handleCreate = async () => {
        if (!selectedClient?.client) {
            toast({ title: 'Client requis', description: 'Veuillez sélectionner un client.', variant: 'destructive' });
            return;
        }
        const amountNum = Number(amount);
        if (!title.trim() || !amountNum || amountNum < 50) {
            toast({ title: 'Formulaire incomplet', description: 'Titre et montant (min 50 DZD) requis.', variant: 'destructive' });
            return;
        }

        setSubmitting(true);
        try {
            await createCustomPayment({
                clientId: selectedClient.client.id, // Client.id, not User.id
                title: title.trim(),
                description: description.trim() || undefined,
                amount: amountNum,
            });
            toast({ title: 'Demande de paiement créée', description: `Envoyée à ${selectedClient.email}` });
            setDialogOpen(false);
            resetForm();
            load();
        } catch (err: any) {
            toast({ title: 'Échec de la création', description: err.message, variant: 'destructive' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = async (id: string) => {
        if (!confirm('Annuler cette demande de paiement ?')) return;
        try {
            await cancelCustomPayment(id);
            toast({ title: 'Demande annulée' });
            load();
        } catch (err: any) {
            toast({ title: 'Échec', description: err.message, variant: 'destructive' });
        }
    };

    const totals = useMemo(() => ({
        due:  payments.filter(p => p.status === 'PENDING').reduce((s, p) => s + Number(p.amount), 0),
        paid: payments.filter(p => p.status === 'PAID').reduce((s, p) => s + Number(p.amount), 0),
    }), [payments]);

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
    );

    return (
        <div>
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold">Paiements personnalisés</h1>
                    <p className="text-sm text-muted-foreground mt-1">Créer et suivre des demandes de paiement ad hoc</p>
                </div>
                <Button onClick={() => setDialogOpen(true)} className="bg-gradient-primary text-white">
                    <Plus className="w-4 h-4 mr-1" /> Nouvelle demande
                </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                <Card><CardContent className="p-4">
                    <p className="text-xs text-muted-foreground uppercase">En attente</p>
                    <p className="text-2xl font-bold text-yellow-600 mt-1">{totals.due.toLocaleString('fr-FR')} DZD</p>
                </CardContent></Card>
                <Card><CardContent className="p-4">
                    <p className="text-xs text-muted-foreground uppercase">Encaissé</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">{totals.paid.toLocaleString('fr-FR')} DZD</p>
                </CardContent></Card>
                <Card><CardContent className="p-4">
                    <p className="text-xs text-muted-foreground uppercase">Total</p>
                    <p className="text-2xl font-bold mt-1">{payments.length}</p>
                </CardContent></Card>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Titre</TableHead>
                                <TableHead>Client</TableHead>
                                <TableHead>Montant</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-end">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {payments.map(p => (
                                <TableRow key={p.id}>
                                    <TableCell className="font-medium flex items-center gap-2">
                                        <Wallet className="w-4 h-4 text-primary" /> {p.title}
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {(p as any).client?.user?.email ?? p.clientId}
                                    </TableCell>
                                    <TableCell className="font-semibold">
                                        {Number(p.amount).toLocaleString('fr-FR')} {p.currency}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={STATUS_COLOR[p.status]}>
                                            {p.status === 'PAID'    && <CheckCircle2 className="w-3 h-3 mr-1" />}
                                            {p.status === 'PENDING' && <Clock className="w-3 h-3 mr-1" />}
                                            {p.status === 'FAILED'  && <XCircle className="w-3 h-3 mr-1" />}
                                            {STATUS_LABEL[p.status]}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {new Date(p.createdAt).toLocaleDateString('fr-FR')}
                                    </TableCell>
                                    <TableCell className="text-end">
                                        {p.status !== 'PAID' && (
                                            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleCancel(p.id)}>
                                                Annuler
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {payments.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                                        Aucune demande de paiement
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Create dialog */}
            <Dialog open={dialogOpen} onOpenChange={o => { setDialogOpen(o); if (!o) resetForm(); }}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Nouvelle demande de paiement</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* Client picker */}
                        <div>
                            <label className="text-sm font-medium mb-1 block">Client</label>
                            {selectedClient ? (
                                <div className="flex items-center justify-between rounded-lg border p-2.5">
                                    <div className="flex items-center gap-2">
                                        <User className="w-4 h-4 text-primary" />
                                        <div>
                                            <p className="text-sm font-medium">{selectedClient.name} {selectedClient.lastname}</p>
                                            <p className="text-xs text-muted-foreground">{selectedClient.email}</p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedClient(null)}>
                                        <X className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="relative">
                                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        value={query}
                                        onChange={e => setQuery(e.target.value)}
                                        placeholder="Rechercher par nom ou email..."
                                        className="pl-9"
                                    />
                                    {clientsLoading && (
                                        <div className="mt-1 text-xs text-muted-foreground flex items-center gap-1.5">
                                            <Loader2 className="w-3 h-3 animate-spin" /> Chargement des clients...
                                        </div>
                                    )}
                                    {!clientsLoading && query.trim().length >= 2 && (
                                        <div className="absolute z-10 mt-1 w-full rounded-lg border bg-white shadow-md max-h-48 overflow-y-auto">
                                            {results.length === 0 && (
                                                <div className="p-3 text-sm text-muted-foreground">Aucun client trouvé</div>
                                            )}
                                            {results.map(c => (
                                                <button
                                                    key={c.id}
                                                    className="w-full text-left px-3 py-2 hover:bg-muted/60 text-sm"
                                                    onClick={() => { setSelectedClient(c); setQuery(''); }}
                                                >
                                                    <p className="font-medium">{c.name} {c.lastname}</p>
                                                    <p className="text-xs text-muted-foreground">{c.email}</p>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-1 block">Titre</label>
                            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Frais supplémentaires" />
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-1 block">Description (optionnel)</label>
                            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} />
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-1 block">Montant (DZD)</label>
                            <Input type="number" min={50} value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
                        <Button onClick={handleCreate} disabled={submitting} className="bg-gradient-primary text-white">
                            {submitting ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
                            Créer la demande
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default CustomPaymentsAdmin;