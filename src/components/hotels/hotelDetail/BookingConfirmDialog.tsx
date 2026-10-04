import { Loader2, AlertTriangle, ShieldCheck, RefreshCw, CalendarDays, Coffee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import type { HotelPolicies } from '@/service/hotels/hotels.service';
import { formatAmount, type RoomOffer } from '@/lib/roomFilters';

interface BookingConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    offer: RoomOffer | null;
    policies: HotelPolicies | null;
    loading: boolean;
    error: string | null;
    hotelName: string;
    dateLabel: string;
    nights: number;
    onRetry: () => void;
    onRefreshSearch: () => void;
    onConfirm: () => void;
}

function describePenalty(p: { type: string; value: number | string }, currency: string) {
    if (p.type === 'Percentage') return `${p.value}% du montant`;
    if (p.type === 'Amount') return `${p.value} ${currency}`;
    return `${p.value} nuit(s)`;
}

export default function BookingConfirmDialog({
                                                 open, onOpenChange, offer, policies, loading, error,
                                                 hotelName, dateLabel, nights, onRetry, onRefreshSearch, onConfirm,
                                             }: BookingConfirmDialogProps) {
    const currency = policies?.policies.currency ?? offer?.currency ?? '';
    const priceChanged = !!(policies && offer && Math.abs(Number(policies.price) - offer.price) > 0.5);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogTitle className="text-lg font-bold text-slate-900">Confirmer votre réservation</DialogTitle>
                <DialogDescription className="text-sm text-slate-500 flex items-center gap-1.5">
                    <CalendarDays className="w-4 h-4 shrink-0" />
                    {hotelName} · {dateLabel} · {nights} nuit{nights > 1 ? 's' : ''}
                </DialogDescription>

                {offer && (
                    <div className="rounded-lg bg-slate-50 p-3 mt-1">
                        <div className="font-semibold text-sm text-slate-800">{offer.roomName}</div>
                        {offer.boardLabel && (
                            <div className="text-xs text-emerald-700 flex items-center gap-1 mt-1">
                                <Coffee className="w-3 h-3" /> {offer.boardLabel}
                            </div>
                        )}
                    </div>
                )}

                {loading && (
                    <div className="py-8 flex flex-col items-center gap-2 text-sm text-slate-500">
                        <Loader2 className="w-6 h-6 animate-spin text-[#1775FF]" />
                        Vérification du prix et des conditions…
                    </div>
                )}

                {!loading && error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 space-y-3">
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>{error}. Cette offre a peut-être expiré.</span>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={onRetry}>Réessayer</Button>
                            <Button size="sm" className="bg-[#1775FF] hover:bg-[#1775FF]/90" onClick={onRefreshSearch}>
                                <RefreshCw className="w-3.5 h-3.5 mr-1" /> Actualiser les prix
                            </Button>
                        </div>
                    </div>
                )}

                {!loading && !error && policies && (
                    <div className="space-y-4 text-sm">
                        {priceChanged && offer && (
                            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800 text-xs flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 shrink-0" />
                                <span>
                                    Le prix a changé depuis votre recherche :{' '}
                                    <s>{formatAmount(offer.price, offer.currency)}</s> → <strong>{formatAmount(Number(policies.price), currency)}</strong>
                                </span>
                            </div>
                        )}

                        <div className="flex justify-between items-baseline">
                            <span className="text-slate-500">Prix total confirmé</span>
                            <span className="text-xl font-bold text-slate-900">{formatAmount(Number(policies.price), currency)}</span>
                        </div>

                        <div className="rounded-lg border border-slate-100 p-3 space-y-2">
                            <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                                <ShieldCheck className="w-4 h-4 text-[#1775FF]" /> Conditions d'annulation
                            </div>
                            <div className="flex justify-between gap-3 text-xs">
                                <span className="text-slate-500">Annulation gratuite jusqu'au</span>
                                <span className="font-medium text-slate-800 text-right">{policies.policies.cancellationDeadline || '—'}</span>
                            </div>
                            {policies.policies.policies.length > 0 && (
                                <ul className="text-xs text-slate-600 space-y-0.5 list-disc pl-4">
                                    {policies.policies.policies.map((p, i) => (
                                        <li key={i}>À partir du {p.from} : {describePenalty(p, currency)}</li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {policies.policies.restrictions.length > 0 && (
                            <div>
                                <div className="text-slate-500 text-xs mb-1">Restrictions</div>
                                <ul className="text-xs text-slate-600 space-y-0.5 list-disc pl-4">
                                    {policies.policies.restrictions.map((r, i) => <li key={i}>{r}</li>)}
                                </ul>
                            </div>
                        )}

                        {policies.policies.alerts.length > 0 && (
                            <div className="flex items-start gap-1.5 text-amber-700 text-xs bg-amber-50 rounded-lg p-3">
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                <span>{policies.policies.alerts.join(' · ')}</span>
                            </div>
                        )}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3 pt-2">
                    <Button variant="outline" className="h-11" onClick={() => onOpenChange(false)}>
                        Annuler
                    </Button>
                    <Button
                        className="h-11 bg-[#F5A623] hover:bg-[#F5A623]/90 text-[#0B2A5C] font-bold"
                        disabled={loading || !!error || !policies}
                        onClick={onConfirm}
                    >
                        Confirmer et continuer
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}