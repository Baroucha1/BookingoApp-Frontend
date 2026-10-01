import { Users } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/i18n/LanguageContext';

interface Props {
  qteADT: number;
  qteCHD: number;
  qteINF: number;
  classe: 'Y' | 'C' | 'F' | 'W';
  onChange: (next: { qteADT: number; qteCHD: number; qteINF: number; classe: 'Y' | 'C' | 'F' | 'W' }) => void;
  trigger?: React.ReactNode;
}

function Stepper({ label, value, min = 0, onChange }: { label: string; value: number; min?: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-foreground">{label}</span>
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))} className="w-8 h-8 rounded-full border border-input flex items-center justify-center hover:bg-accent">−</button>
        <span className="w-6 text-center">{value}</span>
        <button type="button" onClick={() => onChange(value + 1)} className="w-8 h-8 rounded-full border border-input flex items-center justify-center hover:bg-accent">+</button>
      </div>
    </div>
  );
}

export default function PassengerClassSelector({ qteADT, qteCHD, qteINF, classe, onChange, trigger }: Props) {
  const { t } = useLanguage();
  const totalPax = qteADT + qteCHD + qteINF;

  const classesConfig: { v: 'Y' | 'C' | 'F' | 'W'; label: string }[] = [
    { v: 'Y', label: t('economy') },
    { v: 'W', label: t('premium') },
    { v: 'C', label: t('businessClass') || t('business') },
    { v: 'F', label: t('first') },
  ];

  const classeLabel = classesConfig.find((c) => c.v === classe)?.label || classe;

  return (
    <Popover>
      <PopoverTrigger asChild>
        {trigger ? (
          trigger
        ) : (
          <button
              type="button"
              className="w-full h-12 md:h-14 px-4 rounded bg-white border border-[#0454E8] text-[#1A202C] text-left rtl:text-right flex items-center gap-2 hover:bg-[#F8F9FA] transition"
          >
            <Users className="w-4 h-4 text-[#F5A623]" />
            <span className="text-sm text-[#0454E8]">{totalPax} {totalPax > 1 ? t('passengersPlural') : t('passengers')} · {classeLabel}</span>
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4">
        <Stepper label={t('adultsLabel')} value={qteADT} min={1} onChange={(n) => onChange({ qteADT: n, qteCHD, qteINF, classe })} />
        <Stepper label={t('childrenLabel')} value={qteCHD} onChange={(n) => onChange({ qteADT, qteCHD: n, qteINF, classe })} />
        <Stepper label={t('infantsLabel')} value={qteINF} onChange={(n) => onChange({ qteADT, qteCHD, qteINF: n, classe })} />
        <div className="mt-3 pt-3 border-t">
          <div className="text-xs text-muted-foreground mb-2">{t('cabinClassLabel')}</div>
          <div className="grid grid-cols-2 gap-2">
            {classesConfig.map((c) => (
              <Button
                key={c.v}
                type="button"
                variant={classe === c.v ? 'default' : 'outline'}
                size="sm"
                onClick={() => onChange({ qteADT, qteCHD, qteINF, classe: c.v })}
              >
                {c.label}
              </Button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
