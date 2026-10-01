import {useEffect, useRef, useState} from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { confirmCustomSatimPayment, type SatimConfirmResult } from '@/service/payment.service';
import AppLoading from '@/components/common/AppLoading';

type ResultState = 'loading' | 'success' | 'failed' | 'error';

export default function SatimCustomResult() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const paymentId = searchParams.get('paymentId');
    const orderId    = searchParams.get('orderId') ?? searchParams.get('mdOrder');

    const [state, setState] = useState<ResultState>('loading');
    const [result, setResult] = useState<SatimConfirmResult | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const hasConfirmed = useRef(false);


    useEffect(() => {
        if (!paymentId || !orderId) {
            setState('error');
            setMessage('Paramètres de paiement manquants.');
            return;
        }
        if (hasConfirmed.current) return;
        hasConfirmed.current = true;

        confirmCustomSatimPayment(paymentId, orderId)
            .then(res => { setResult(res); setState('success'); })
            .catch((err: any) => {
                setState('failed');
                setMessage(err.respCode_desc || err.actionCodeDescription || err.message || 'Le paiement a été refusé.');
            });
    }, [paymentId, orderId]);

    if (state === 'loading') {
        return (
            <AppLoading
                message="Vérification du paiement en cours..."
                subMessage="Confirmation auprès de SATIM..."
            />
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <div className="max-w-md w-full text-center space-y-6">

                {state === 'success' && result && (
                    <>
                        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
                        <div>
                            <h1 className="text-xl font-bold">Paiement confirmé</h1>
                            <p className="text-muted-foreground text-sm mt-1">
                                Votre paiement a été traité avec succès.
                            </p>
                        </div>
                        <div className="p-4 rounded-xl bg-white border shadow-sm text-left text-sm space-y-2">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Référence</span>
                                <span className="font-mono">{result.satimDetails.receiptRef}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Montant</span>
                                <span className="font-semibold">
                                    {result.satimDetails.amount.toLocaleString('fr-FR')} {result.satimDetails.currency}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Méthode</span>
                                <span>{result.satimDetails.paymentMethod}</span>
                            </div>
                        </div>
                        <Button
                            className="w-full bg-gradient-primary text-white"
                            onClick={() => navigate('/client/custom-payments')}
                        >
                            Retour à mes paiements
                        </Button>
                    </>
                )}

                {(state === 'failed' || state === 'error') && (
                    <>
                        <XCircle className="w-16 h-16 text-red-500 mx-auto" />
                        <div>
                            <h1 className="text-xl font-bold">Paiement échoué</h1>
                            <p className="text-muted-foreground text-sm mt-1">{message}</p>
                        </div>
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => navigate('/client/custom-payments')}
                            >
                                Retour
                            </Button>
                            {paymentId && (
                                <Button
                                    className="flex-1 bg-gradient-primary text-white"
                                    onClick={() => navigate(`/client/custom-payments/${paymentId}/pay`)}
                                >
                                    Réessayer
                                </Button>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}