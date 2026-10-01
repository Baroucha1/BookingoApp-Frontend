import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plane, Calendar, Search, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import AppLoading from '@/components/common/AppLoading';
import BookingCard from '@/components/flights/BookingCard';
import BookingDetailDrawer from '@/components/flights/BookingDetailDrawer';
import { searchBookings, BookingListItem } from '@/service/flights/searchBookings.service';

const todayStr = () => new Date().toISOString().slice(0, 10);
const daysAgoStr = (n: number) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);

const STATUS_OPTIONS = [
  { value: 'BOOKED',    label: 'Réservé',   color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'PAID',      label: 'Payé',      color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { value: 'TICKETED',  label: 'Émis',      color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { value: 'CANCELLED', label: 'Annulé',    color: 'bg-red-100 text-red-700 border-red-200' },
  { value: 'FAILED',    label: 'Échoué',    color: 'bg-slate-100 text-slate-500 border-slate-200' },
];

export default function FlightMyBookings() {
  const navigate = useNavigate();
  const [dateFrom, setDateFrom]     = useState(daysAgoStr(30));
  const [dateTo, setDateTo]         = useState(todayStr());
  const [query, setQuery]           = useState('');
  const [statuses, setStatuses]     = useState<string[]>([]);
  const [items, setItems]           = useState<BookingListItem[]>([]);
  const [loading, setLoading]       = useState(true);
  const [selected, setSelected]     = useState<BookingListItem | null>(null);

  const runSearch = async () => {
    setLoading(true);
    const r = await searchBookings({ bookingDateFrom: dateFrom, bookingDateTo: dateTo, statuses, query });
    setItems(r);
    setLoading(false);
  };

  useEffect(() => { runSearch(); }, []);

  const toggleStatus = (v: string) =>
      setStatuses(s => s.includes(v) ? s.filter(x => x !== v) : [...s, v]);

  // Stats
  const total     = items.length;
  const confirmed = items.filter(b => b.status === 'BOOKED' || b.status === 'PAID' || b.status === 'TICKETED').length;
  const revenue   = items.reduce((s, b) => s + (Number(b.totalAmount) || 0), 0);

  return (
      <div className="min-h-screen bg-gradient-to-b from-[#DFECFF] via-[#F0F6FF] to-[#DFECFF]">
        {/* Header */}
        <div className="bg-transparent border-b border-slate-200/60">
          <div
            className="max-w-5xl mx-auto px-4 pb-6"
            style={{
              paddingTop: 'calc(env(safe-area-inset-top, 0px) + 5rem)',
            }}
          >
            <button
                onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/flights')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-700 hover:text-[#0865FE] hover:border-[#0865FE]/30 font-semibold text-xs shadow-xs hover:shadow-sm transition-all mb-4 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Retour</span>
            </button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-[#0B0F2E] flex items-center gap-2">
                  <Plane className="w-6 h-6 text-[#F5A623]" />
                  Mes réservations
                </h1>
                <p className="text-slate-400 text-sm mt-1">Consultez et gérez vos vols réservés</p>
              </div>
              <Button
                  onClick={() => navigate('/flights')}
                  className="bg-[#F5A623] hover:bg-[#F5A623]/90 text-[#0B0F2E] font-semibold hidden sm:flex"
              >
                + Nouveau vol
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total réservations', value: total, icon: <Plane className="w-4 h-4" /> },
              { label: 'Confirmées', value: confirmed, icon: <Calendar className="w-4 h-4" /> },
              { label: 'Montant total', value: `${revenue.toLocaleString()} DZD`, icon: null },
            ].map((s, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                  <div className="text-slate-400 text-xs mb-1">{s.label}</div>
                  <div className="text-xl font-bold text-[#0B0F2E]">{s.value}</div>
                </div>
            ))}
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
            <div className="flex items-center gap-2 text-[#0B0F2E] font-semibold text-sm">
              <SlidersHorizontal className="w-4 h-4 text-[#F5A623]" />
              Filtres
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] uppercase tracking-wider text-slate-400 mb-1 block">Du</label>
                <input
                    type="date" value={dateFrom}
                    onChange={e => setDateFrom(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-slate-50 border border-slate-200 text-sm text-[#0B0F2E] focus:outline-none focus:border-[#F5A623]"
                />
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wider text-slate-400 mb-1 block">Au</label>
                <input
                    type="date" value={dateTo}
                    onChange={e => setDateTo(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-slate-50 border border-slate-200 text-sm text-[#0B0F2E] focus:outline-none focus:border-[#F5A623]"
                />
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wider text-slate-400 mb-1 block">PNR ou passager</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
                  <input
                      value={query}
                      onChange={e => setQuery(e.target.value)}
                      placeholder="9MSU79, Benali..."
                      className="w-full h-10 pl-8 pr-3 rounded-lg bg-slate-50 border border-slate-200 text-sm text-[#0B0F2E] placeholder:text-slate-300 focus:outline-none focus:border-[#F5A623]"
                  />
                </div>
              </div>
            </div>

            {/* Status pills */}
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map(s => (
                  <button
                      key={s.value}
                      type="button"
                      onClick={() => toggleStatus(s.value)}
                      className={`px-3 py-1 rounded-full text-xs border font-medium transition-all ${
                          statuses.includes(s.value)
                              ? s.color
                              : 'bg-slate-50 text-slate-400 border-slate-200 hover:border-slate-300'
                      }`}
                  >
                    {s.label}
                  </button>
              ))}
            </div>

            <Button
                onClick={runSearch}
                disabled={loading}
                className="w-full h-10 bg-[#F5A623] hover:bg-[#F5A623]/90 text-[#0B0F2E] font-semibold rounded-xl"
            >
              {loading ? 'Recherche...' : 'Rechercher'}
            </Button>
          </div>

          {/* Results */}
          <div className="space-y-3">
            {loading ? (
                <div className="py-12 bg-white rounded-2xl border border-slate-200">
                  <AppLoading
                    fullScreen={false}
                    message="Recherche de vos réservations de vols..."
                    subMessage="Interrogation des réservations en cours..."
                  />
                </div>
            ) : items.length === 0 ? (
                <div className="text-center py-16 rounded-2xl bg-white border border-slate-200">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <Plane className="w-8 h-8 text-slate-300" />
                  </div>
                  <h3 className="text-[#0B0F2E] font-semibold mb-1">Aucune réservation trouvée</h3>
                  <p className="text-slate-400 text-sm mb-6">Essayez d'élargir la période de recherche</p>
                  <Button
                      onClick={() => navigate('/flights')}
                      className="bg-[#F5A623] hover:bg-[#F5A623]/90 text-[#0B0F2E] font-semibold"
                  >
                    Rechercher un vol
                  </Button>
                </div>
            ) : (
                <>
                  <p className="text-slate-400 text-xs">{items.length} réservation{items.length > 1 ? 's' : ''} trouvée{items.length > 1 ? 's' : ''}</p>
                  {items.map((b) => (
                      <BookingCard key={b.id} booking={b} onOpen={setSelected} />
                  ))}
                </>
            )}
          </div>
        </div>

        <BookingDetailDrawer
            open={!!selected}
            onOpenChange={(o) => !o && setSelected(null)}
            pnr={selected?.pnr ?? ''}
            refId={selected?.id ?? ''}
            onChanged={runSearch}
        />
      </div>
  );
}