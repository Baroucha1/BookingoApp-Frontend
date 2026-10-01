import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import type { BookingStatusResponse } from '@/service/flights/bookingStatus.service';

export default function ConfirmationCard({ data }: { data: BookingStatusResponse }) {
  const navigate = useNavigate();
  const total = data.total?.amount?.toLocaleString();

  return (
    <div className="space-y-6 text-center animate-fade-in">
      <div className="flex justify-center">
        <div className="w-20 h-20 rounded-full bg-[#F5A623]/20 flex items-center justify-center animate-scale-in">
          <CheckCircle2 className="w-12 h-12 text-[#F5A623]" />
        </div>
      </div>
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-white">Réservation confirmée ! 🎉</h2>
        <p className="text-white/60 mt-1 text-sm">Un email de confirmation vous a été envoyé.</p>
      </div>

      <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md text-left">
        <dl className="grid grid-cols-[140px_1fr] gap-y-2 text-sm">
          {data.numPnr && (<><dt className="text-white/50">PNR</dt><dd className="text-white font-mono">{data.numPnr}</dd></>)}
          {data.ticketNumber && (<><dt className="text-white/50">Numéro ticket</dt><dd className="text-white font-mono">{data.ticketNumber}</dd></>)}
          {data.airline && (<><dt className="text-white/50">Compagnie</dt><dd className="text-white">{data.airline}</dd></>)}
          {(data.origin || data.destination) && (<><dt className="text-white/50">Vol</dt><dd className="text-white">{data.origin} → {data.destination}</dd></>)}
          {data.date && (<><dt className="text-white/50">Date</dt><dd className="text-white">{data.date}</dd></>)}
          {data.passengers && data.passengers.length > 0 && (
            <><dt className="text-white/50">Passager(s)</dt><dd className="text-white">{data.passengers.join(', ')}</dd></>
          )}
          {total && (<><dt className="text-white/50">Total payé</dt><dd className="text-[#F5A623] font-semibold">{total} {data.total?.currencyCode}</dd></>)}
        </dl>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button variant="outline" onClick={() => window.print()}>Télécharger le billet</Button>
        <Button onClick={() => navigate('/flights/my-bookings')} className="bg-[#F5A623] hover:bg-[#F5A623]/90 text-[#0B0F2E] font-semibold">
          Voir mes réservations
        </Button>
      </div>
    </div>
  );
}
