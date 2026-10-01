// src/pages/payment/SatimResult.tsx — hotel-specific changes only, rest unchanged

import { useEffect, useRef, useState, useCallback } from 'react';
import html2pdf from 'html2pdf.js';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, Loader2, AlertCircle, XCircle, Download, Printer, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import confetti from 'canvas-confetti';

import {
    getReceipt,
    confirmSatimPayment,
    confirmFlightSatimPayment,
    type ReceiptData,
} from '@/service/payment.service';
import { confirmHotelPayment } from '@/service/hotels/hotels.service';

type Status  = 'PENDING' | 'PAID' | 'FAILED';
type PayType = 'visa' | 'flight' | 'hotel';

const formatAmount = (amount: number | string) => `${Number(amount).toFixed(2)} DA`;

const SatimResult = () => {
    const [searchParams] = useSearchParams();
    const navigate       = useNavigate();
    const { toast }      = useToast();

    const type          = (searchParams.get('type') ?? 'visa') as PayType;
    const applicationId = searchParams.get('applicationId');
    const bookingId     = searchParams.get('bookingId'); // flight only now
    const bookingToken  = searchParams.get('bt');         // hotel only

    const [payment,      setPayment]      = useState<any>(null);
    const [pendingMsg,   setPendingMsg]   = useState<string | null>(null); // hotel pending_verification
    const [receipt,      setReceipt]      = useState<ReceiptData | null>(null);
    const [status,       setStatus]       = useState<Status>('PENDING');
    const [loading,      setLoading]      = useState(true);
    const [error,        setError]        = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [sendingEmail, setSendingEmail] = useState(false);
    const confettiFired                   = useRef(false);
    const receiptRef                      = useRef<HTMLDivElement>(null);

    const fireConfetti = () => {
        if (confettiFired.current) return;
        confettiFired.current = true;
        const burst = (origin: { x: number; y: number }) =>
            confetti({ particleCount: 80, spread: 70, origin, colors: ['#0865FE', '#3B2F7E', '#FFB400'] });
        burst({ x: 0.5, y: 0.4 });
        setTimeout(() => burst({ x: 0.2, y: 0.6 }), 200);
        setTimeout(() => burst({ x: 0.8, y: 0.6 }), 400);
    };

    const handlePaid = async (id: string) => {
        setStatus('PAID');
        setLoading(false);
        if (type === 'visa') {
            localStorage.removeItem('apply_draft');
            try {
                const r = await getReceipt(id);
                setReceipt(r);
            } catch { /* non bloquant */ }
        }
        fireConfetti();
    };

    useEffect(() => {
        // hotel has no pre-existing id to check — bookingToken IS the record,
        // nothing was persisted before this point
        if (type === 'hotel') {
            if (!bookingToken) { setError('Jeton de réservation introuvable.'); setLoading(false); return; }
        } else {
            const id = type === 'flight' ? bookingId : applicationId;
            if (!id) { setError('Référence introuvable.'); setLoading(false); return; }
        }

        let cancelled = false;

        const confirm = async () => {
            try {
                if (type === 'visa' && applicationId) {
                    const orderId = searchParams.get('mdOrder') ?? searchParams.get('orderId');
                    if (!orderId) { setError('Référence de commande introuvable.'); setLoading(false); return; }
                    const result = await confirmSatimPayment(applicationId, orderId);
                    if (cancelled) return;
                    setPayment(result.payment);
                    await handlePaid(applicationId);
                } else if (type === 'flight' && bookingId) {
                    const orderId = searchParams.get('mdOrder') ?? searchParams.get('orderId');
                    if (!orderId) { setError('Référence de commande introuvable.'); setLoading(false); return; }
                    const result = await confirmFlightSatimPayment(bookingId, orderId);
                    if (cancelled) return;
                    setPayment(result.payment);
                    await handlePaid(bookingId);
                } else if (type === 'hotel' && bookingToken) {
                    // orderId was stashed by HotelCheckout right before redirect,
                    // keyed by this same bookingToken — bt alone isn't enough
                    // since it doesn't carry orderId inside it
                    const orderId = sessionStorage.getItem(`hotel_satim_orderId_${bookingToken}`);
                    if (!orderId) { setError('Référence de commande introuvable.'); setLoading(false); return; }

                    const result = await confirmHotelPayment({ bookingToken, orderId });
                    if (cancelled) return;

                    sessionStorage.removeItem(`hotel_satim_orderId_${bookingToken}`);

                    if ('bookingId' in result) {
                        // pending_verification — payment confirmed, Travellanda
                        // didn't respond in time. Not a failure, not a normal
                        // success either.
                        setStatus('PENDING');
                        setPendingMsg(result.message);
                        setLoading(false);
                        return;
                    }

                    // Normalize confirmHotelSatimPayment's { data: booking } shape
                    // to match what the JSX below expects: payment.booking.*
                    setPayment({ ...result.data.payment, booking: result.data });
                    setStatus('PAID');
                    setLoading(false);
                    fireConfetti();
                }
            } catch (err: any) {
                if (!cancelled) {
                    if (err.message?.includes('No pending payment') || err.message?.includes('Already paid')) {
                        setStatus('PAID');
                        setLoading(false);
                        fireConfetti();
                    } else {
                        setStatus('FAILED');
                        setLoading(false);
                        setErrorMessage(
                            err.respCode_desc         ||
                            err.actionCodeDescription ||
                            err.message               ||
                            null
                        );
                    }
                }
            }
        };

        confirm();
        return () => { cancelled = true; };
    }, [type, applicationId, bookingId, bookingToken]);

    const refId = type === 'flight' ? bookingId : type === 'hotel' ? payment?.booking?.yourReference ?? bookingToken : applicationId;
    const infoLabel = type === 'flight'
        ? (payment?.booking?.pnr ? `PNR: ${payment.booking.pnr}` : '—')
        : type === 'hotel'
            ? (payment?.booking?.bookingReference ? `Réf: ${payment.booking.bookingReference}` : payment?.booking?.hotelName ?? '—')
            : payment?.visaApplication?.visaType?.nameFr;

    const successDescription = type === 'flight'
        ? `Vol ${payment?.booking?.departureAirport ?? ''} → ${payment?.booking?.arrivalAirport ?? ''} · PNR: ${payment?.booking?.pnr ?? '—'}`
        : type === 'hotel'
            ? `Réservation confirmée — ${payment?.booking?.hotelName ?? ''}`
            : `Votre demande de visa pour ${payment?.visaApplication?.visaType?.country?.nameFr} a été soumise avec succès.`;

    // ── Téléchargement PDF ────────────────────────────────────────────────────
    const handleDownload = useCallback(() => {
        if (!receiptRef.current || !receipt) return;
        html2pdf()
            .set({
                margin:      [8, 8, 8, 8],
                filename:    `recu-${receipt.receiptRef ?? refId?.slice(0, 8)}.pdf`,
                image:       { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF:       { unit: 'mm', format: 'a4', orientation: 'portrait' },
            })
            .from(receiptRef.current)
            .save();
    }, [receipt, refId]);

    const handlePrint = () => window.print();

    const handleSendEmail = async () => {
        if (!applicationId) return;
        setSendingEmail(true);
        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/payments/receipt/${applicationId}/send-email`,
                {
                    method:  'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                },
            );
            if (res.ok) {
                toast({ title: 'Email envoyé', description: 'Le reçu a été envoyé à votre adresse email.' });
            } else {
                toast({ title: 'Erreur', description: "Impossible d'envoyer le reçu.", variant: 'destructive' });
            }
        } catch {
            toast({ title: 'Erreur réseau', description: "Impossible d'envoyer le reçu.", variant: 'destructive' });
        } finally {
            setSendingEmail(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
                <p className="text-muted-foreground text-sm">Confirmation du paiement en cours...</p>
                <p className="text-muted-foreground text-xs">Cela peut prendre jusqu'à 30 secondes</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center space-y-4">
                <AlertCircle className="w-10 h-10 text-destructive mx-auto" />
                <p className="font-semibold">Une erreur est survenue</p>
                <p className="text-muted-foreground text-sm">{error}</p>
                <Button onClick={() => navigate('/')}>Retour à l'accueil</Button>
            </div>
        </div>
    );

    return (
        <div className="relative min-h-screen flex items-center justify-center px-4 py-12 overflow-hidden bg-gradient-to-b from-muted/30 to-background">
            <div className="absolute inset-0 pointer-events-none"
                 style={{ background: 'radial-gradient(circle at 50% 45%, rgba(8,101,254,0.10), transparent 60%)' }} />

            <div className="relative max-w-md w-full text-center space-y-6">

                {status === 'PAID' && (
                    <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" strokeWidth={1.5} />
                )}
                {status === 'FAILED' && (
                    <div className="w-20 h-20 rounded-full bg-destructive/10 mx-auto flex items-center justify-center">
                        <XCircle className="w-10 h-10 text-destructive" />
                    </div>
                )}
                {status === 'PENDING' && (
                    <div className="w-20 h-20 rounded-full bg-yellow-100 mx-auto flex items-center justify-center">
                        <Loader2 className="w-10 h-10 text-yellow-600 animate-spin" />
                    </div>
                )}

                <div>
                    <h1 className="text-2xl font-bold">
                        {status === 'PAID'    && 'Paiement confirmé '}
                        {status === 'FAILED'  && 'Paiement échoué'}
                        {status === 'PENDING' && (type === 'hotel' ? 'Paiement confirmé — vérification en cours' : 'Paiement en attente')}
                    </h1>
                    <p className="text-muted-foreground mt-2 text-sm">
                        {status === 'PAID'    && successDescription}
                        {status === 'FAILED'  && (errorMessage ?? "Votre paiement n'a pas pu être traité. Vous pouvez réessayer.")}
                        {status === 'PENDING' && (type === 'hotel'
                            ? (pendingMsg ?? "Votre paiement a été confirmé. Nous vérifions le statut de la réservation auprès de l'hôtel.")
                            : "Le statut de votre paiement n'a pas encore été mis à jour. Vérifiez dans quelques minutes.")}
                    </p>
                </div>

                {status === 'PAID' && type === 'visa' && receipt && (
                    <div ref={receiptRef} className="receipt-print bg-white border border-gray-200 rounded-2xl shadow-md overflow-hidden text-left">
                        <div className="px-5 pt-5 pb-3 border-b border-gray-100">
                            <p className="font-bold text-gray-800 text-base">BOOKINGO VISA – Reçu de paiement</p>
                            <p className="text-xs text-gray-400 mt-0.5">Powered by SATIM I-PAY</p>
                        </div>
                        <div className="px-5 py-4 space-y-3">
                            <ReceiptRow label="Identifiant"   value={receipt.satimIdentifiant  || '—'} mono />
                            <ReceiptRow label="N° de commande"      value={receipt.satimOrderNumber  || '—'} mono />
                            <ReceiptRow label="Code d'autorisation" value={receipt.satimApprovalCode || '—'} mono />
                            <div className="border-t border-dashed border-gray-200 my-1" />
                            <ReceiptRow
                                label="Montant"
                                value={formatAmount(receipt.amount)}
                                valueStyle={{ color: '#0D9373', fontWeight: 700, fontSize: '1rem' }}
                            />
                            <ReceiptRow label="Mode de paiement" value="CIB/EDAHABIA" />
                            <ReceiptRow
                                label="Statut"
                                value="Votre paiement a été accepté."
                                valueStyle={{ color: '#0D9373', fontWeight: 600 }}
                            />
                            <ReceiptRow label="Date / Heure" value={receipt.formattedDate || '—'} />
                            {receipt.receiptRef && (
                                <>
                                    <div className="border-t border-dashed border-gray-200 my-1" />
                                    <ReceiptRow label="Référence BGV" value={receipt.receiptRef} mono bold />
                                </>
                            )}
                        </div>
                        <div className="px-5 pb-4 pt-2 border-t border-gray-100 text-center">
                            <p className="text-xs text-gray-400 inline-flex items-center gap-1 flex-wrap justify-center">
                                En cas de problème, contactez le numéro vert SATIM :&nbsp;
                                <span className="inline-flex items-center gap-1">
                                    <span className="font-bold text-green-600">3020</span>
                                    <img src="/satim.png" alt="SATIM" className="h-5 object-contain inline" />
                                </span>
                            </p>
                        </div>
                    </div>
                )}

                {payment && status !== 'PENDING' && !(status === 'PAID' && type === 'visa' && receipt) && (
                    <div className="bg-muted/40 rounded-xl p-5 space-y-3 text-left">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Référence</span>
                            <span className="font-mono font-semibold">{refId?.slice(0, 16).toUpperCase()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{type === 'flight' ? 'Vol' : type === 'hotel' ? 'Hôtel' : 'Visa'}</span>
                            <span className="font-medium">{infoLabel}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Montant</span>
                            <span className="font-semibold">{formatAmount(payment.amount)}</span>
                        </div>
                        {payment.paidAt && (
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Date de paiement</span>
                                <span className="font-medium">
                                    {new Date(payment.paidAt).toLocaleString('fr-DZ', {
                                        timeZone: 'Africa/Algiers',
                                        day: '2-digit', month: '2-digit', year: 'numeric',
                                        hour: '2-digit', minute: '2-digit',
                                    })}
                                </span>
                            </div>
                        )}
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Statut</span>
                            <Badge variant="outline" className={
                                status === 'PAID'   ? 'bg-accent/10 text-accent border-accent/30' :
                                    status === 'FAILED' ? 'bg-destructive/10 text-destructive border-destructive/30' :
                                        'bg-yellow-100 text-yellow-800 border-yellow-300'
                            }>
                                {status === 'PAID' ? 'PAYÉ' : status === 'FAILED' ? 'ÉCHOUÉ' : 'EN ATTENTE'}
                            </Badge>
                        </div>
                    </div>
                )}

                {status === 'PAID' && type === 'visa' && receipt && (
                    <div className="flex items-center justify-center gap-2 flex-wrap print:hidden">
                        <Button variant="outline" size="sm" onClick={handleDownload} className="rounded-full">
                            <Download className="w-4 h-4 mr-1" /> Télécharger le reçu
                        </Button>
                        <Button variant="outline" size="sm" onClick={handlePrint} className="rounded-full">
                            <Printer className="w-4 h-4 mr-1" /> Imprimer
                        </Button>
                        <Button
                            variant="outline" size="sm"
                            onClick={handleSendEmail}
                            disabled={sendingEmail}
                            className="rounded-full">
                            {sendingEmail
                                ? <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                : <Mail className="w-4 h-4 mr-1" />}
                            Envoyer par email
                        </Button>
                    </div>
                )}

                {(status === 'PAID' || status === 'PENDING') && type === 'hotel' && <>
                    <Button onClick={() => navigate('/hotels/my-bookings')}
                            className="text-white font-semibold rounded-full px-6"
                            style={{ background: 'linear-gradient(135deg, #0865FE, #3B2F7E)' }}>
                        Voir mes réservations
                    </Button>
                    <Button variant="outline" onClick={() => navigate('/hotels')} className="rounded-full px-6">
                        Rechercher un hôtel
                    </Button>
                </>}

                {status === 'FAILED' && (
                    <div className="flex flex-col items-center gap-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <span>Problème de paiement ? Contactez SATIM :</span>
                            <span className="font-bold text-green-600 text-sm">📞 3020</span>
                        </div>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 justify-center print:hidden">
                    {status === 'PAID' && type === 'visa' && <>
                        <Button onClick={() => navigate('/client/applications')}
                                className="text-white font-semibold rounded-full px-6"
                                style={{ background: 'linear-gradient(135deg, #0865FE, #3B2F7E)' }}>
                            Voir mes demandes
                        </Button>
                        <Button variant="outline" onClick={() => navigate('/')} className="rounded-full px-6">
                            Accueil
                        </Button>
                    </>}
                    {status === 'PAID' && type === 'flight' && <>
                        <Button onClick={() => navigate(`/flights/booking/${bookingId}`)}
                                className="text-white font-semibold rounded-full px-6"
                                style={{ background: 'linear-gradient(135deg, #0865FE, #3B2F7E)' }}>
                            Voir ma réservation
                        </Button>
                        <Button variant="outline" onClick={() => navigate('/flights')} className="rounded-full px-6">
                            Rechercher un vol
                        </Button>
                    </>}
                    {status === 'FAILED' && <>
                        <Button onClick={() => navigate(type === 'flight' ? '/flights' : type === 'hotel' ? '/hotels' : '/apply')}
                                className="text-white font-semibold rounded-full px-6"
                                style={{ background: 'linear-gradient(135deg, #0865FE, #3B2F7E)' }}>
                            Réessayer
                        </Button>
                        <Button variant="outline"
                                onClick={() => navigate(type === 'flight' ? '/flights/my-bookings' : type === 'hotel' ? '/hotels' : '/client/applications')}
                                className="rounded-full px-6">
                            {type === 'flight' ? 'Mes réservations' : type === 'hotel' ? 'Rechercher un hôtel' : 'Mes demandes'}
                        </Button>
                    </>}
                    {status === 'PENDING' && type !== 'hotel' && <>
                        <Button onClick={() => navigate(type === 'flight' ? '/flights/my-bookings' : '/client/applications')}
                                className="text-white font-semibold rounded-full px-6"
                                style={{ background: 'linear-gradient(135deg, #0865FE, #3B2F7E)' }}>
                            {type === 'flight' ? 'Mes réservations' : 'Voir mes demandes'}
                        </Button>
                        <Button variant="outline" onClick={() => window.location.reload()} className="rounded-full px-6">
                            Actualiser
                        </Button>
                    </>}
                </div>

            </div>
        </div>
    );
};

const ReceiptRow = ({
                        label, value, mono = false, bold = false, valueStyle,
                    }: {
    label:       string;
    value:       string;
    mono?:       boolean;
    bold?:       boolean;
    valueStyle?: React.CSSProperties;
}) => (
    <div className="flex items-start justify-between gap-4 text-sm">
        <span className="text-gray-500 shrink-0">{label}</span>
        <span
            className={[mono ? 'font-mono' : '', bold ? 'font-bold' : 'font-medium', 'text-right text-gray-800'].join(' ')}
            style={valueStyle}>
            {value}
        </span>
    </div>
);

export default SatimResult;