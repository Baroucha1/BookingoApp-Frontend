import { Plane, ChevronRight, Calendar } from 'lucide-react';
import BookingStatusBadge from './BookingStatusBadge';
import type { BookingListItem } from '@/service/flights/searchBookings.service';

interface Props {
  booking: BookingListItem;
  onOpen: (b: BookingListItem) => void;
}

export default function BookingCard({ booking, onOpen }: Props) {
  const passengerName = booking.passengers?.[0]
      ? `${booking.passengers[0].firstName} ${booking.passengers[0].lastName}`
      : null;

  return (
      <button
          type="button"
          onClick={() => onOpen(booking)}
          className="w-full text-left p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-[#F5A623]/60 hover:shadow-md transition-all"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-[#0B0F2E] font-semibold">
            <Plane className="w-4 h-4 text-[#F5A623]" />
            {booking.departureAirport ?? '—'} → {booking.arrivalAirport ?? '—'}
          </div>
          <BookingStatusBadge status={booking.status} />
        </div>

        <div className="flex items-center gap-3 text-sm text-slate-400 mb-2">
          {booking.departureDate && (
              <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
                {new Date(booking.departureDate as string).toLocaleDateString('fr-DZ', {
                  day: 'numeric', month: 'short', year: 'numeric'
                })}
          </span>
          )}
          {(booking as any).airlineName && (
              <span>{(booking as any).airlineName}</span>
          )}
          {!(booking as any).airlineName && (booking as any).airlineCode && (
              <span>{(booking as any).airlineCode}</span>
          )}
        </div>

        {passengerName && (
            <div className="text-sm text-slate-600 mb-3">{passengerName}
              {booking.passengers && booking.passengers.length > 1 && (
                  <span className="text-slate-400 ml-1">+{booking.passengers.length - 1}</span>
              )}
            </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div className="text-xs text-slate-400 space-x-3">
            {booking.pnr && (
                <span>PNR: <span className="font-mono text-[#0B0F2E] font-medium">{booking.pnr}</span></span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="text-lg font-bold text-[#F5A623]">
              {Number(booking.totalAmount).toLocaleString()}{' '}
              <span className="text-xs text-slate-400 font-normal">{booking.currency ?? 'DZD'}</span>
            </div>
            <div className="text-xs text-[#F5A623] flex items-center gap-0.5">
              Détails <ChevronRight className="w-3 h-3" />
            </div>
          </div>
        </div>
      </button>
  );
}