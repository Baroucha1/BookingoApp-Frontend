import { Loader2, Coffee, BedDouble } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatAmount, type RoomOffer } from '@/lib/roomFilters';

interface RoomOfferCardProps {
    offer: RoomOffer;
    checking: boolean;
    onReserve: () => void;
}

export default function RoomOfferCard({ offer, checking, onReserve }: RoomOfferCardProps) {
    const roomCount = offer.option.rooms.length;

    return (
        <div className="border border-slate-100 rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3 hover:border-[#1775FF]/30 transition-colors">
            <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-slate-800 flex items-start gap-1.5">
                    <BedDouble className="w-4 h-4 text-[#1775FF] shrink-0 mt-0.5" />
                    <span>{offer.roomName}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                    {offer.boardLabel && (
                        <span className="flex items-center gap-1 text-[11px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                            <Coffee className="w-3 h-3" /> {offer.boardLabel}
                        </span>
                    )}
                    {roomCount > 1 && (
                        <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                            {roomCount} chambres
                        </span>
                    )}
                </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0">
                <div className="sm:text-right">
                    <div className="text-[11px] text-slate-400">Total du séjour</div>
                    <div className="text-lg font-bold text-[#1775FF] whitespace-nowrap">{formatAmount(offer.price, offer.currency)}</div>
                </div>
                <Button
                    onClick={onReserve}
                    disabled={checking}
                    className="bg-[#F5A623] hover:bg-[#F5A623]/90 text-[#0B2A5C] font-bold text-xs shrink-0 min-w-[110px]"
                >
                    {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Réserver'}
                </Button>
            </div>
        </div>
    );
}