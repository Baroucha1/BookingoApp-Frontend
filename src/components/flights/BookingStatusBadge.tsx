import { cn } from '@/lib/utils';

const MAP: Record<string, { label: string; cls: string; dot: string }> = {
  BOOKED:    { label: 'Réservé',    cls: 'bg-blue-100 text-blue-700 border-blue-200',     dot: 'bg-blue-500' },
  PAID:      { label: 'Payé',       cls: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  TICKETED:  { label: 'Émis',       cls: 'bg-purple-100 text-purple-700 border-purple-200',  dot: 'bg-purple-500' },
  CANCELLED: { label: 'Annulé',     cls: 'bg-red-100 text-red-700 border-red-200',        dot: 'bg-red-500' },
  FAILED:    { label: 'Échoué',     cls: 'bg-slate-100 text-slate-500 border-slate-200',  dot: 'bg-slate-400' },
};

export default function BookingStatusBadge({ status }: { status?: string }) {
  const s = MAP[(status ?? '').toUpperCase()] ?? { label: status ?? '—', cls: 'bg-slate-100 text-slate-500 border-slate-200', dot: 'bg-slate-300' };
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium', s.cls)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', s.dot)} />
      {s.label}
    </span>
  );
}

export const STATUS_OPTIONS: { v: string; label: string; emoji: string }[] = [
  { v: 'E', label: 'En attente', emoji: '🟡' },
  { v: 'B', label: 'Réservé', emoji: '🔵' },
  { v: 'T', label: 'Émis', emoji: '🟢' },
  { v: 'A', label: 'Annulé', emoji: '🔴' },
  { v: 'R', label: 'Remboursé', emoji: '🟣' },
];
