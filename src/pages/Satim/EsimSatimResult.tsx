import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, Loader2, XCircle, ShieldAlert, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import confetti from 'canvas-confetti';

import {
    confirmEsimSatimPayment,
    type EsimOrder,
} from '@/service/payment.service';

type Status = 'PENDING' | 'PAID' | 'FAILED' | 'PAID_FULFILLMENT_ERROR';

const formatAmount = (amount: number | string) => `${Number(amount).toFixed(2)} DA`;

const EsimSatimResult = () => {
    const [searchParams] = useSearchParams();
    const navigate       = useNavigate();

    const esimOrderId = searchParams.get('esimOrderId');

    const [order,        setOrder]        = useState<EsimOrder | null>(null);
    const [status,       setStatus]       = useState<Status>('PENDING');
    const [loading,      setLoading]      = useState(true);
    const [error,        setError]        = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const confettiFired                   = useRef(false);

    const fireConfetti = () => {
        if (confettiFired.current) return;
        confettiFired.current = true;
        const burst = (origin: { x: number; y: number }) =>
            confetti({ particleCount: 80, spread: 70, origin, colors: ['#0865FE', '#3B2F7E', '#FFB400'] });
        burst({ x: 0.5, y: 0.4 });
        setTimeout(() => burst({ x: 0.2, y: 0.6 }), 200);
        setTimeout(() => burst({ x: 0.8, y: 0.6 }), 400);
    };

    useEffect(() => {
        if (!esimOrderId) { setError('Référence de commande introuvable.'); setLoading(false); return; }

        const satimOrderId = searchParams.get('mdOrder') ?? searchParams.get('orderId');
        if (!satimOrderId) { setError('Référence de paiement introuvable.'); setLoading(false); return; }

        let cancelled = false;

        const confirm = async () => {
            try {
                const result = await confirmEsimSatimPayment(esimOrderId, satimOrderId);
                if (cancelled) return;
                setOrder(result.order);
                setStatus('PAID');
                setLoading(false);
                fireConfetti();
            } catch (err: any) {
                if (cancelled) return;

                if (err.message?.includes('No pending order') || err.message?.includes('Already paid')) {
                    setStatus('PAID');
                    setLoading(false);
                    fireConfetti();
                    return;
                }

                // Payment succeeded but the GoSIM purchase failed — not a payment failure.
                if (err.message?.includes('paiement a été confirmé')) {
                    setStatus('PAID_FULFILLMENT_ERROR');
                    setLoading(false);
                    setErrorMessage(err.message);
                    return;
                }

                setStatus('FAILED');
                setLoading(false);
                setErrorMessage(
                    err.respCode_desc         ||
                    err.actionCodeDescription ||
                    err.message               ||
                    null
                );
            }
        };

        confirm();
        return () => { cancelled = true; };
    }, [esimOrderId]);

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

                {/* ── Icône statut ── */}
                {status === 'PAID' && (
                    <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" strokeWidth={1.5} />
                )}
                {status === 'PAID_FULFILLMENT_ERROR' && (
                    <div className="w-20 h-20 rounded-full bg-orange-100 mx-auto flex items-center justify-center">
                        <ShieldAlert className="w-10 h-10 text-orange-600" />
                    </div>
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

                {/* ── Titre ── */}
                <div>
                    <h1 className="text-2xl font-bold">
                        {status === 'PAID'                   && 'Paiement confirmé'}
                        {status === 'PAID_FULFILLMENT_ERROR' && 'Paiement reçu — commande en cours de résolution'}
                        {status === 'FAILED'                 && 'Paiement échoué'}
                        {status === 'PENDING'                && 'Paiement en attente'}
                    </h1>
                    <p className="text-muted-foreground mt-2 text-sm">
                        {status === 'PAID' &&
                            `Votre eSIM ${order?.locationName ?? ''} est en cours de préparation. Vous recevrez un email dès qu'elle sera prête.`}
                        {status === 'PAID_FULFILLMENT_ERROR' &&
                            "Votre paiement a été confirmé, mais nous n'avons pas pu finaliser votre commande eSIM automatiquement. Notre équipe a été alertée et vous contactera rapidement — aucune action n'est requise de votre part."}
                        {status === 'FAILED' &&
                            (errorMessage ?? "Votre paiement n'a pas pu être traité. Vous pouvez réessayer.")}
                        {status === 'PENDING' &&
                            "Le statut de votre paiement n'a pas encore été mis à jour. Vérifiez dans quelques minutes."}
                    </p>
                </div>

                {/* ── Carte info commande ── */}
                {order && (
                    <div className="bg-muted/40 rounded-xl p-5 space-y-3 text-left">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Référence</span>
                            <span className="font-mono font-semibold">
                                {(order.receiptRef ?? order.id).slice(0, 16).toUpperCase()}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Destination</span>
                            <span className="font-medium">{order.locationName} — {order.durationDays}j</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Montant</span>
                            <span className="font-semibold">{formatAmount(order.amount)}</span>
                        </div>
                        {order.paidAt && (
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Date de paiement</span>
                                <span className="font-medium">
                                    {new Date(order.paidAt).toLocaleString('fr-DZ', {
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
                                status === 'PAID'                   ? 'bg-accent/10 text-accent border-accent/30' :
                                    status === 'PAID_FULFILLMENT_ERROR' ? 'bg-orange-100 text-orange-800 border-orange-300' :
                                        status === 'FAILED'                 ? 'bg-destructive/10 text-destructive border-destructive/30' :
                                            'bg-yellow-100 text-yellow-800 border-yellow-300'
                            }>
                                {status === 'PAID' ? 'PAYÉ'
                                    : status === 'PAID_FULFILLMENT_ERROR' ? 'PAYÉ — EN COURS'
                                        : status === 'FAILED' ? 'ÉCHOUÉ' : 'EN ATTENTE'}
                            </Badge>
                        </div>
                    </div>
                )}

                {/* ── Numéro vert (échec paiement) ── */}
                {status === 'FAILED' && (
                    <div className="flex flex-col items-center gap-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <span>Problème de paiement ? Contactez SATIM :</span>
                            <span className="font-bold text-green-600 text-sm">📞 3020</span>
                        </div>
                    </div>
                )}

                {/* ── Boutons navigation ── */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center print:hidden">
                    {(status === 'PAID' || status === 'PAID_FULFILLMENT_ERROR') && <>
                        <Button onClick={() => navigate('/esim/my-orders')}
                                className="text-white font-semibold rounded-full px-6"
                                style={{ background: 'linear-gradient(135deg, #0865FE, #3B2F7E)' }}>
                            Voir mes eSIMs
                        </Button>
                        <Button variant="outline" onClick={() => navigate('/esim')} className="rounded-full px-6">
                            Accueil eSIM
                        </Button>
                    </>}
                    {status === 'FAILED' && <>
                        <Button onClick={() => navigate('/esim')}
                                className="text-white font-semibold rounded-full px-6"
                                style={{ background: 'linear-gradient(135deg, #0865FE, #3B2F7E)' }}>
                            Réessayer
                        </Button>
                        <Button variant="outline" onClick={() => navigate('/esim/my-orders')} className="rounded-full px-6">
                            Mes eSIMs
                        </Button>
                    </>}
                    {status === 'PENDING' && <>
                        <Button onClick={() => navigate('/esim/my-orders')}
                                className="text-white font-semibold rounded-full px-6"
                                style={{ background: 'linear-gradient(135deg, #0865FE, #3B2F7E)' }}>
                            Mes eSIMs
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

export default EsimSatimResult;