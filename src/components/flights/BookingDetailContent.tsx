import { useEffect, useState } from 'react';
import { Plane, User, CreditCard, Clock, Luggage } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import BookingStatusBadge from './BookingStatusBadge';
import { getBookingDetail, BookingDetail } from '@/service/flights/bookingDetail.service';

function maskPassport(p?: string): string {
  if (!p) return '—';
  if (p.length <= 4) return p;
  return p.slice(0, 4) + '*'.repeat(Math.max(0, p.length - 4));
}

const PAX_LABELS: Record<string, string> = { ADT: 'Adulte', CHD: 'Enfant', INF: 'Bébé' };

interface Props {
  pnr: string;
  refId: string;
  onClose?: () => void;
  onChanged?: () => void;
}

export default function BookingDetailContent({ pnr, refId, onClose, onChanged }: Props) {
  const [data, setData] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getBookingDetail(pnr, refId).then((d) => { setData(d); setLoading(false); });
  }, [pnr, refId]);

  if (loading) {
    return (
        <div className="space-y-3">
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
    );
  }

  if (!data) {
    return (
        <div className="text-center py-12">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
            <Plane className="w-6 h-6 text-slate-300" />
          </div>
          <p className="text-slate-400 text-sm">Réservation introuvable.</p>
        </div>
    );
  }

  const passengers: any[] = data.passengers ?? [];
  const payment = data.payment as any;

  return (
      <div className="space-y-4">

        {/* Flight header card */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 font-semibold text-[#0B0F2E]">
              <Plane className="w-4 h-4 text-[#F5A623]" />
              {data.departureAirport ?? '—'} → {data.arrivalAirport ?? '—'}
            </div>
            <BookingStatusBadge status={data.status} />
          </div>

          {/* Flight meta row */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {data.departureDate && (
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Clock className="w-3 h-3 text-[#F5A623]" />
                  {new Date(data.departureDate as string).toLocaleDateString('fr-DZ', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })}
                </div>
            )}
            {(data as any).airlineName && (
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Plane className="w-3 h-3 text-[#F5A623]" />
                  {(data as any).airlineName}
                </div>
            )}
            {(data as any).cabinClass && (
                <div className="flex items-center gap-1.5 text-slate-500">
                  <span className="text-[#F5A623]">✦</span> {(data as any).cabinClass}
                </div>
            )}
            {(data as any).baggage && (
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Luggage className="w-3 h-3 text-[#F5A623]" /> {(data as any).baggage}
                </div>
            )}
          </div>

          {/* PNR / ref */}
          <div className="flex gap-4 mt-3 pt-3 border-t border-slate-200 text-xs text-slate-400">
            {data.pnr && (
                <span>PNR: <span className="font-mono text-[#0B0F2E] font-semibold">{data.pnr}</span></span>
            )}
            {data.uniqueId && (
                <span>Réf: <span className="font-mono text-[#0B0F2E]">{data.uniqueId}</span></span>
            )}
          </div>
        </div>

        <Tabs defaultValue="details">
          <TabsList className="w-full grid grid-cols-2 bg-slate-100">
            <TabsTrigger value="details" className="data-[state=active]:bg-white data-[state=active]:text-[#0B0F2E]">
              Détails
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-white data-[state=active]:text-[#0B0F2E]">
              Historique
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 mt-4">

            {/* Passengers */}
            <section className="space-y-2">
              <h4 className="text-xs uppercase tracking-wider text-slate-400 font-medium flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Passagers
              </h4>
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                {passengers.length === 0 ? (
                    <p className="text-sm text-slate-400 p-3">Aucun passager.</p>
                ) : passengers.map((p, i) => (
                    <div
                        key={i}
                        className={`flex items-center justify-between p-3 text-sm ${
                            i < passengers.length - 1 ? 'border-b border-slate-100' : ''
                        }`}
                    >
                      <div>
                        <div className="font-medium text-[#0B0F2E]">
                          {[p?.passengerTitle, p?.firstName, p?.lastName].filter(Boolean).join(' ') || '—'}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {PAX_LABELS[p?.paxType] ?? p?.paxType}
                          {p?.nationality ? ` · ${p.nationality}` : ''}
                          {p?.birthday ? ` · né(e) ${new Date(p.birthday).toLocaleDateString('fr-DZ')}` : ''}
                        </div>
                      </div>
                      <span className="font-mono text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded">
                    {maskPassport(p?.passportNumber)}
                  </span>
                    </div>
                ))}
              </div>
            </section>

            {/* Fare + Payment */}
            <section className="space-y-2">
              <h4 className="text-xs uppercase tracking-wider text-slate-400 font-medium flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5" /> Tarif & Paiement
              </h4>
              <div className="rounded-xl border border-slate-200 overflow-hidden text-sm">
                {payment?.method && (
                    <div className="flex justify-between items-center p-3 border-b border-slate-100">
                      <span className="text-slate-500">Méthode</span>
                      <span className="font-medium text-[#0B0F2E]">{payment.method}</span>
                    </div>
                )}
                {payment?.status && (
                    <div className="flex justify-between items-center p-3 border-b border-slate-100">
                      <span className="text-slate-500">Statut paiement</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          payment.status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-700'
                      }`}>
                    {payment.status}
                  </span>
                    </div>
                )}
                {payment?.paidAt && (
                    <div className="flex justify-between items-center p-3 border-b border-slate-100">
                      <span className="text-slate-500">Payé le</span>
                      <span className="text-[#0B0F2E]">{new Date(payment.paidAt).toLocaleDateString('fr-DZ')}</span>
                    </div>
                )}
                <div className="flex justify-between items-center p-3 bg-slate-50">
                  <span className="font-semibold text-[#0B0F2E]">Total</span>
                  <span className="text-lg font-bold text-[#F5A623]">
                  {Number(data.totalAmount).toLocaleString()} {data.currency ?? 'DZD'}
                </span>
                </div>
              </div>
            </section>
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <div className="rounded-xl border border-slate-200 overflow-hidden text-sm">
              {[
                { label: 'Réservation créée', date: data.createdAt },
                { label: 'Paiement effectué', date: payment?.paidAt },
                { label: 'Dernière mise à jour', date: data.updatedAt !== data.createdAt ? data.updatedAt : null },
              ]
                  .filter(e => !!e.date)
                  .map((e, i, arr) => (
                      <div
                          key={i}
                          className={`flex justify-between items-center p-3 ${
                              i < arr.length - 1 ? 'border-b border-slate-100' : ''
                          }`}
                      >
                        <span className="text-slate-500">{e.label}</span>
                        <span className="text-[#0B0F2E] font-mono text-xs">
                    {new Date(e.date as string).toLocaleString('fr-DZ')}
                  </span>
                      </div>
                  ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
  );
}