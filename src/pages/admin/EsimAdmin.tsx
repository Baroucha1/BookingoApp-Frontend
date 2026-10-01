// src/pages/admin/EsimAdmin.tsx
import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent }            from '@/components/ui/card';
import { Button }                       from '@/components/ui/button';
import { Badge }                        from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle }              from '@/components/ui/dialog';
import { Eye, Wifi, Copy, Mail, Phone, MessageCircle, Loader2 }         from 'lucide-react';
import { useToast }                     from '@/hooks/use-toast';
import { QRCodeSVG }                    from 'qrcode.react';

const API = import.meta.env.VITE_API_URL;

// ─── Types ────────────────────────────────────────────────────────────────────
type EsimStatus         = 'PENDING' | 'SUCCESS' | 'FAILED';
type EsimDeliveryMethod = 'EMAIL' | 'WHATSAPP' | 'SMS';

interface EsimOrderRow {
    id:             string;
    gosimPaymentId: string;
    gosimPackageId: number;
    gosimBatchId:   string | null;
    locationCode:   string;
    locationName:   string;
    volumeBytes:    number;
    durationDays:   number;
    amount:         number;
    currency:       string;
    customerName:   string;
    customerEmail:  string;
    customerPhone:  string | null;
    deliveryMethod: EsimDeliveryMethod;
    status:         EsimStatus;
    iccid:          string | null;
    activationCode: string | null;
    createdAt:      string;
    client: null | {
        id:   string;
        user: { email: string; phone: string | null };
    };
}

// ─── Display maps ─────────────────────────────────────────────────────────────
const STATUS_LABEL: Record<EsimStatus, string> = {
    PENDING: 'En attente',
    SUCCESS: 'Activée',
    FAILED:  'Échouée',
};
const STATUS_COLOR: Record<EsimStatus, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    SUCCESS: 'bg-green-100  text-green-800  border-green-300',
    FAILED:  'bg-red-100    text-red-800    border-red-300',
};
const DELIVERY_ICON: Record<EsimDeliveryMethod, typeof Mail> = {
    EMAIL:    Mail,
    WHATSAPP: MessageCircle,
    SMS:      Phone,
};

