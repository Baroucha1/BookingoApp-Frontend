// src/components/flights/FlightSummaryCard.tsx
import { Luggage, Briefcase, RotateCcw, AlertTriangle } from 'lucide-react';
import { getAirlineLogo } from '@/service/flights/airlines';
import { cn } from '@/lib/utils';
import type { DisplayOffer } from '@/service/flights_aggregator/aggregatedNormalize';
import type { NormalizedSegment } from '@/service/flights_aggregator/aggregatedTypes';

interface PassengerCounts {
  adults: number;
  children?: number;
  infants?: number;
}

interface Props {
  offer?: DisplayOffer | null;
  passengers?: PassengerCounts;
}

function InfoPill({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
      <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
        <Icon className="w-3.5 h-3.5 text-[#0865FE]" />
        {label}
      </span>
  );
}

function SegmentRow({ s }: { s?: NormalizedSegment }) {
  if (!s) return null;
  return (
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span className="w-4 h-4 rounded-full bg-red-500 inline-flex items-center justify-center text-white text-[9px] font-bold shrink-0">✈</span>
        <span className="font-medium text-slate-600">{s.carrierCode}{s.flightNumber}</span>
        <span>{s.departure?.airport ?? ''} → {s.arrival?.airport ?? ''}</span>
      </div>
  );
}

function LegBlock({ label, leg, isRoundTrip }: { label: string; leg?: DisplayOffer['legs'][number]; isRoundTrip?: boolean }) {
  if (!leg) return null;
  return (
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="inline-block text-[11px] font-bold text-white uppercase tracking-wide bg-[#0865FE] px-2.5 py-0.5 rounded-md shadow-2xs">
              {label}
            </span>
            {leg.departureDate && (
              <span className="text-xs font-semibold text-slate-700">{leg.departureDate}</span>
            )}
          </div>
          <span className="text-[10px] font-bold text-slate-600 bg-white/90 px-2 py-0.5 rounded border border-slate-200">
            {leg.isDirect ? 'Direct' : leg.stopsLabel}
          </span>
        </div>

        <div className="grid grid-cols-[1fr,auto,1fr] items-center gap-3">
          <div>
            <div className="text-2xl font-bold text-[#0B0F2E]">{leg.departureTime}</div>
            <div className="text-sm font-semibold text-[#0865FE]">{leg.originAirport}</div>
          </div>

          <div className="flex flex-col items-center justify-center px-2">
            <span className="text-[11px] text-slate-500 mb-0.5 font-medium">{leg.durationLabel}</span>
            <div className="w-24 sm:w-32 h-px border-t border-dashed border-[#0865FE]/40" />
            <span className="text-[10px] text-slate-400 mt-0.5">{leg.stopsLabel}</span>
          </div>

          <div className="text-right">
            <div className="text-2xl font-bold text-[#0B0F2E]">{leg.arrivalTime}</div>
            <div className="text-sm font-semibold text-[#0865FE]">{leg.destinationAirport}</div>
          </div>
        </div>

        {leg.segments && leg.segments.length > 0 && (
          <div className="space-y-1 pt-1 border-t border-slate-200/50">
            {leg.segments.map((s, i) => <SegmentRow key={s?.paxSegmentRefId ?? i} s={s} />)}
          </div>
        )}

        {leg.checkedBaggage && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
              <Luggage className="w-3.5 h-3.5" /> Bagage inclus ({leg.checkedBaggage})
            </div>
        )}
      </div>
  );
}

