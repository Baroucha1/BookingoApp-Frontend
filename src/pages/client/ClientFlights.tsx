import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Plane, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { searchBookings, type BookingListItem } from '@/service/flights/searchBookings.service';
import AppLoading from '@/components/common/AppLoading';

const STATUS_COLOR: Record<string, string> = {
    PENDING: 'bg-amber-50 text-amber-600 border-amber-200',
    CONFIRMED: 'bg-green-50 text-green-600 border-green-200',
    TICKETED: 'bg-green-50 text-green-600 border-green-200',
    CANCELLED: 'bg-gray-50 text-gray-600 border-gray-200',
};

const STATUS_LABEL: Record<string, string> = {
    PENDING: 'En attente',
    CONFIRMED: 'Confirmé',
    TICKETED: 'Confirmé',
    CANCELLED: 'Annulé',
};

const formatDate = (iso?: string) => {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
        return iso;
    }
};

const ClientFlights = () => {
    const [flights, setFlights] = useState<BookingListItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        searchBookings({})
            .then(setFlights)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-semibold text-gray-900">Mes vols</h1>
                <p className="text-sm text-gray-500 mt-1">Historique de vos réservations de vol.</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6">
                {loading && (
                    <div className="py-8">
                        <AppLoading
                            fullScreen={false}
                            message="Chargement de vos billets et vols..."
                            subMessage="Recherche de vos dossiers de vol..."
                        />
                    </div>
                )}

                {!loading && flights.length === 0 && (
                    <div className="text-center py-10">
                        <Plane className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-400">Aucune réservation de vol.</p>
                    </div>
                )}

                <div className="space-y-3">
                    {flights.map(f => (
                        <div
                            key={f.id}
                            className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                                <Plane className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <Badge
                                    variant="outline"
                                    className={`mb-1 text-xs font-normal ${STATUS_COLOR[f.status ?? ''] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}
                                >
                                    {STATUS_LABEL[f.status ?? ''] ?? f.status ?? '—'}
                                </Badge>
                                <p className="font-medium text-gray-900 truncate">{f.departureAirport} → {f.arrivalAirport}</p>
                                <p className="text-xs text-gray-400">
                                    {formatDate(f.departureDate)} · {f.passengers?.length ?? 1} passager · {f.pnr ?? f.uniqueId ?? ''}
                                </p>
                                {f.office && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        Paiement en agence : <span className="font-medium text-gray-700">{f.office.name}, {f.office.wilaya}</span>
                                    </p>
                                )}
                            </div>
                            <div className="text-right shrink-0 flex items-center gap-2">
                                <p className="font-semibold text-sm text-gray-900">
                                    {f.totalAmount != null ? `${f.totalAmount} ${f.currency ?? 'DZD'}` : '—'}
                                </p>
                                <ChevronRight className="w-4 h-4 text-gray-300" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ClientFlights;