const formatBytes = (bytes: number): string => {
    if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(0)} GB`;
    return `${(bytes / 1048576).toFixed(0)} MB`;
};

// ─── Component ────────────────────────────────────────────────────────────────
const EsimAdmin = () => {
    const { toast } = useToast();

    const [orders,       setOrders]       = useState<EsimOrderRow[]>([]);
    const [loading,      setLoading]      = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedId,   setSelectedId]   = useState<string | null>(null);

    // ── Load ──────────────────────────────────────────────────────────────────
    useEffect(() => {
        setLoading(true);
        const token = localStorage.getItem('token');
        fetch(`${API}/api/esim/admin/all`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(r => r.json())
            .then(data => setOrders(data.data ?? []))
            .catch(() => toast({ title: 'Erreur chargement eSIM', variant: 'destructive' }))
            .finally(() => setLoading(false));
    }, []);

    const selected = useMemo(() =>
            orders.find(o => o.id === selectedId) ?? null,
        [orders, selectedId]);

    const filtered = useMemo(() =>
            orders.filter(o => statusFilter === 'all' || o.status === statusFilter),
        [orders, statusFilter]);

    const totals = useMemo(() => ({
        total:   orders.length,
        success: orders.filter(o => o.status === 'SUCCESS').length,
        pending: orders.filter(o => o.status === 'PENDING').length,
        failed:  orders.filter(o => o.status === 'FAILED').length,
        revenue: orders.filter(o => o.status === 'SUCCESS').reduce((s, o) => s + Number(o.amount), 0),
    }), [orders]);

    const copy = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: `${label} copié !` });
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
                    <h1 className="text-2xl font-bold">eSIM</h1>
                    <p className="text-sm text-muted-foreground mt-1">Historique de tous les achats eSIM</p>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-44"><SelectValue placeholder="Statut" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tous statuts</SelectItem>
                        {(Object.keys(STATUS_LABEL) as EsimStatus[]).map(s =>
                            <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
                        )}
                    </SelectContent>
                </Select>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <Card><CardContent className="p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Total</p>
                    <p className="text-2xl font-bold mt-1">{totals.total}</p>
                </CardContent></Card>
                <Card><CardContent className="p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Activées</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">{totals.success}</p>
                </CardContent></Card>
                <Card><CardContent className="p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">En attente</p>
                    <p className="text-2xl font-bold text-yellow-600 mt-1">{totals.pending}</p>
                </CardContent></Card>
                <Card><CardContent className="p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Revenus</p>
                    <p className="text-2xl font-bold text-primary mt-1">{totals.revenue.toLocaleString('fr-FR')} DZD</p>
                </CardContent></Card>
            </div>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Référence</TableHead>
                                <TableHead>Client</TableHead>
                                <TableHead>Destination</TableHead>
                                <TableHead>Forfait</TableHead>
                                <TableHead>Montant</TableHead>
                                <TableHead>Livraison</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="w-16" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                                        Aucune commande eSIM
                                    </TableCell>
                                </TableRow>
                            )}
                            {filtered.map(order => {
                                const Icon = DELIVERY_ICON[order.deliveryMethod] ?? Mail;
                                return (
                                    <TableRow
                                        key={order.id}
                                        className="hover:bg-muted/40 cursor-pointer"
                                        onClick={() => setSelectedId(order.id)}
                                    >
                                        <TableCell className="font-mono text-xs">
                                            {order.gosimPaymentId ? order.gosimPaymentId.slice(0, 8).toUpperCase() : '—'}
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <p className="text-sm font-medium truncate max-w-[140px]">
                                                    {order.client?.user?.email ?? order.customerEmail}
                                                </p>
                                                <p className="text-xs text-muted-foreground">{order.customerName}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                                    <Wifi className="w-3.5 h-3.5 text-primary" />
                                                </div>
                                                <span className="text-sm font-medium">{order.locationName}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {formatBytes(order.volumeBytes)} · {order.durationDays}j
                                        </TableCell>
                                        <TableCell className="font-semibold">
                                            {Number(order.amount).toLocaleString('fr-FR')} {order.currency}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                                <Icon className="w-3.5 h-3.5" />
                                                {order.deliveryMethod}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={STATUS_COLOR[order.status]}>
                                                {STATUS_LABEL[order.status]}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                                        </TableCell>
                                        <TableCell onClick={e => e.stopPropagation()}>
                                            <Button variant="ghost" size="icon" onClick={() => setSelectedId(order.id)}>
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Detail dialog */}
            <Dialog open={!!selected} onOpenChange={o => { if (!o) setSelectedId(null); }}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 flex-wrap">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Wifi className="w-4 h-4 text-primary" />
                            </div>
                            {selected?.locationName}
                            {selected && (
                                <Badge variant="outline" className={STATUS_COLOR[selected.status]}>
                                    {STATUS_LABEL[selected.status]}
                                </Badge>
                            )}
                        </DialogTitle>
                    </DialogHeader>

                    {selected && (
                        <div className="space-y-4 mt-2">

                            {/* Forfait */}
                            <div className="grid grid-cols-3 gap-3 text-center border rounded-xl p-4 bg-muted/30">
                                <div>
                                    <p className="text-xs text-muted-foreground">Volume</p>
                                    <p className="font-bold">{formatBytes(selected.volumeBytes)}</p>
                                </div>
                                <div className="border-x border-border">
                                    <p className="text-xs text-muted-foreground">Durée</p>
                                    <p className="font-bold">{selected.durationDays} jours</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Prix</p>
                                    <p className="font-bold text-primary">
                                        {Number(selected.amount).toLocaleString('fr-FR')} {selected.currency}
                                    </p>
                                </div>
                            </div>

                            {/* QR Code */}
                            {selected.status === 'SUCCESS' && selected.activationCode && (
                                <div className="flex flex-col items-center gap-3 border rounded-xl p-5 bg-white">
                                    <QRCodeSVG value={selected.activationCode} size={140} />
                                    <p className="text-xs text-muted-foreground text-center">QR Code d'activation</p>
                                </div>
                            )}

                            {/* ICCID */}
                            {selected.iccid && (
                                <div className="bg-muted/40 rounded-xl p-4">
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="text-xs font-medium text-muted-foreground">ICCID</p>
                                        <button onClick={() => copy(selected.iccid!, 'ICCID')}
                                                className="text-muted-foreground hover:text-primary transition-colors">
                                            <Copy className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <p className="text-sm font-mono">{selected.iccid}</p>
                                </div>
                            )}

                            {/* Code activation */}
                            {selected.activationCode && (
                                <div className="bg-muted/40 rounded-xl p-4">
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="text-xs font-medium text-muted-foreground">Code d'activation</p>
                                        <button onClick={() => copy(selected.activationCode!, "Code d'activation")}
                                                className="text-muted-foreground hover:text-primary transition-colors">
                                            <Copy className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <p className="text-xs font-mono break-all">{selected.activationCode}</p>
                                </div>
                            )}

                            {/* Infos client */}
                            <div className="border rounded-xl p-4 space-y-2 text-sm">
                                <p className="font-semibold">Informations client</p>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                        <span className="text-muted-foreground">Nom :</span>{' '}
                                        <strong>{selected.customerName}</strong>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Email :</span>{' '}
                                        <strong>{selected.customerEmail}</strong>
                                    </div>
                                    {selected.customerPhone && (
                                        <div>
                                            <span className="text-muted-foreground">Téléphone :</span>{' '}
                                            <strong>{selected.customerPhone}</strong>
                                        </div>
                                    )}
                                    <div>
                                        <span className="text-muted-foreground">Livraison :</span>{' '}
                                        <strong>{selected.deliveryMethod}</strong>
                                    </div>
                                    <div className="col-span-2">
                                        <span className="text-muted-foreground">Payment ID :</span>{' '}
                                        <span className="font-mono text-xs">{selected.gosimPaymentId}</span>
                                    </div>
                                    {selected.gosimBatchId && (
                                        <div className="col-span-2">
                                            <span className="text-muted-foreground">Batch ID :</span>{' '}
                                            <span className="font-mono text-xs">{selected.gosimBatchId}</span>
                                        </div>
                                    )}
                                    <div className="col-span-2">
                                        <span className="text-muted-foreground">Date :</span>{' '}
                                        <strong>{new Date(selected.createdAt).toLocaleString('fr-FR')}</strong>
                                    </div>
                                </div>
                            </div>

                            {/* Compte lié */}
                            {selected.client && (
                                <div className="border rounded-xl p-4 text-sm">
                                    <p className="font-semibold mb-2">Compte lié</p>
                                    <div className="text-xs space-y-1">
                                        <div>
                                            <span className="text-muted-foreground">Email :</span>{' '}
                                            <strong>{selected.client.user.email}</strong>
                                        </div>
                                        {selected.client.user.phone && (
                                            <div>
                                                <span className="text-muted-foreground">Téléphone :</span>{' '}
                                                <strong>{selected.client.user.phone}</strong>
                                            </div>
                                        )}
                                        <div>
                                            <span className="text-muted-foreground">Client ID :</span>{' '}
                                            <span className="font-mono">{selected.client.id}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default EsimAdmin;