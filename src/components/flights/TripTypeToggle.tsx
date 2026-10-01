import { cn } from '@/lib/utils';

interface Props {
  value: 1 | 2 | 3;
  onChange: (v: 1 | 2 | 3) => void;
}

const options: { v: 1 | 2 | 3; label: string }[] = [
  { v: 1, label: 'Aller simple' },
  { v: 2, label: 'Aller-retour' },
  { v: 3, label: 'Multi-destinations' },
];

export default function TripTypeToggle({ value, onChange }: Props) {
  return (
    <div className="inline-flex p-1 rounded-full bg-[#F1F5F9] border border-[#E2E8F0]">
      {options.map((o) => (
        <button
          key={o.v}
          type="button"
          onClick={() => onChange(o.v)}
          className={cn(
            'px-4 py-2 text-sm rounded-full transition-all',
            value === o.v
              ? 'bg-[#F5A623] text-white font-semibold shadow'
              : 'text-[#4A5568] hover:text-[#1A202C]',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
