import { useParams, useNavigate }  from 'react-router-dom';
import { useQuery }                from '@tanstack/react-query';
import { QRCodeSVG }               from 'qrcode.react';
import { CheckCircle, XCircle, Copy, Wifi, ArrowLeft } from 'lucide-react';
import { getEsimPaymentStatus, formatBytes, type Esim } from '@/service/esim.service';
import { toast } from 'sonner';
import AppLoading from '@/components/common/AppLoading';

const EsimCard = ({ esim }: { esim: Esim }) => {
    const copy = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copié !`);
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex justify-center mb-4">
                <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                    <QRCodeSVG value={esim.ac} size={160} />
                </div>
            </div>
            <p className="text-center font-semibold text-gray-900 mb-1">{esim.packageName}</p>
            <p className="text-center text-sm text-gray-500 mb-4">{formatBytes(esim.totalVolume)}</p>

            <div className="bg-gray-50 rounded-xl p-3 mb-2">
                <p className="text-xs text-gray-400 mb-0.5">ICCID</p>
                <div className="flex items-center justify-between">
                    <p className="text-sm font-mono text-gray-800 truncate">{esim.iccid}</p>
                    <button onClick={() => copy(esim.iccid, 'ICCID')} className="ml-2 text-gray-400 hover:text-blue-600 transition-colors">
                        <Copy className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-0.5">Code d'activation</p>
                <div className="flex items-center justify-between">
                    <p className="text-xs font-mono text-gray-800 truncate">{esim.ac}</p>
                    <button onClick={() => copy(esim.ac, "Code d'activation")} className="ml-2 text-gray-400 hover:text-blue-600 transition-colors flex-shrink-0">
                        <Copy className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

const EsimStatus = () => {
    const { id }   = useParams<{ id: string }>();
    const navigate = useNavigate();


    const { data, isLoading, isError } = useQuery({
        queryKey: ['esim-status', id],
        queryFn:  () => getEsimPaymentStatus(id!),
        refetchInterval: (query) =>
            query.state.data?.status === 'success' || query.state.data?.status === 'failure'
                ? false
                : 3000,
        enabled: !!id,
    });

    const isSuccess = data?.status === 'success';

    if (isLoading) return (
        <AppLoading message="Vérification de votre commande eSIM..." />
    );

    if (isError) return (
        <div className="min-h-screen bg-gray-50 pt-16 flex items-center justify-center px-4">
            <div className="text-center max-w-sm">
                <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">Erreur</h2>
                <p className="text-gray-500 mb-6">Impossible de récupérer le statut de votre commande.</p>
                <button onClick={() => navigate('/esim')} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-colors">
                    Retour à la boutique
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 pt-16">
            <div className={`py-10 px-4 text-center ${isSuccess ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-red-500 to-rose-600'}`}>
                {isSuccess
                    ? <CheckCircle className="w-14 h-14 text-white mx-auto mb-3" />
                    : <XCircle    className="w-14 h-14 text-white mx-auto mb-3" />
                }
                <h1 className="text-2xl font-bold text-white mb-1">
                    {isSuccess ? 'Commande confirmée !' : 'Paiement échoué'}
                </h1>
                {isSuccess && data?.order?.batch_id && (
                    <p className="text-white/80 text-sm">Commande #{data.order.batch_id}</p>
                )}
                {isSuccess && data?.amount && (
                    <p className="text-white font-semibold mt-1">
                        {data.amount.toLocaleString()} {data.extra?.currency ?? 'DZD'}
                    </p>
                )}
            </div>

            <div className="max-w-lg mx-auto px-4 py-8 space-y-4">
                {isSuccess && data?.order?.esims?.map((esim) => (
                    <EsimCard key={esim.id} esim={esim} />
                ))}

                {!isSuccess && (
                    <div className="bg-white rounded-2xl border border-red-100 p-5 text-center shadow-sm">
                        <p className="text-gray-600 mb-2">Le paiement n'a pas pu être traité.</p>
                        <p className="text-sm text-gray-400">Veuillez réessayer ou contacter le support.</p>
                    </div>
                )}

                {isSuccess && (
                    <div className="bg-blue-50 rounded-2xl border border-blue-100 p-5">
                        <div className="flex items-center gap-2 mb-3">
                            <Wifi className="w-5 h-5 text-blue-600" />
                            <h3 className="font-semibold text-blue-900">Comment activer votre eSIM</h3>
                        </div>
                        <ol className="text-sm text-blue-800 space-y-1.5 list-decimal list-inside">
                            <li>Allez dans Réglages → Données mobiles → Ajouter un forfait</li>
                            <li>Scannez le QR code ci-dessus</li>
                            <li>Ou entrez le code d'activation manuellement</li>
                            <li>Activez l'eSIM à destination</li>
                        </ol>
                    </div>
                )}

                <div className="flex gap-3">
                    <button
                        onClick={() => navigate('/esim')}
                        className="flex-1 flex items-center justify-center gap-2 border border-gray-200 bg-white text-gray-700 font-medium py-3 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Retour
                    </button>
                    <button
                        onClick={() => navigate('/esim')}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-colors"
                    >
                        Autre eSIM
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EsimStatus;