import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getCustomPayment, initiateCustomSatimPayment, type CustomPayment } from '@/service/payment.service';

export default function CustomPaymentPay() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [payment, setPayment] = useState<CustomPayment | null>(null);
    const [loading, setLoading] = useState(true);
    const [paying, setPaying] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [termsAccepted, setTermsAccepted] = useState(false);
    const [captchaVerified, setCaptchaVerified] = useState(false);
    const recaptchaRef = useRef<HTMLDivElement>(null);
    const recaptchaWidgetId = useRef<number | null>(null);
    const skipRecaptcha = import.meta.env.VITE_SKIP_RECAPTCHA === 'true';

    useEffect(() => {
        if (!id) return;
        getCustomPayment(id)
            .then(setPayment)
            .catch(err => setError(err.message ?? 'Impossible de récupérer le paiement'))
            .finally(() => setLoading(false));
    }, [id]);

    useEffect(() => {
        if (document.getElementById('recaptcha-script')) return;
        const script = document.createElement('script');
        script.id = 'recaptcha-script';
        script.src = 'https://www.google.com/recaptcha/api.js?render=explicit';
        script.async = true;
        document.head.appendChild(script);
    }, []);

    useEffect(() => {
        if (loading || !payment || payment.status === 'PAID' || skipRecaptcha) return;
        const tryRender = () => {
            if (!window.grecaptcha || !recaptchaRef.current) { setTimeout(tryRender, 300); return; }
            if (recaptchaWidgetId.current !== null) return;
            recaptchaWidgetId.current = window.grecaptcha.render(recaptchaRef.current, {
                sitekey: import.meta.env.VITE_RECAPTCHA_SITE_KEY,
                callback: () => setCaptchaVerified(true),
                'expired-callback': () => setCaptchaVerified(false),
            });
        };
        tryRender();
    }, [loading, payment]);

    const handlePay = async () => {
        if (!id) return;
        setPaying(true);
        setError(null);
        try {
            let captchaToken = '';
            if (!skipRecaptcha) {
                captchaToken = window.grecaptcha.getResponse(recaptchaWidgetId.current);
                if (!captchaToken) {
                    toast({ title: 'reCAPTCHA requis', description: 'Veuillez valider le reCAPTCHA.', variant: 'destructive' });
                    setPaying(false);
                    return;
                }
            }
            const { formUrl } = await initiateCustomSatimPayment(id, captchaToken);
            window.location.href = formUrl;
        } catch (err: any) {
            const detail = err.message ?? "Échec de l'initiation du paiement";
            setError(detail);
            toast({ title: 'Paiement échoué', description: detail, variant: 'destructive' });
            setPaying(false);
        }
    };

    if (loading) {
        return <div className="max-w-xl mx-auto py-24 text-center text-muted-foreground">Chargement...</div>;
    }

    if (!payment) {
        return (
            <div className="max-w-xl mx-auto py-24 text-center space-y-4">
                <p className="text-red-500">{error ?? 'Paiement introuvable'}</p>
                <Button variant="outline" onClick={() => navigate('/client/custom-payments')}>Retour</Button>
            </div>
        );
    }

    return (
        <div className="max-w-xl mx-auto py-12 px-4 space-y-6">
            <button
                onClick={() => navigate('/client/custom-payments')}
                className="text-muted-foreground hover:text-primary flex items-center gap-2 text-sm transition-colors font-medium"
            >
                <ArrowLeft className="w-4 h-4" /> Retour
            </button>

            <div className="p-6 rounded-2xl bg-white shadow-sm border space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-primary text-white">
                        <Wallet className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="font-bold text-lg">{payment.title}</h2>
                        {payment.description && <p className="text-sm text-muted-foreground">{payment.description}</p>}
                    </div>
                </div>

                <div className="pt-4 border-t flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">Montant</span>
                    <span className="text-2xl font-bold text-primary">
                        {Number(payment.amount).toLocaleString('fr-FR')} {payment.currency}
                    </span>
                </div>

                {payment.status === 'PAID' ? (
                    <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm text-center">
                        Ce paiement a déjà été réglé.
                    </div>
                ) : (
                    <>
                        <label className="flex items-start gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={termsAccepted}
                                onChange={e => setTermsAccepted(e.target.checked)}
                                className="mt-0.5 w-4 h-4 accent-primary cursor-pointer"
                            />
                            <span className="text-xs text-gray-700">
                                J'accepte les conditions d'utilisation et de paiement en ligne SATIM
                            </span>
                        </label>

                        {!skipRecaptcha && (
                            <div className="flex justify-center">
                                <div ref={recaptchaRef} />
                            </div>
                        )}

                        <Button
                            onClick={handlePay}
                            disabled={paying || !termsAccepted || (!skipRecaptcha && !captchaVerified)}
                            className="w-full h-12 bg-gradient-primary text-white font-semibold rounded-xl flex items-center justify-center gap-2"
                        >
                            {paying ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                            {paying ? 'Redirection...' : 'Payer maintenant'}
                        </Button>

                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    </>
                )}
            </div>

            <img src="/dhahabiaCIB.png" alt="CIB EDAHABIA" className="h-6 mx-auto object-contain opacity-70" />
        </div>
    );
}