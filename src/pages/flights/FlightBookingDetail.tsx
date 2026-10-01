import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import BookingDetailContent from '@/components/flights/BookingDetailContent';

export default function FlightBookingDetail() {
  const navigate = useNavigate();
  const { ref } = useParams<{ ref: string }>();
  const [search] = useSearchParams();
  const pnr = search.get('pnr') ?? '';
  const refId = ref ?? '';

  return (
    <div className="min-h-screen bg-[#0B0F2E]">
      <div className="max-w-3xl mx-auto px-4 pt-24 pb-16">
        <button onClick={() => navigate('/flights/my-bookings')} className="text-white/70 hover:text-white flex items-center gap-2 text-sm mb-6">
          <ArrowLeft className="w-4 h-4" /> Mes réservations
        </button>

        {refId ? (
          <BookingDetailContent
            pnr={pnr}
            refId={refId}
            onClose={() => navigate('/flights/my-bookings')}
            onChanged={() => navigate('/flights/my-bookings')}
          />
        ) : (
          <p className="text-white/60">Référence manquante.</p>
        )}
      </div>
    </div>
  );
}
