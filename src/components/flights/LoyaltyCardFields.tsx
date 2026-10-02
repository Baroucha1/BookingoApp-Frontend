import { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import {AIRLINE_NAMES, getAirlineName} from "@/service/flights/airlines.ts";


interface LoyaltyCardFieldsProps {
    airline: string;
    number: string;
    defaultAirline: string;
    errors: Record<string, string>;
    onChange: (next: { fidelityAirline: string; fidelityNumber: string }) => void;
}

export default function LoyaltyCardFields({ airline, number, defaultAirline, errors, onChange }: LoyaltyCardFieldsProps) {
    const [open, setOpen] = useState(() => !!number);
    const isOpen = open || !!errors.fidelityAirline || !!errors.fidelityNumber;

    // All known airlines, sorted by name. The flight's carrier is added if it's not in the list.
    const airlineOptions = useMemo(() => {
        const codes = new Set(Object.keys(AIRLINE_NAMES));
        if (defaultAirline) codes.add(defaultAirline);
        if (airline) codes.add(airline);
        return [...codes]
            .map((code) => ({ code, name: getAirlineName(code).trim() }))
            .sort((a, b) => a.name.localeCompare(b.name, 'fr'));
    }, [defaultAirline, airline]);

    const toggle = () => {
        if (isOpen) {
            // Closing removes the card
            onChange({ fidelityAirline: '', fidelityNumber: '' });
            setOpen(false);
        } else {
            // Opening pre-selects the flight's carrier
            onChange({ fidelityAirline: airline || defaultAirline, fidelityNumber: number });
            setOpen(true);
        }
    };

    const fieldClass = (hasError: boolean) =>
        `w-full min-w-0 rounded-xl border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0865FE]/20 ${
            hasError ? 'border-red-400 focus:border-red-400' : 'border-slate-200 focus:border-[#0865FE]'
        }`;

    return (
        <div className="rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3">
            <button
                type="button"
                onClick={toggle}
                className="flex w-full items-center justify-between text-sm font-medium text-[#0B0F2E] hover:text-[#0865FE]"
            >
                <span>
                    Carte de fidélité <span className="font-normal text-slate-400">(optionnel)</span>
                </span>
                <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div>
                        <select
                            value={airline}
                            onChange={(e) => onChange({ fidelityAirline: e.target.value, fidelityNumber: number })}
                            className={fieldClass(!!errors.fidelityAirline)}
                        >
                            <option value="">Compagnie du programme</option>
                            {airlineOptions.map(({ code, name }) => (
                                <option key={code} value={code}>
                                    {name} ({code}){code === defaultAirline ? ' · votre vol' : ''}
                                </option>
                            ))}
                        </select>
                        {errors.fidelityAirline && <p className="mt-1 text-xs text-red-500">{errors.fidelityAirline}</p>}
                    </div>
                    <div>
                        <input
                            type="text"
                            placeholder="Numéro de carte"
                            value={number}
                            onChange={(e) => onChange({ fidelityAirline: airline, fidelityNumber: e.target.value })}
                            className={fieldClass(!!errors.fidelityNumber)}
                        />
                        {errors.fidelityNumber && <p className="mt-1 text-xs text-red-500">{errors.fidelityNumber}</p>}
                    </div>
                    <p className="text-[11px] text-slate-400 sm:col-span-2">
                        Choisissez la compagnie qui a émis votre carte — elle peut différer de la compagnie du vol si elles sont partenaires.
                    </p>
                </div>
            )}
        </div>
    );
}