export default function FlightSummaryCard({ offer, passengers }: Props) {
  if (!offer) {
    return (
        <div className="p-5 rounded-2xl bg-[#DFECFF] shadow-sm text-slate-400 text-sm">
          Aucun vol sélectionné.
        </div>
    );
  }

  const changeFee = offer.raw?.changeFee;

  const fallbackLeg: DisplayOffer['legs'][number] = {
    originDestId: 'outbound',
    originAirport: offer.originAirport,
    destinationAirport: offer.destinationAirport,
    departureTime: offer.departureTime,
    departureDate: offer.departureDate,
    arrivalTime: offer.arrivalTime,
    arrivalDate: offer.arrivalDate,
    durationLabel: offer.totalDurationLabel,
    isDirect: offer.isDirect,
    stopsLabel: offer.stopsLabel,
    checkedBaggage: offer.checkedBaggage,
    segments: offer.raw?.segments ?? [],
  };

  const legsToRender = offer.legs && offer.legs.length > 0 ? offer.legs : [fallbackLeg];

  const isRoundTrip = legsToRender.length === 2 &&
      legsToRender[0].originAirport === legsToRender[1].destinationAirport &&
      legsToRender[0].destinationAirport === legsToRender[1].originAirport;

  const getLegLabel = (idx: number, leg: DisplayOffer['legs'][number]) => {
      if (isRoundTrip) {
          return idx === 0 ? 'ALLER' : 'RETOUR';
      }
      if (legsToRender.length === 1) {
          return 'VOL ALLER';
      }
      return `VOL ${idx + 1} • ${leg.originAirport} → ${leg.destinationAirport}`;
  };

  return (
      <div className="p-5 rounded-2xl bg-[#DFECFF] shadow-sm space-y-4">

        <div className="flex items-center gap-3">
          <img
              src={getAirlineLogo(offer.airlineCode)}
              alt={offer.airlineCode}
              className="w-9 h-9 object-contain rounded-full border border-white bg-white p-1 shrink-0"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
          <div>
            <div className="text-[#0B0F2E] font-semibold">{offer.airlineName}</div>
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              {offer.cabinName ?? '—'}
              {offer.brandName && <span className="text-slate-300">· {offer.brandName}</span>}
              {!isRoundTrip && legsToRender.length > 1 && (
                <span className="text-[#0865FE] font-bold">· Multi-destinations ({legsToRender.length} vols)</span>
              )}
            </div>
          </div>
        </div>

        {/* Display each flight individually in its own card */}
        <div className="space-y-3">
          {legsToRender.map((leg, idx) => (
            <div
              key={leg.originDestId || idx}
              className={cn(
                legsToRender.length > 1
                  ? 'p-4 rounded-xl bg-white/85 border border-blue-200/70 shadow-2xs space-y-3'
                  : 'space-y-3'
              )}
            >
              <LegBlock label={getLegLabel(idx, leg)} leg={leg} isRoundTrip={isRoundTrip} />
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4 flex-wrap pt-3 border-t border-blue-200/60">
          {offer.checkedBaggage ? (
              <InfoPill icon={Luggage} label={`Bagage en soute : ${offer.checkedBaggage}`} />
          ) : offer.chargeableFirstBagPrice ? (
              <InfoPill icon={Luggage} label={`Bagage à partir de ${offer.chargeableFirstBagPrice.amount.toLocaleString('fr-FR')} ${offer.chargeableFirstBagPrice.currency}`} />
          ) : (
              <InfoPill icon={Luggage} label="Bagage non inclus" />
          )}
          {changeFee && (
              <InfoPill
                  icon={Briefcase}
                  label={changeFee.amount === 0 ? 'Modifiable sans frais' : `Modifiable : ${changeFee.amount.toLocaleString('fr-FR')} ${changeFee.currency}`}
              />
          )}
          {offer.refundable !== null && (
              <InfoPill icon={RotateCcw} label={offer.refundable ? 'Remboursable' : 'Non remboursable'} />
          )}
          {offer.fareType && (
              <InfoPill icon={Luggage} label={offer.fareType} />
          )}
        </div>

        {offer.seatsRemaining != null && offer.seatsRemaining <= 5 && (
            <div className="flex items-center gap-1.5 text-amber-700 text-xs font-medium bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <AlertTriangle className="w-3.5 h-3.5" />
              Plus que {offer.seatsRemaining} place{offer.seatsRemaining > 1 ? 's' : ''} disponible{offer.seatsRemaining > 1 ? 's' : ''}
            </div>
        )}

        {passengers && (
            <div className="text-xs text-slate-500 pt-3 border-t border-blue-200/60">
              {passengers.adults} ADT
              {(passengers.children ?? 0) > 0 ? ` · ${passengers.children} CHD` : ''}
              {(passengers.infants ?? 0) > 0 ? ` · ${passengers.infants} INF` : ''}
            </div>
        )}
      </div>
  );
}