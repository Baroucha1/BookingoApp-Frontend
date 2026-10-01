import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, AlertTriangle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BookingStepper from '@/components/flights/BookingStepper';
import ConfirmationCard from '@/components/flights/ConfirmationCard';
import { getBookingStatus, BookingStatusResponse } from '@/service/flights/bookingStatus.service';

type UiState = 'POLLING' | 'SUCCESS' | 'PENDING_TIMEOUT' | 'CANCELLED' | 'ERROR';

export default function FlightConfirmation() {
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const uniqueId = search.get('ref') || (typeof window !== 'undefined' ? localStorage.getItem('flight_uniqueId') : null);

  const [ui, setUi] = useState<UiState>('POLLING');
  const [data, setData] = useState<BookingStatusResponse | null>(null);
  const triesRef = useRef(0);
  const timerRef = useRef<number | null>(null);

  const poll = async () => {
    if (!uniqueId) { setUi('ERROR'); return; }
    triesRef.current += 1;
    const res = await getBookingStatus(uniqueId);
    setData(res);
    const status = (res?.status ?? '').toUpperCase();
    if (status === 'PAID' || status === 'TICKETED') { setUi('SUCCESS'); return; }
    if (status === 'CANCELLED') { setUi('CANCELLED'); return; }
    if (triesRef.current >= 10) { setUi('PENDING_TIMEOUT'); return; }
    timerRef.current = window.setTimeout(poll, 2000);
  };

  useEffect(() => {
    poll();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const retry = () => {
    triesRef.current = 0;
    setUi('POLLING');
    poll();
  };

  return (
    <div className="min-h-screen bg-[#0B0F2E]">
      <div className="max-w-3xl mx-auto px-4 pt-24 pb-16">
        <BookingStepper current={4} />

        {ui === 'POLLING' && (
          <div className="p-8 rounded-2xl bg-white/[0.04] border border-white/10 text-center space-y-4 animate-fade-in">
            <Loader2 className="w-10 h-10 text-[#F5A623] animate-spin mx-auto" />
            <h2 className="text-xl font-semibold text-white">Vérification du paiement en cours...</h2>
            <p className="text-white/60 text-sm">Merci de patienter, cela peut prendre quelques instants.</p>
          </div>
        )}

        {ui === 'SUCCESS' && data && <ConfirmationCard data={data} />}

        {ui === 'PENDING_TIMEOUT' && (
          <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center space-y-4 animate-fade-in">
            <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
            <h2 className="text-xl font-semibold text-white">Paiement en attente de confirmation</h2>
            <p className="text-amber-100/80 text-sm">Nous n'avons pas encore reçu la confirmation. Vous pouvez réessayer dans un instant.</p>
            <div className="flex justify-center gap-3">
              <Button onClick={retry} className="bg-[#F5A623] hover:bg-[#F5A623]/90 text-[#0B0F2E] font-semibold">Vérifier à nouveau</Button>
              <Button variant="outline" onClick={() => window.open('mailto:support@visago.dz')}>Contacter le support</Button>
            </div>
          </div>
        )}

        {ui === 'CANCELLED' && (
          <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/30 text-center space-y-4 animate-fade-in">
            <XCircle className="w-10 h-10 text-red-400 mx-auto" />
            <h2 className="text-xl font-semibold text-white">Réservation annulée</h2>
            <Button onClick={() => navigate('/flights')} className="bg-[#F5A623] hover:bg-[#F5A623]/90 text-[#0B0F2E] font-semibold">
              Nouvelle recherche
            </Button>
          </div>
        )}

        {ui === 'ERROR' && (
          <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/30 text-center space-y-4">
            <p className="text-red-200">Référence de réservation introuvable.</p>
            <Button onClick={() => navigate('/flights')}>Retour</Button>
          </div>
        )}
      </div>
    </div>
  );
}
