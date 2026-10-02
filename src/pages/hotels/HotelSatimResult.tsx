// src/pages/hotels/HotelSatimResult.tsx
import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AppLoading from '@/components/common/AppLoading';
import { useLanguage } from '@/i18n/LanguageContext';
import {
    confirmHotelPayment,
    type ConfirmHotelPaymentResult,
    type PendingVerification,
} from '@/service/hotels/hotels.service';
import { redirectToApp } from '@/lib/satimRedirect';

export default function HotelSatimResult() {
    const { t } = useLanguage();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [result, setResult] = useState<ConfirmHotelPaymentResult | PendingVerification | null>(null);
    const [error, setError] = useState<string | null>(null);
    const hasConfirmed = useRef(false);

    useEffect(() => {
        const bookingToken =
            searchParams.get('bookingToken') ??
            searchParams.get('token') ??
            searchParams.get('bookingId') ??
            sessionStorage.getItem('hotel_satim_last_token');

        const orderId =
            searchParams.get('orderId') ??
            searchParams.get('mdOrder') ??
            (bookingToken ? sessionStorage.getItem(`hotel_satim_orderId_${bookingToken}`) : null);

        if (!bookingToken || !orderId) {
            setError(t('hotelPaymentMissingParams'));
            setLoading(false);
            return;
        }

        if (hasConfirmed.current) return;
        hasConfirmed.current = true;

        confirmHotelPayment({ bookingToken, orderId })
            .then(setResult)
            .catch((err) => setError(err instanceof Error ? err.message : t('hotelPaymentConfirmFailed')))
            .finally(() => setLoading(false));
    }, [searchParams, t]);

    if (loading) {
        return (
            <AppLoading
                message={t('hotelPaymentConfirming')}
                subMessage={t('hotelPaymentVerifyingSatim')}
            />
        );
    }

    return (
        <div className="min-h-screen bg-[#F0F6FF] flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-white rounded-xl border border-slate-100 p-8 text-center space-y-4 shadow-sm">

                {!loading && error && (
                    <>
                        <XCircle className="w-12 h-12 text-red-500 mx-auto" />
                        <div className="font-bold text-red-600 text-lg">{t('hotelPaymentFailed')}</div>
                        <p className="text-sm text-slate-500">{error}</p>
                        <Button onClick={() => redirectToApp(navigate, '/hotels')} className="mt-4 bg-[#1775FF] hover:bg-[#1775FF]/90 text-white cursor-pointer">
                            {t('hotelReturnToHotels')}
                        </Button>
                    </>
                )}

                {!loading && !error && result && (
                    <>
                        {result.status === 'pending_verification' ? (
                            <>
                                <Clock className="w-12 h-12 text-amber-500 mx-auto" />
                                <div className="font-bold text-amber-600 text-lg">{t('hotelPaymentPending')}</div>
                                <p className="text-sm text-slate-600">{result.message}</p>
                                <Button onClick={() => redirectToApp(navigate, '/hotels')} className="mt-4 bg-[#1775FF] hover:bg-[#1775FF]/90 text-white cursor-pointer">
                                    {t('hotelReturnToHotels')}
                                </Button>
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                                <div className="font-bold text-emerald-600 text-lg">{t('hotelPaymentConfirmed')}</div>
                                <div className="text-sm text-slate-600 space-y-1">
                                    <div>{result.satimDetails.amount} {result.satimDetails.currency}</div>
                                    <div className="text-xs font-mono text-slate-400">{t('hotelPaymentRef')}: {result.satimDetails.orderNumber}</div>
                                </div>
                                <Button onClick={() => redirectToApp(navigate, '/hotels')} className="mt-4 bg-[#1775FF] hover:bg-[#1775FF]/90 text-white cursor-pointer">
                                    {t('hotelReturnToHotels')}
                                </Button>
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}