import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Eye, Loader2, Plane, Users, Ticket,
    User, Building, CheckCircle2, AlertCircle, ShieldQuestion, Ban,Mail,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
    getAdminFlightBookings,
    updateFlightPaymentStatus,
    issueFlightTicket,
    resendFlightTicket,
    voidOrCancelFlightBooking,
    markBookingVoided,
    checkBookingOrderStatus, AmadeusOrderDetail,
} from '@/service/flights/flightBooking.admin.service.ts';

// ── Types ─────────────────────────────────────────────────────────────────────
type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'CANCELLED';
type BookingStatus = 'BOOKED' | 'PAID' | 'TICKETED' | 'CANCELLED' | 'VOIDED' | 'FAILED';

interface Passenger {
    id:             string;
    paxType:        string;
    passengerTitle: string;
    firstName:      string;
    lastName:       string;
    birthday:       string;
    sexe:           string;
    nationality:    string;
    typeDoc:        string;
    passportNumber: string;
    expiryDate:     string;
    mail:           string | null;
    tel:            string | null;
}

interface Payment {
    id:       string;
    amount:   number;
    currency: string;
    method:   string;
    status:   PaymentStatus;
    paidAt:   string | null;
}

interface FlightBookingRow {
    id:               string;
    pnr:              string | null;
    uniqueId:         string | null;
    fareSourceCode:   string;
    totalAmount:      number;
    currency:         string;
    departureAirport: string | null;
    arrivalAirport:   string | null;
    departureDate:    string | null;
    airlineCode:      string | null;
    airlineName:      string | null;
    baggage:          string | null;
    cabinClass:       string | null;
    createdAt:        string;
    clientId:         string | null;
    agencyId:         string | null;
    office: { id: string; name: string; wilaya: string; subtitle: string | null } | null;
    deliveryAddress:  string | null;
    deliveryWilaya:   string | null;
    deliveryCity:     string | null;
    deliveryPhone:    string | null;
    payment:          Payment | null;
    passengers:       Passenger[];
    client: null | {
        id:   string;
        user: { email: string; phone: string | null };
    };
    agency: null | {
        id:   string;
        user: { email: string; phone: string | null };
    };
    status:        BookingStatus;
    ticketedAt:    string | null;
    ticketNumbers: string[];
}

// ── Maps ──────────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<PaymentStatus, string> = {
    PENDING:   'Pending',
    PAID:      'Paied',
    FAILED:    'Failed',
    REFUNDED:  'Refunded',
    CANCELLED: 'Cancelled',
};
const STATUS_COLOR: Record<PaymentStatus, string> = {
    PENDING:   'bg-yellow-100 text-yellow-800 border-yellow-300',
    PAID:      'bg-green-100  text-green-800  border-green-300',
    FAILED:    'bg-red-100    text-red-800    border-red-300',
    REFUNDED:  'bg-orange-100 text-orange-800 border-orange-300',
    CANCELLED: 'bg-slate-100  text-slate-700  border-slate-300',
};
const ALL_STATUSES: PaymentStatus[] = ['PENDING', 'PAID', 'FAILED', 'REFUNDED', 'CANCELLED'];

const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
    BOOKED:    'Réservé',
    PAID:      'Payé',
    TICKETED:  'Émis',
    CANCELLED: 'Annulé',
    VOIDED:    'Voidé',
    FAILED:    'Échoué',
};
const BOOKING_STATUS_COLOR: Record<BookingStatus, string> = {
    BOOKED:    'bg-slate-100  text-slate-700  border-slate-300',
    PAID:      'bg-green-100  text-green-800  border-green-300',
    TICKETED:  'bg-blue-100   text-blue-800   border-blue-300',
    CANCELLED: 'bg-red-100    text-red-800    border-red-300',
    VOIDED:    'bg-orange-100 text-orange-800 border-orange-300',
    FAILED:    'bg-red-100    text-red-800    border-red-300',
};

const PAX_LABEL: Record<string, string> = { ADT: 'Adulte', CHD: 'Enfant', INF: 'Nourrisson' };

const isClosed = (status: BookingStatus) => status === 'CANCELLED' || status === 'VOIDED';

