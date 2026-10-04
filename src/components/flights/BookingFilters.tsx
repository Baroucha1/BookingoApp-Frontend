import { useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { STATUS_OPTIONS } from './BookingStatusBadge';

export interface BookingFiltersValue {
  bookingDateFrom: string;
  bookingDateTo: string;
  statuses: string[];
  query: string;
}

interface Props {
  value: BookingFiltersValue;
  onChange: (v: BookingFiltersValue) => void;
  onSearch: () => void;
  loading?: boolean;
}

const inputCls = 'h-11 px-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-[#F5A623] text-sm w-full';

export default function BookingFilters({ value, onChange, onSearch, loading }: Props) {
  const toggle = (s: string) => {
    const has = value.statuses.includes(s);
    onChange({ ...value, statuses: has ? value.statuses.filter((x) => x !== s) : [...value.statuses, s] });
  };

  return (
    <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <label>
          <span className="text-[11px] uppercase tracking-wider text-white/60 mb-1 block">Du</span>
          <input type="date" value={value.bookingDateFrom} onChange={(e) => onChange({ ...value, bookingDateFrom: e.target.value })} className={inputCls} />
        </label>
        <label>
          <span className="text-[11px] uppercase tracking-wider text-white/60 mb-1 block">Au</span>
          <input type="date" value={value.bookingDateTo} onChange={(e) => onChange({ ...value, bookingDateTo: e.target.value })} className={inputCls} />
        </label>
        <label>
          <span className="text-[11px] uppercase tracking-wider text-white/60 mb-1 block">PNR ou nom passager</span>
          <input value={value.query} onChange={(e) => onChange({ ...value, query: e.target.value })} placeholder="QZL3M2, BJEOUI..." className={inputCls} />
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((s) => {
          const active = value.statuses.includes(s.v);
          return (
            <button
              key={s.v}
              type="button"
              onClick={() => toggle(s.v)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs border transition',
                active ? 'bg-[#F5A623] text-[#0B0F2E] border-[#F5A623] font-semibold' : 'border-white/15 text-white/70 hover:bg-white/5',
              )}
            >
              {s.emoji} {s.label}
            </button>
          );
        })}
      </div>

      <Button onClick={onSearch} disabled={loading} className="w-full md:w-auto bg-[#F5A623] hover:bg-[#F5A623]/90 text-[#0B0F2E] font-semibold">
        <Search className="w-4 h-4 mr-2" />
        {loading ? 'Recherche...' : 'Rechercher'}
      </Button>
    </div>
  );
}
