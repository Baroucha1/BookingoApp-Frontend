// src/pages/admin/FlightPromoCodeEdit.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

const REDUCTION_TYPES = [
    { code: 'PERCENT', label: '%' },
    { code: 'FIXED',   label: 'Montant fixe DZD' },
];

const DISTRIBUTEURS = ['Tous', 'Bookingo App #35978'];
const CLIENTS = ['Tous'];
const TYPE_VOL_OPTIONS = ['Indifférent', 'Domestique', 'International'];

interface EditForm {
    code: string; // read-only, shown in title only
    valeur: string;
    typeReduction: string;
    distributeur: string;
    description: string;
    client: string;
    validFrom: string;
    validTo: string;
    typeVol: string;
}

// TODO: replace with real GET /api/admin/flight-promo-codes/:id — this mock
// mirrors the reference screenshot's "bookingo" promo code exactly
const mockFetchPromoCode = (id: string): EditForm => ({
    code: 'bookingo',
    valeur: '1600.000',
    typeReduction: 'FIXED',
    distributeur: 'Bookingo App #35978',
    description: 'bookingo',
    client: 'Tous',
    validFrom: '2026-02-10',
    validTo: '2026-02-28',
    typeVol: 'Indifférent',
});

export default function FlightPromoCodeEdit() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [form, setForm] = useState<EditForm | null>(null);

    useEffect(() => {
        if (!id) return;
        // TODO: real fetch — for now, mock data regardless of id
        setForm(mockFetchPromoCode(id));
    }, [id]);

    if (!form) {
        return <div className="text-slate-400 text-sm">Chargement...</div>;
    }

    const handleSave = () => {
        // TODO: call PATCH /api/admin/flight-promo-codes/:id with `form`
        console.log('update promo code', id, form);
        navigate('/admin/flight-promo-codes');
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-800">Modifier le Code Promo {form.code}</h1>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">

                    <div className="space-y-1.5">
                        <Label className="text-sm text-slate-700">Valeur de la réduction*</Label>
                        <div className="flex gap-2">
                            <Input
                                value={form.valeur}
                                onChange={(e) => setForm(f => f && ({ ...f, valeur: e.target.value }))}
                                inputMode="decimal"
                                className="flex-1"
                            />
                            <Select value={form.typeReduction} onValueChange={(v) => setForm(f => f && ({ ...f, typeReduction: v }))}>
                                <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {REDUCTION_TYPES.map((t) => (
                                        <SelectItem key={t.code} value={t.code}>{t.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-sm text-slate-700">Distributeur</Label>
                        <Select value={form.distributeur} onValueChange={(v) => setForm(f => f && ({ ...f, distributeur: v }))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {DISTRIBUTEURS.map((d) => (
                                    <SelectItem key={d} value={d}>{d}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-sm text-slate-700">Description en bref</Label>
                        <Input
                            value={form.description}
                            onChange={(e) => setForm(f => f && ({ ...f, description: e.target.value }))}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-sm text-slate-700">Client</Label>
                        <Select value={form.client} onValueChange={(v) => setForm(f => f && ({ ...f, client: v }))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {CLIENTS.map((c) => (
                                    <SelectItem key={c} value={c}>{c}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-sm text-slate-700">Pour toute réservation faite Du*</Label>
                            <Input
                                type="date"
                                value={form.validFrom}
                                onChange={(e) => setForm(f => f && ({ ...f, validFrom: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-sm text-slate-700">Au*</Label>
                            <Input
                                type="date"
                                value={form.validTo}
                                onChange={(e) => setForm(f => f && ({ ...f, validTo: e.target.value }))}
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-sm text-slate-700">Type de vol</Label>
                        <Select value={form.typeVol} onValueChange={(v) => setForm(f => f && ({ ...f, typeVol: v }))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {TYPE_VOL_OPTIONS.map((t) => (
                                    <SelectItem key={t} value={t}>{t}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex justify-end mt-6">
                    <Button className="bg-emerald-500 hover:bg-emerald-600 text-white" onClick={handleSave}>
                        Enregistrer
                    </Button>
                </div>
            </div>
        </div>
    );
}