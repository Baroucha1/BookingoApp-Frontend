import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, Loader2, XCircle, ShieldAlert, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import confetti from 'canvas-confetti';
import AppLoading from '@/components/common/AppLoading';

import {
    confirmEsimSatimPayment,
    type EsimOrder,
} from '@/service/payment.service';

type Status = 'PENDING' | 'PAID' | 'FAILED' | 'PAID_FULFILLMENT_ERROR';

const formatAmount = (amount: number | string) => `${Number(amount).toFixed(2)} DA`;

const EsimSatimResult = () => {
    const [searchParams] = useSearchParams();
    const navigate       = useNavigate();
    const { toast }      = useToast();

    const esimOrderId = searchParams.get('esimOrderId');

    const [order,        setOrder]        = useState<EsimOrder | null>(null);
    const [status,       setStatus]       = useState<Status>('PENDING');
    const [loading,      setLoading]      = useState(true);
    const [isCancelled,  setIsCancelled]  = useState(false);
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
        // Détecter si l'utilisateur a annulé directement sur SATIM
        const isCancelledQuery =
            searchParams.get('cancel') === 'true' ||
            searchParams.get('cancel') === '1' ||
            searchParams.get('status') === 'cancelled' ||
            searchParams.get('status') === 'canceled' ||
            searchParams.get('status') === 'failed' ||
            searchParams.get('action') === 'cancel' ||
            searchParams.get('respCode') === '7' ||
            searchParams.get('errorCode') === '7';

        if (isCancelledQuery) {
            toast({
                title: 'Paiement annulé',
                description: 'Paiement SATIM annulé. Redirection vers les offres eSIM...',
                variant: 'destructive',
            });
            const t = setTimeout(() => {
                navigate('/esim', { replace: true });
            }, 800);
            return () => clearTimeout(t);
        }

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

                const rawErr = String(
                    err.respCode_desc ||
                    err.actionCodeDescription ||
                    err.message ||
                    ''
                );
                const isCancelErr =
                    err.rejectionCase === 'CANCELLED' ||
                    err.respCode === 7 ||
                    err.respCode === '7' ||
                    /annul|cancel|declined|refus/i.test(rawErr);

                setStatus('FAILED');
                setIsCancelled(isCancelErr);
                setLoading(false);
                setErrorMessage(
                    isCancelErr
                        ? "Le paiement SATIM a été annulé."
                        : (err.respCode_desc || err.actionCodeDescription || err.message || null)
                );

                toast({
                    title: isCancelErr ? 'Paiement annulé' : 'Paiement échoué',
                    description: 'Redirection vers les forfaits eSIM...',
                    variant: 'destructive',
                });

                const redirectTimer = setTimeout(() => {
                    navigate('/esim', { replace: true });
                }, 2500);

                return () => clearTimeout(redirectTimer);
            }
        };

        confirm();
        return () => { cancelled = true; };
    }, [esimOrderId]);

    if (loading) return (
        <AppLoading
            message="Confirmation du paiement en cours..."
            subMessage="Vérification auprès de SATIM, cela peut prendre quelques instants..."
        />
    );

    if (error) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center space-y-4">
                <AlertCircle className="w-10 h-10 text-destructive mx-auto" />
                <p className="font-semibold">Une erreur est survenue</p>
                <p className="text-muted-foreground text-sm">{error}</p>
                <Button onClick={() => navigate('/esim')}>Retour aux offres eSIM</Button>
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
                        {status === 'FAILED'                 && (isCancelled ? 'Paiement annulé' : 'Paiement échoué')}
                        {status === 'PENDING'                && 'Paiement en attente'}
                    </h1>
                    <p className="text-muted-foreground mt-2 text-sm">
                        {status === 'PAID'                   && `Votre eSIM pour ${order?.country?.nameFr ?? 'votre destination'} est prête.`}
                        {status === 'PAID_FULFILLMENT_ERROR' && (errorMessage ?? "Votre paiement est validé mais une erreur est survenue lors de l'activation. Notre support s'en occupe.")}
                        {status === 'FAILED'                 && (errorMessage ?? (isCancelled ? "Le paiement SATIM a été annulé. Redirection vers les forfaits eSIM..." : "Votre paiement n'a pas pu être traité. Vous pouvez réessayer."))}
                        {status === 'PENDING'                && "Le statut de votre commande n'a pas encore été mis à jour. Vérifiez dans quelques minutes."}
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
                                        hour12: false,
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
                            Retour aux forfaits eSIM
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