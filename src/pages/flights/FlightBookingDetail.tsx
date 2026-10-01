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
      <div
        className="max-w-3xl mx-auto px-4 pb-16"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 6rem)',
        }}
      >
        <button
          onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/flights/my-bookings')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white/90 hover:text-white border border-white/15 text-xs font-semibold backdrop-blur-md mb-6 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Mes réservations</span>
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
