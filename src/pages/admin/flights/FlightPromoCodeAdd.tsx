// src/pages/admin/FlightPromoCodeAdd.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

const REDUCTION_TYPES = [
    { code: 'PERCENT', label: '%' },
    { code: 'FIXED',   label: 'Montant fixe DZD' },
];

const DISTRIBUTEURS = ['Tous', 'Bookingo App #35978'];
const CLIENTS = ['Tous'];
const TYPE_VOL_OPTIONS = ['Indifférent', 'Domestique', 'International'];

const EMPTY_FORM = {
    code: '',
    automatique: false,
    valeur: '',
    typeReduction: 'PERCENT',
    distributeur: 'Tous',
    description: '',
    client: 'Tous',
    validFrom: '',
    validTo: '',
    typeVol: 'Indifférent',
};

export default function FlightPromoCodeAdd() {
    const navigate = useNavigate();
    const [form, setForm] = useState(EMPTY_FORM);

    const handleSubmit = () => {
        if (!form.automatique && !form.code.trim()) return;
        if (!form.valeur.trim() || !form.validFrom || !form.validTo) return;

        // TODO: call POST /api/admin/flight-promo-codes with `form`
        console.log('create promo code', form);
        navigate('/admin/flight-promo-codes');
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-800">Ajouter un Code Promo</h1>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">

                    <div className="space-y-1.5">
                        <Label className="text-sm text-slate-700">Le code*</Label>
                        <Input
                            value={form.code}
                            onChange={(e) => setForm(f => ({ ...f, code: e.target.value }))}
                            placeholder="XXX123"
                            disabled={form.automatique}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-sm text-slate-700">Automatique</Label>
                        <div className="flex items-center h-10">
                            <Switch
                                checked={form.automatique}
                                onCheckedChange={(v) => setForm(f => ({ ...f, automatique: v, code: v ? '' : f.code }))}
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-sm text-slate-700">Valeur de la réduction*</Label>
                        <div className="flex gap-2">
                            <Input
                                value={form.valeur}
                                onChange={(e) => setForm(f => ({ ...f, valeur: e.target.value }))}
                                inputMode="decimal"
                                className="flex-1"
                            />
                            <Select value={form.typeReduction} onValueChange={(v) => setForm(f => ({ ...f, typeReduction: v }))}>
                                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
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
                        <Select value={form.distributeur} onValueChange={(v) => setForm(f => ({ ...f, distributeur: v }))}>
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
                            onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-sm text-slate-700">Client</Label>
                        <Select value={form.client} onValueChange={(v) => setForm(f => ({ ...f, client: v }))}>
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
                            <Label className="text-sm text-slate-700">Valable du*</Label>
                            <Input
                                type="date"
                                value={form.validFrom}
                                onChange={(e) => setForm(f => ({ ...f, validFrom: e.target.value }))}
                                placeholder="jj/mm/aaaa"
                            />
                            <p className="text-[11px] text-slate-400">Par rapport à la date de réservation</p>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-sm text-slate-700">Expire le*</Label>
                            <Input
                                type="date"
                                value={form.validTo}
                                onChange={(e) => setForm(f => ({ ...f, validTo: e.target.value }))}
                                placeholder="jj/mm/aaaa"
                            />
                            <p className="text-[11px] text-slate-400">Par rapport à la date de réservation</p>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-sm text-slate-700">Type de vol</Label>
                        <Select value={form.typeVol} onValueChange={(v) => setForm(f => ({ ...f, typeVol: v }))}>
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
                    <Button className="bg-emerald-500 hover:bg-emerald-600 text-white" onClick={handleSubmit}>
                        Ajouter
                    </Button>
                </div>
            </div>
        </div>
    );
}