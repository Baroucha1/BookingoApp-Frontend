import { useState, useEffect }  from 'react';
import { useNavigate }          from 'react-router-dom';
import { Card, CardContent }    from '@/components/ui/card';
import { Badge }                from '@/components/ui/badge';
import { Button }               from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Wifi, Copy, CheckCircle2, Clock, XCircle, Plus } from 'lucide-react';
import { useAuth }              from '@/hooks/useAuth';
import { useToast }             from '@/hooks/use-toast';
import { QRCodeSVG }            from 'qrcode.react';
import AppLoading               from '@/components/common/AppLoading';

const API = import.meta.env.VITE_API_URL;

// ─── Types ────────────────────────────────────────────────────────────────────
interface EsimOrder {
    id:             string;
    gosimPaymentId: string;
    locationCode:   string;
    locationName:   string;
    volumeBytes:    number;
    durationDays:   number;
    amount:         number;
    currency:       string;
    customerName:   string;
    customerEmail:  string;
    deliveryMethod: 'EMAIL' | 'WHATSAPP' | 'SMS';
    status:         'PENDING' | 'SUCCESS' | 'FAILED';
    iccid:          string | null;
    activationCode: string | null;
    createdAt:      string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatBytes = (bytes: number): string => {
    if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(0)} GB`;
    return `${(bytes / 1048576).toFixed(0)} MB`;
};

const STATUS_COLOR: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    SUCCESS: 'bg-green-100  text-green-800  border-green-300',
    FAILED:  'bg-red-100    text-red-800    border-red-300',
};

const STATUS_LABEL: Record<string, string> = {
    PENDING: 'En attente',
    SUCCESS: 'Activée',
    FAILED:  'Échouée',
};

const STATUS_ICON: Record<string, JSX.Element> = {
    PENDING: <Clock       className="w-4 h-4" />,
    SUCCESS: <CheckCircle2 className="w-4 h-4" />,
    FAILED:  <XCircle     className="w-4 h-4" />,
};

// ─── Main component ───────────────────────────────────────────────────────────
const ClientEsim = () => {
    const { user }                      = useAuth();
    const { toast }                     = useToast();
    const navigate                      = useNavigate();
    const [orders,   setOrders]         = useState<EsimOrder[]>([]);
    const [loading,  setLoading]        = useState(true);
    const [error,    setError]          = useState<string | null>(null);
    const [selected, setSelected]       = useState<EsimOrder | null>(null);

    // ── Fetch orders ──────────────────────────────────────────────────────────
    useEffect(() => {
        if (!user) return;
        const token = localStorage.getItem('token');
        fetch(`${API}/api/esim/my-orders`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(r => r.json())
            .then(data => setOrders(data.data ?? []))
            .catch(err => setError(err.message ?? 'Une erreur est survenue'))
            .finally(() => setLoading(false));
    }, [user]);

    // ── Copy to clipboard ─────────────────────────────────────────────────────
    const copy = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: `${label} copié !` });
    };

    return (
        <div className="space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    Retrouvez toutes vos eSIM de voyage et leurs codes d'activation.
                </p>
                <Button
                    onClick={() => navigate('/esim')}
                    className="text-white"
                    style={{ background: 'linear-gradient(135deg, #0865FE, #3B2F7E)' }}
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Acheter une eSIM
                </Button>
            </div>

            {/* Error */}
            {error && (
                <div className="text-center py-8 text-destructive text-sm">{error}</div>
            )}

            {/* Loading */}
            {loading && (
                <div className="bg-white rounded-2xl border border-gray-100 p-8">
                    <AppLoading
                        fullScreen={false}
                        message="Chargement de vos eSIMs..."
                        subMessage="Récupération de vos profils de connexion..."
                    />
                </div>
            )}

            {/* Empty */}
            {!loading && orders.length === 0 && (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <Wifi className="w-8 h-8 text-primary" />
                        </div>
                        <div className="text-center">
                            <p className="font-semibold text-gray-900">Aucune eSIM pour l'instant</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Achetez votre première eSIM de voyage et restez connecté partout.
                            </p>
                        </div>
                        <Button
                            onClick={() => navigate('/esim')}
                            className="text-white mt-2"
                            style={{ background: 'linear-gradient(135deg, #0865FE, #3B2F7E)' }}
                        >
                            <Wifi className="w-4 h-4 mr-2" />
                            Découvrir les forfaits
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Grid of orders */}
            {!loading && orders.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {orders.map(order => (
                        <Card
                            key={order.id}
                            className="cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5 border border-border"
                            onClick={() => setSelected(order)}
                        >
                            <CardContent className="p-5">
                                {/* Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                            <Wifi className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900">{order.locationName}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                                            </p>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className={STATUS_COLOR[order.status]}>
                                        <span className="flex items-center gap-1">
                                            {STATUS_ICON[order.status]}
                                            {STATUS_LABEL[order.status]}
                                        </span>
                                    </Badge>
                                </div>

                                {/* Details */}
                                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border text-center">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Volume</p>
                                        <p className="font-semibold text-sm">{formatBytes(order.volumeBytes)}</p>
                                    </div>
                                    <div className="border-x border-border">
                                        <p className="text-xs text-muted-foreground">Durée</p>
                                        <p className="font-semibold text-sm">{order.durationDays}j</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Prix</p>
                                        <p className="font-semibold text-sm text-primary">
                                            {Number(order.amount).toLocaleString()} {order.currency}
                                        </p>
                                    </div>
                                </div>

                                {/* ICCID preview */}
                                {order.iccid && (
                                    <div className="mt-3 bg-muted/40 rounded-lg px-3 py-2">
                                        <p className="text-xs text-muted-foreground">ICCID</p>
                                        <p className="text-xs font-mono truncate">{order.iccid}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Detail dialog */}
            <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                    {selected && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                                        <Wifi className="w-5 h-5 text-primary" />
                                    </div>
                                    {selected.locationName}
                                    <Badge variant="outline" className={STATUS_COLOR[selected.status]}>
                                        {STATUS_LABEL[selected.status]}
                                    </Badge>
                                </DialogTitle>
                            </DialogHeader>

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
                                            {Number(selected.amount).toLocaleString()} {selected.currency}
                                        </p>
                                    </div>
                                </div>

                                {/* QR Code si succès */}
                                {selected.status === 'SUCCESS' && selected.activationCode && (
                                    <div className="flex flex-col items-center gap-3 border rounded-xl p-5 bg-white">
                                        <QRCodeSVG value={selected.activationCode} size={160} />
                                        <p className="text-xs text-muted-foreground text-center">
                                            Scannez ce QR code pour activer votre eSIM
                                        </p>
                                    </div>
                                )}

                                {/* ICCID */}
                                {selected.iccid && (
                                    <div className="bg-muted/40 rounded-xl p-4">
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="text-xs font-medium text-muted-foreground">ICCID</p>
                                            <button
                                                onClick={() => copy(selected.iccid!, 'ICCID')}
                                                className="text-muted-foreground hover:text-primary transition-colors"
                                            >
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
                                            <button
                                                onClick={() => copy(selected.activationCode!, "Code d'activation")}
                                                className="text-muted-foreground hover:text-primary transition-colors"
                                            >
                                                <Copy className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                        <p className="text-xs font-mono break-all">{selected.activationCode}</p>
                                    </div>
                                )}

                                {/* Infos commande */}
                                <div className="border rounded-xl p-4 space-y-2 text-sm">
                                    <p className="font-semibold">Détails de la commande</p>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div>
                                            <span className="text-muted-foreground">Nom :</span>{' '}
                                            <strong>{selected.customerName}</strong>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Email :</span>{' '}
                                            <strong>{selected.customerEmail}</strong>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Livraison :</span>{' '}
                                            <strong>{selected.deliveryMethod}</strong>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Date :</span>{' '}
                                            <strong>{new Date(selected.createdAt).toLocaleDateString('fr-FR')}</strong>
                                        </div>
                                    </div>
                                </div>

                                {/* Instructions activation */}
                                {selected.status === 'SUCCESS' && (
                                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                                        <p className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                                            <Wifi className="w-4 h-4" />
                                            Comment activer votre eSIM
                                        </p>
                                        <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
                                            <li>Allez dans Réglages → Données mobiles → Ajouter un forfait</li>
                                            <li>Scannez le QR code ci-dessus</li>
                                            <li>Ou entrez le code d'activation manuellement</li>
                                            <li>Activez l'eSIM à destination</li>
                                        </ol>
                                    </div>
                                )}

                                {/* Bouton acheter une autre */}
                                <Button
                                    onClick={() => { setSelected(null); navigate('/esim'); }}
                                    variant="outline"
                                    className="w-full mb-3"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Acheter une autre eSIM
                                </Button>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ClientEsim;