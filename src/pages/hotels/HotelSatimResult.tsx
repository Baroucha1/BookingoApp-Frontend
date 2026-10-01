// src/pages/hotels/HotelSatimResult.tsx
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { confirmHotelPayment, type ConfirmHotelPaymentResult } from '@/service/hotels/hotels.service';

export default function HotelSatimResult() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [result, setResult] = useState<ConfirmHotelPaymentResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const bookingId = searchParams.get('bookingId');
        // SATIM appends its own order identifier to the return URL — the exact
        // param name depends on your gateway config (commonly `orderId` or
        // `mdOrder`). Checking both covers either case.
        const orderId = searchParams.get('orderId') ?? searchParams.get('mdOrder');

        if (!bookingId || !orderId) {
            setError('Paramètres de paiement manquants.');
            setLoading(false);
            return;
        }

        confirmHotelPayment({ hotelBookingId: bookingId, orderId })
            .then(setResult)
            .catch((err) => setError(err instanceof Error ? err.message : 'Échec de la confirmation du paiement'))
            .finally(() => setLoading(false));
    }, [searchParams]);

    return (
        <div className="min-h-screen bg-[#F0F6FF] flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-white rounded-xl border border-slate-100 p-8 text-center space-y-4">
                {loading && (
                    <>
                        <Loader2 className="w-10 h-10 animate-spin text-[#1775FF] mx-auto" />
                        <div className="text-slate-600">Confirmation du paiement en cours...</div>
                    </>
                )}

                {!loading && error && (
                    <>
                        <XCircle className="w-12 h-12 text-red-500 mx-auto" />
                        <div className="font-bold text-red-600 text-lg">Échec du paiement</div>
                        <p className="text-sm text-slate-500">{error}</p>
                        <Button onClick={() => navigate('/hotels')} className="mt-4 bg-[#1775FF] hover:bg-[#1775FF]/90 text-white">
                            Retour à la recherche
                        </Button>
                    </>
                )}

                {!loading && !error && result && (
                    <>
                        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                        <div className="font-bold text-emerald-600 text-lg">Paiement confirmé</div>
                        <div className="text-sm text-slate-600 space-y-1">
                            <div>{result.satimDetails.amount} {result.satimDetails.currency}</div>
                            <div className="text-xs font-mono text-slate-400">Réf: {result.satimDetails.orderNumber}</div>
                        </div>
                        <Button onClick={() => navigate('/hotels/my-bookings')} className="mt-4 bg-[#1775FF] hover:bg-[#1775FF]/90 text-white">
                            Voir mes réservations
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
}