// ── Component ─────────────────────────────────────────────────────────────────
const FlightBookingsAdmin = () => {
    const { toast } = useToast();

    const [bookings, setBookings]         = useState<FlightBookingRow[]>([]);
    const [loading, setLoading]           = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedId, setSelectedId]     = useState<string | null>(null);
    const [updatingId, setUpdatingId]     = useState<string | null>(null);
    const [ticketing, setTicketing]       = useState(false);
    const [cancelling, setCancelling]     = useState(false);
    const [flaggingVoid, setFlaggingVoid] = useState(false);
    const [verifying, setVerifying]       = useState(false);
    const [verifyResult, setVerifyResult] = useState<{ exists: boolean; order: AmadeusOrderDetail | null } | null>(null);
    const [resending, setResending] = useState(false);


    // ── Load ──
    const load = () => {
        setLoading(true);
        getAdminFlightBookings()
            .then(data => setBookings(data))
            .catch(() => toast({ title: 'Erreur chargement réservations', variant: 'destructive' }))
            .finally(() => setLoading(false));
    };
    useEffect(load, []);

    const selected = useMemo(() => bookings.find(b => b.id === selectedId) ?? null, [bookings, selectedId]);

    // reset the verify banner whenever a different booking is opened
    useEffect(() => { setVerifyResult(null); }, [selectedId]);

    const filtered = useMemo(() =>
        bookings.filter(b =>
            statusFilter === 'all' || b.payment?.status === statusFilter
        ), [bookings, statusFilter]);

    // ── Stat cards ──
    const totals = useMemo(() => ({
        total:    bookings.length,
        paid:     bookings.filter(b => b.payment?.status === 'PAID').reduce((s, b) => s + Number(b.totalAmount), 0),
        pending:  bookings.filter(b => b.payment?.status === 'PENDING').length,
        failed:   bookings.filter(b => b.payment?.status === 'FAILED').length,
    }), [bookings]);

    // ── Update payment status ──
    const handleStatusChange = async (bookingId: string, newStatus: string) => {
        setUpdatingId(bookingId);
        try {
            const updated = await updateFlightPaymentStatus(bookingId, newStatus);
            setBookings(prev => prev.map(b =>
                b.id === bookingId ? { ...b, payment: b.payment ? { ...b.payment, ...updated } : updated } : b
            ));
            toast({ title: `Statut mis à jour → ${STATUS_LABEL[newStatus as PaymentStatus]}` });
        } catch {
            toast({ title: 'Erreur mise à jour statut', variant: 'destructive' });
        } finally {
            setUpdatingId(null);
        }
    };

    // ── Cancel (pre-ticket, real Amadeus call) ──
    const handleCancel = async () => {
        if (!selected) return;
        if (!window.confirm('Voulez-vous vraiment annuler cette réservation ? Cette action est irréversible.')) return;

        setCancelling(true);
        try {
            await voidOrCancelFlightBooking(selected.id);
            toast({ title: 'Réservation annulée' });
            load();
        } catch (e: any) {
            toast({ title: 'Échec annulation', description: e?.message ?? '', variant: 'destructive' });
        } finally {
            setCancelling(false);
        }
    };

    // ── Mark voided (post-ticket, manual record — no API call to Amadeus) ──
    const handleMarkVoided = async () => {
        if (!selected) return;
        if (!window.confirm('Confirmer que ce billet a été voidé manuellement dans Amadeus ? Ceci met uniquement à jour le tableau de bord.')) return;

        setFlaggingVoid(true);
        try {
            await markBookingVoided(selected.id);
            toast({ title: 'Réservation marquée comme voidée' });
            load();
        } catch (e: any) {
            toast({ title: 'Échec du marquage', description: e?.message ?? '', variant: 'destructive' });
        } finally {
            setFlaggingVoid(false);
        }
    };

    // ── Verify against Amadeus (does the order still exist?) ──
    const handleVerify = async () => {
        if (!selected) return;
        setVerifying(true);
        setVerifyResult(null);
        try {
            const result = await checkBookingOrderStatus(selected.id);
            setVerifyResult(result);
        } catch (e: any) {
            toast({ title: 'Échec de la vérification', description: e?.message ?? '', variant: 'destructive' });
        } finally {
            setVerifying(false);
        }
    };

    // ── Issue ticket ──
    const handleIssueTicket = async () => {
        if (!selected) return;
        setTicketing(true);
        try {
            await issueFlightTicket(selected.id);
            toast({ title: '✅ Billet émis avec succès', description: `PNR: ${selected.pnr}` });
            load(); // refresh
        } catch (e: any) {
            toast({ title: 'Échec émission billet', description: e?.message ?? '', variant: 'destructive' });
        } finally {
            setTicketing(false);
        }
    };

    const handleResendTicket = async () => {
        if (!selected) return;
        setResending(true);
        try {
            const { to } = await resendFlightTicket(selected.id);
            toast({ title: 'Billet renvoyé', description: `Envoyé à ${to}` });
        } catch (e: any) {
            toast({ title: 'Échec de l\'envoi', description: e?.message ?? '', variant: 'destructive' });
        } finally {
            setResending(false);
        }
    };

    // ── Helpers ──
    const ownerEmail = (b: FlightBookingRow) =>
        b.client?.user?.email ?? b.agency?.user?.email ?? '—';

    const ownerType = (b: FlightBookingRow): 'client' | 'agency' | null => {
        if (b.clientId) return 'client';
        if (b.agencyId) return 'agency';
        return null;
    };

    const route = (b: FlightBookingRow) =>
        b.departureAirport && b.arrivalAirport
            ? `${b.departureAirport} → ${b.arrivalAirport}`
            : '—';

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
                    <h1 className="text-2xl font-bold">Réservations de vols</h1>
                    <p className="text-sm text-muted-foreground mt-1">Suivi des billets et paiements</p>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-44"><SelectValue placeholder="Statut paiement" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tous statuts</SelectItem>
                        {ALL_STATUSES.map(s => (
                            <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
                        ))}
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
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Encaissé</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">{totals.paid.toLocaleString('fr-FR')} DZD</p>
                </CardContent></Card>
                <Card><CardContent className="p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">En attente</p>
                    <p className="text-2xl font-bold text-yellow-600 mt-1">{totals.pending}</p>
                </CardContent></Card>
                <Card><CardContent className="p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Échoué</p>
                    <p className="text-2xl font-bold text-red-500 mt-1">{totals.failed}</p>
                </CardContent></Card>
            </div>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>PNR</TableHead>
                                <TableHead>Client</TableHead>
                                <TableHead>Agence de paiement</TableHead>
                                <TableHead>Route</TableHead>
                                <TableHead>Départ</TableHead>
                                <TableHead>Montant</TableHead>
                                <TableHead>Statut paiement</TableHead>
                                <TableHead>Statut réservation</TableHead>
                                <TableHead>Réservé le</TableHead>
                                <TableHead className="text-end">Détails</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.map(b => {
                                const type = ownerType(b);
                                const payStatus = b.payment?.status ?? 'PENDING';
                                return (
                                    <TableRow
                                        key={b.id}
                                        className="hover:bg-muted/40 cursor-pointer"
                                        onClick={() => setSelectedId(b.id)}
                                    >
                                        <TableCell className="font-mono font-semibold text-sm">
                                            {b.pnr ?? <span className="text-muted-foreground text-xs">—</span>}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {type === 'agency'
                                                    ? <Building className="w-3.5 h-3.5 text-muted-foreground" />
                                                    : <User    className="w-3.5 h-3.5 text-muted-foreground" />}
                                                <div>
                                                    <div className="text-sm font-medium truncate max-w-[140px]">{ownerEmail(b)}</div>
                                                    {type && (
                                                        <Badge variant="outline" className="text-[10px] h-4 mt-0.5">
                                                            {type === 'agency' ? 'Agence' : 'Client'}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {b.office ? (
                                                <div>
                                                    <div className="font-medium">{b.office.name}</div>
                                                    <div className="text-xs text-muted-foreground">{b.office.wilaya}</div>
                                                </div>
                                            ) : <span className="text-muted-foreground">—</span>}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1 text-sm font-medium">
                                                <Plane className="w-3.5 h-3.5 text-muted-foreground" />
                                                {route(b)}
                                            </div>
                                            {b.airlineCode && (
                                                <span className="text-xs text-muted-foreground">{b.airlineName ?? b.airlineCode}</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {b.departureDate
                                                ? new Date(b.departureDate).toLocaleDateString('fr-FR')
                                                : '—'}
                                        </TableCell>
                                        <TableCell className="font-semibold">
                                            {Number(b.totalAmount).toLocaleString('fr-FR')} {b.currency}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={STATUS_COLOR[payStatus as PaymentStatus] ?? ''}>
                                                {STATUS_LABEL[payStatus as PaymentStatus] ?? payStatus}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={BOOKING_STATUS_COLOR[b.status] ?? ''}>
                                                {BOOKING_STATUS_LABEL[b.status] ?? b.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {new Date(b.createdAt).toLocaleDateString('fr-FR')}
                                        </TableCell>
                                        <TableCell className="text-end" onClick={e => e.stopPropagation()}>
                                            <Button variant="ghost" size="icon" onClick={() => setSelectedId(b.id)}>
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {filtered.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={10} className="text-center text-muted-foreground py-10">
                                        Aucune réservation trouvée
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* ── Detail dialog ── */}
            <Dialog open={!!selected} onOpenChange={o => { if (!o) setSelectedId(null); }}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 flex-wrap">
                            <span>Réservation {selected?.pnr ?? selected?.id?.slice(0, 8).toUpperCase()}</span>
                            {selected?.payment && (
                                <Badge variant="outline" className={STATUS_COLOR[selected.payment.status]}>
                                    {STATUS_LABEL[selected.payment.status]}
                                </Badge>
                            )}
                            {selected && (
                                <Badge variant="outline" className={BOOKING_STATUS_COLOR[selected.status]}>
                                    {BOOKING_STATUS_LABEL[selected.status]}
                                </Badge>
                            )}
                        </DialogTitle>
                    </DialogHeader>

                    {selected && (
                        <Tabs defaultValue="vol" className="mt-2">
                            <TabsList className="grid grid-cols-3 w-full">
                                <TabsTrigger value="vol">Vol</TabsTrigger>
                                <TabsTrigger value="passagers">
                                    Passagers
                                    {selected.passengers.length > 0 && (
                                        <span className="ml-1.5 text-[10px] bg-muted rounded-full px-1.5 py-0.5">
                      {selected.passengers.length}
                    </span>
                                    )}
                                </TabsTrigger>
                                <TabsTrigger value="paiement">Paiement</TabsTrigger>
                            </TabsList>

                            {/* ── Vol tab ── */}
                            <TabsContent value="vol" className="space-y-4 mt-4">
                                <div className="grid grid-cols-2 gap-3 text-sm rounded-lg border p-4 bg-muted/30">
                                    <div><span className="text-muted-foreground">PNR:</span> <strong className="font-mono">{selected.pnr ?? '—'}</strong></div>
                                    <div><span className="text-muted-foreground">Unique ID:</span> <span className="font-mono text-xs">{selected.uniqueId ?? '—'}</span></div>
                                    <div><span className="text-muted-foreground">Route:</span> <strong>{route(selected)}</strong></div>
                                    <div><span className="text-muted-foreground">Compagnie:</span> {selected.airlineName ?? selected.airlineCode ?? '—'}</div>
                                    <div>
                                        <span className="text-muted-foreground">Départ:</span>{' '}
                                        {selected.departureDate ? new Date(selected.departureDate).toLocaleString('fr-FR') : '—'}
                                    </div>
                                    <div><span className="text-muted-foreground">Classe:</span> {selected.cabinClass ?? '—'}</div>
                                    <div><span className="text-muted-foreground">Bagages:</span> {selected.baggage ?? '—'}</div>
                                    <div><span className="text-muted-foreground">Réservé le:</span> {new Date(selected.createdAt).toLocaleString('fr-FR')}</div>
                                    <div className="col-span-2">
                                        <span className="text-muted-foreground">Fare Source:</span>{' '}
                                        <span className="font-mono text-xs break-all">{selected.fareSourceCode}</span>
                                    </div>
                                </div>

                                {/* Owner */}
                                <div className="rounded-lg border p-3 flex items-center gap-3 text-sm">
                                    {ownerType(selected) === 'agency'
                                        ? <Building className="w-4 h-4 text-muted-foreground shrink-0" />
                                        : <User     className="w-4 h-4 text-muted-foreground shrink-0" />}
                                    <div>
                                        <span className="font-medium">{ownerEmail(selected)}</span>
                                        {(selected.client?.user?.phone ?? selected.agency?.user?.phone) && (
                                            <span className="ml-2 text-muted-foreground text-xs">
                        {selected.client?.user?.phone ?? selected.agency?.user?.phone}
                      </span>
                                        )}
                                    </div>
                                    <Badge variant="outline" className="ml-auto text-[10px]">
                                        {ownerType(selected) === 'agency' ? 'Agence' : 'Client'}
                                    </Badge>
                                </div>

                                {/* Verify against Amadeus */}
                                <div className="rounded-lg border p-4 space-y-3">
                                    <div className="flex items-center justify-between gap-4">
                                        <div>
                                            <p className="text-sm font-semibold flex items-center gap-2">
                                                <ShieldQuestion className="w-4 h-4 text-muted-foreground" />
                                                Vérifier auprès d'Amadeus
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                Confirme si ce PNR existe toujours côté Amadeus (utile après un void manuel en agence).
                                            </p>
                                        </div>
                                        <Button variant="outline" size="sm" onClick={handleVerify} disabled={verifying || !selected.pnr}>
                                            {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                            Vérifier
                                        </Button>
                                    </div>
                                    {verifyResult && (
                                        <div className="space-y-3">
                                            <div className={`text-xs rounded-md px-3 py-2 ${verifyResult.exists ? 'bg-green-50 text-green-800' : 'bg-orange-50 text-orange-800'}`}>
                                                {verifyResult.exists
                                                    ? '✓ Ce PNR existe toujours sur Amadeus.'
                                                    : "⚠️ Ce PNR n'existe plus sur Amadeus — probablement annulé ou voidé manuellement. Pensez à mettre à jour le statut ci-dessous."}
                                            </div>

                                            {verifyResult.exists && verifyResult.order && (
                                                <div className="rounded-lg border p-4 space-y-3 text-sm bg-white">
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div><span className="text-muted-foreground">Order ID:</span> <span className="font-mono text-xs">{verifyResult.order.orderId}</span></div>
                                                        <div><span className="text-muted-foreground">Office:</span> {verifyResult.order.queuingOfficeId ?? '—'}</div>
                                                        <div><span className="text-muted-foreground">Compagnie validante:</span> {verifyResult.order.validatingAirline ?? '—'}</div>
                                                        {verifyResult.order.price && (
                                                            <div><span className="text-muted-foreground">Prix:</span> <strong>{verifyResult.order.price.total} {verifyResult.order.price.currency}</strong></div>
                                                        )}
                                                    </div>

                                                    <div className="space-y-2">
                                                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Segments</p>
                                                        {verifyResult.order.itineraries.flatMap((it) => it.segments).map((seg, i) => (
                                                            <div key={i} className="rounded border p-2 flex items-center justify-between text-xs">
                                                                <span className="font-mono">{seg.carrierCode}{seg.flightNumber}</span>
                                                                <span>{seg.departure.iataCode} → {seg.arrival.iataCode}</span>
                                                                <span>{new Date(seg.departure.at).toLocaleString('fr-FR')}</span>
                                                                <Badge variant="outline" className="text-[10px]">{seg.bookingStatus}</Badge>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <div className="space-y-2">
                                                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Voyageurs</p>
                                                        {verifyResult.order.travelers.map((t) => (
                                                            <div key={t.id} className="rounded border p-2 text-xs">
                                                                <div className="font-medium">{t.firstName} {t.lastName}</div>
                                                                {t.document && <div className="text-muted-foreground">Passeport: {t.document.number}</div>}
                                                                {t.email && <div className="text-muted-foreground">{t.email}</div>}
                                                                {t.phone && <div className="text-muted-foreground">{t.phone}</div>}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            {/* ── Passagers tab ── */}
                            <TabsContent value="passagers" className="mt-4 space-y-2">
                                {selected.passengers.length === 0
                                    ? <p className="text-sm text-muted-foreground">Aucun passager enregistré.</p>
                                    : selected.passengers.map(p => (
                                        <div key={p.id} className="rounded-lg border bg-card px-4 py-3 text-sm grid grid-cols-2 gap-x-4 gap-y-1">
                                            <div className="col-span-2 flex items-center gap-2 mb-1">
                                                <Users className="w-3.5 h-3.5 text-muted-foreground" />
                                                <span className="font-semibold">{p.passengerTitle} {p.firstName} {p.lastName}</span>
                                                <Badge variant="outline" className="text-[10px] h-4">
                                                    {PAX_LABEL[p.paxType] ?? p.paxType}
                                                </Badge>
                                            </div>
                                            <div><span className="text-muted-foreground">Passeport:</span> <span className="font-mono">{p.passportNumber}</span></div>
                                            <div><span className="text-muted-foreground">Nationalité:</span> {p.nationality}</div>
                                            <div><span className="text-muted-foreground">Naissance:</span> {new Date(p.birthday).toLocaleDateString('fr-FR')}</div>
                                            <div><span className="text-muted-foreground">Expiration:</span> {new Date(p.expiryDate).toLocaleDateString('fr-FR')}</div>
                                            {p.mail && <div className="col-span-2"><span className="text-muted-foreground">Email:</span> {p.mail}</div>}
                                            {p.tel  && <div className="col-span-2"><span className="text-muted-foreground">Tél:</span> {p.tel}</div>}
                                        </div>
                                    ))
                                }
                            </TabsContent>

                            {/* ── Paiement tab ── */}
                            <TabsContent value="paiement" className="mt-4 space-y-4">
                                {selected.payment ? (
                                    <>
                                        <div className="grid grid-cols-2 gap-3 text-sm rounded-lg border p-4 bg-muted/30">
                                            <div><span className="text-muted-foreground">ID paiement:</span> <span className="font-mono text-xs">{selected.payment.id}</span></div>
                                            <div><span className="text-muted-foreground">Méthode:</span> {selected.payment.method}</div>
                                            <div><span className="text-muted-foreground">Montant:</span> <strong>{Number(selected.payment.amount).toLocaleString('fr-FR')} {selected.payment.currency}</strong></div>
                                            <div>
                                                <span className="text-muted-foreground">Payé le:</span>{' '}
                                                {selected.payment.paidAt ? new Date(selected.payment.paidAt).toLocaleString('fr-FR') : '—'}
                                            </div>
                                        </div>

                                        {selected.payment.method === 'DELIVERY' && (
                                            <div className="rounded-lg border p-4 space-y-2 text-sm">
                                                <h4 className="font-semibold">Formulaire de livraison</h4>
                                                <div><span className="text-muted-foreground">Adresse:</span> {selected.deliveryAddress || '—'}</div>
                                                <div><span className="text-muted-foreground">Wilaya:</span> {selected.deliveryWilaya || '—'}</div>
                                                <div><span className="text-muted-foreground">Ville:</span> {selected.deliveryCity || '—'}</div>
                                                <div><span className="text-muted-foreground">Téléphone:</span> {selected.deliveryPhone || '—'}</div>
                                            </div>
                                        )}

                                        {selected.office && (
                                            <div className="rounded-lg border p-4 space-y-2 text-sm">
                                                <h4 className="font-semibold">Agence de paiement</h4>
                                                <div>{selected.office.name}, {selected.office.wilaya}</div>
                                                {selected.office.subtitle && <div className="text-muted-foreground">{selected.office.subtitle}</div>}
                                            </div>
                                        )}

                                        {/* Status changer */}
                                        <div className="rounded-lg border p-4 space-y-3">
                                            <p className="text-sm font-semibold">Changer le statut de paiement</p>
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <Select
                                                    value={selected.payment.status}
                                                    onValueChange={v => handleStatusChange(selected.id, v)}
                                                    disabled={!!updatingId}
                                                >
                                                    <SelectTrigger className="w-48">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {ALL_STATUSES.map(s => (
                                                            <SelectItem key={s} value={s}>
                                                        <span className="flex items-center gap-2">
                                                          {s === 'PAID'    && <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />}
                                                            {s === 'FAILED'  && <AlertCircle  className="w-3.5 h-3.5 text-red-500"   />}
                                                            {STATUS_LABEL[s]}
                                                        </span>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                {updatingId === selected.id && (
                                                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                                                )}
                                            </div>
                                        </div>

                                        {/* Issue ticket — only when payment is PAID, not yet ticketed, and not cancelled/voided */}
                                        {selected.payment.status === 'PAID' && !isClosed(selected.status) && (
                                            <div className={`rounded-lg border p-4 flex items-center justify-between gap-4 ${
                                                selected.status === 'TICKETED'
                                                    ? 'border-blue-200 bg-blue-50'
                                                    : 'border-green-200 bg-green-50'
                                            }`}>
                                                <div>
                                                    <p className={`text-sm font-semibold ${selected.status === 'TICKETED' ? 'text-blue-800' : 'text-green-800'}`}>
                                                        {selected.status === 'TICKETED' ? 'Billet déjà émis' : 'Paiement confirmé'}
                                                    </p>
                                                    <p className={`text-xs mt-0.5 ${selected.status === 'TICKETED' ? 'text-blue-700' : 'text-green-700'}`}>
                                                        {selected.status === 'TICKETED'
                                                            ? `Émis le ${selected.ticketedAt ? new Date(selected.ticketedAt).toLocaleString('fr-FR') : '—'}`
                                                            : 'Le billet peut maintenant être émis via Worldsoft.'}
                                                    </p>
                                                    {selected.ticketNumbers?.length > 0 && (
                                                        <p className="text-xs font-mono text-blue-800 mt-1">{selected.ticketNumbers.join(', ')}</p>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    {selected.status === 'TICKETED' && (
                                                        <Button
                                                            variant="outline"
                                                            className="border-blue-300 text-blue-700 hover:bg-blue-100 gap-2"
                                                            onClick={handleResendTicket}
                                                            disabled={resending}
                                                        >
                                                            {resending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                                                            Renvoyer le billet
                                                        </Button>
                                                    )}
                                                    <Button
                                                        className="bg-green-600 hover:bg-green-700 text-white gap-2"
                                                        onClick={handleIssueTicket}
                                                        disabled={ticketing || selected.status === 'TICKETED'}
                                                    >
                                                        {ticketing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ticket className="w-4 h-4" />}
                                                        {selected.status === 'TICKETED' ? 'Déjà émis' : 'Émettre le billet'}
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Cancel — only pre-ticket, real Amadeus DELETE, unavailable once TICKETED */}
                                        {!selected.ticketedAt && !isClosed(selected.status) && (
                                            <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-center justify-between gap-4">
                                                <div>
                                                    <p className="text-sm font-semibold text-red-800">Annuler la réservation</p>
                                                    <p className="text-xs text-red-700 mt-0.5">
                                                        Libère la réservation avant émission du billet. Une fois le billet émis, l'annulation via l'API n'est plus disponible.
                                                    </p>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    className="border-red-300 text-red-700 hover:bg-red-100 shrink-0 gap-2"
                                                    onClick={handleCancel}
                                                    disabled={cancelling}
                                                >
                                                    {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                                                    Annuler
                                                </Button>
                                            </div>
                                        )}

                                        {/* Mark voided — only post-ticket, manual dashboard flag, no Amadeus call */}
                                        {selected.ticketedAt && !isClosed(selected.status) && (
                                            <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 flex items-center justify-between gap-4">
                                                <div>
                                                    <p className="text-sm font-semibold text-orange-800">Marquer comme voidé</p>
                                                    <p className="text-xs text-orange-700 mt-0.5">
                                                        Le void automatique n'est pas disponible pour un billet déjà émis — les agents voident manuellement dans Amadeus. Utilisez ce bouton pour refléter cette action sur le tableau de bord.
                                                    </p>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    className="border-orange-300 text-orange-700 hover:bg-orange-100 shrink-0 gap-2"
                                                    onClick={handleMarkVoided}
                                                    disabled={flaggingVoid}
                                                >
                                                    {flaggingVoid ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                                                    Marquer voidé
                                                </Button>
                                            </div>
                                        )}

                                        {isClosed(selected.status) && (
                                            <div className="rounded-lg border p-4 bg-muted/30 text-sm text-muted-foreground">
                                                Cette réservation est {BOOKING_STATUS_LABEL[selected.status].toLowerCase()} — aucune action supplémentaire disponible.
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <p className="text-sm text-muted-foreground">Aucun enregistrement de paiement.</p>
                                )}
                            </TabsContent>
                        </Tabs>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default FlightBookingsAdmin;