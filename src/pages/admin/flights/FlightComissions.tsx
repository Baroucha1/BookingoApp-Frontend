// src/pages/admin/FlightCommissions.tsx
import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';

// ── Fournisseurs — mirrors providerRegistry.js, same pattern as other pages ─
const FOURNISSEURS = [
    { code: 'AMADEUS', label: 'AQC #163', enabled: true },
    { code: 'TK_NDC',  label: 'Turkish Airlines NDC', enabled: false },
];
const fournisseurLabel = (code: string) => FOURNISSEURS.find(f => f.code === code)?.label ?? code;

// ── Airlines — same placeholder list as the other flight pages ─────────
const AIRLINES: { code: string; name: string }[] = [
    { code: 'AH', name: 'Air Algerie' },
    { code: '5O', name: 'ASL Airlines France' },
    { code: 'AZ', name: 'Alitalia' },
    { code: 'TK', name: 'Turkish Airlines' },
    { code: 'AF', name: 'Air France' },
    { code: 'IB', name: 'Iberia' },
    { code: 'AC', name: 'Air Canada' },
    { code: 'V7', name: 'Volotea' },
    { code: 'LH', name: 'Lufthansa' },
    { code: 'TB', name: 'TUI Airlines Belgium' },
    { code: 'PC', name: 'Pegasus' },
    { code: 'VF', name: 'AJet' },
    { code: 'SF', name: 'Tassili Airlines' },
    { code: 'SV', name: 'Saudi Arabian' },
    { code: 'VY', name: 'Vueling Airlines' },
    { code: 'BJ', name: 'Nouvelair' },
    { code: 'QR', name: 'Qatar Airways' },
    { code: 'TU', name: 'Tunis Air' },
    { code: 'RJ', name: 'Royal Jordanian' },
];

const TARIF_OPTIONS = [
    { code: 'HT',  label: 'HT' },
    { code: 'TTC', label: 'TTC' },
];

interface Commission {
    id: number;
    fournisseurCode: string;
    airlineCode: string | 'ALL';
    tarif: string;
    globale: string;   // % fixed by the airline/fournisseur
    parDefaut: string; // % reserved for distributors
}

const EMPTY_FORM = {
    fournisseurCode: 'AMADEUS',
    airlineCode: 'ALL',
    tarif: 'HT',
    globale: '',
    parDefaut: '0',
};

export default function FlightCommissions() {
    // Empty by default — matches the reference's "Pas de résultat trouvé!" state
    const [commissions, setCommissions] = useState<Commission[]>([]);
    const [filterFournisseur, setFilterFournisseur] = useState('AMADEUS');

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [form, setForm] = useState(EMPTY_FORM);

    const filtered = useMemo(
        () => commissions.filter((c) => c.fournisseurCode === filterFournisseur),
        [commissions, filterFournisseur]
    );

    const openCreate = () => {
        setEditingId(null);
        setForm({ ...EMPTY_FORM, fournisseurCode: filterFournisseur });
        setDialogOpen(true);
    };

    const openEdit = (c: Commission) => {
        setEditingId(c.id);
        setForm({
            fournisseurCode: c.fournisseurCode,
            airlineCode: c.airlineCode,
            tarif: c.tarif,
            globale: c.globale,
            parDefaut: c.parDefaut,
        });
        setDialogOpen(true);
    };

    const handleDelete = (id: number) => {
        // TODO: call DELETE /api/admin/flight-commissions/:id
        setCommissions((prev) => prev.filter((c) => c.id !== id));
    };

    const handleSave = () => {
        if (!form.fournisseurCode || !form.globale.trim()) return;

        if (editingId != null) {
            // TODO: call PATCH /api/admin/flight-commissions/:id
            setCommissions((prev) => prev.map((c) => (c.id === editingId ? { ...c, ...form } : c)));
        } else {
            // TODO: call POST /api/admin/flight-commissions
            const nextId = Math.max(0, ...commissions.map(c => c.id)) + 1;
            setCommissions((prev) => [...prev, { id: nextId, ...form }]);
        }
        setDialogOpen(false);
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Commissions</h1>
                        <p className="text-sm text-slate-400 mt-1">
                            Gestion des commissions des distributeurs par compagnie aérienne
                        </p>
                    </div>
                    <Button size="icon" className="rounded-full bg-[#1775FF] hover:bg-[#1775FF]/90 text-white h-10 w-10 shrink-0" onClick={openCreate}>
                        <Plus className="w-5 h-5" />
                    </Button>
                </div>

                <div className="max-w-xs">
                    <Select value={filterFournisseur} onValueChange={setFilterFournisseur}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {FOURNISSEURS.map((f) => (
                                <SelectItem key={f.code} value={f.code} disabled={!f.enabled}>
                                    {f.label}{!f.enabled ? ' (bientôt)' : ''}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {filtered.length === 0 ? (
                    <div className="bg-red-50 text-red-500 rounded-xl px-5 py-4 text-sm font-medium">
                        Pas de résultat trouvé !
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-100">
                        <table className="w-full text-sm">
                            <thead>
                            <tr className="border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wide">
                                <th className="text-left font-semibold px-5 py-3">#</th>
                                <th className="text-left font-semibold px-5 py-3">Compagnie</th>
                                <th className="text-left font-semibold px-5 py-3">Tarif</th>
                                <th className="text-left font-semibold px-5 py-3">Commission globale</th>
                                <th className="text-left font-semibold px-5 py-3">Commission par défaut</th>
                                <th className="text-left font-semibold px-5 py-3">Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {filtered.map((c) => {
                                const airline = AIRLINES.find(a => a.code === c.airlineCode);
                                return (
                                    <tr key={c.id} className="border-b border-slate-50 hover:bg-[#DFECFF]/30 transition-colors">
                                        <td className="px-5 py-3 text-slate-500">{c.id}</td>
                                        <td className="px-5 py-3 font-medium text-slate-800">
                                            {c.airlineCode === 'ALL' ? 'Toutes' : airline ? `${airline.name} (${airline.code})` : c.airlineCode}
                                        </td>
                                        <td className="px-5 py-3 text-slate-600">{c.tarif}</td>
                                        <td className="px-5 py-3 text-slate-600">{c.globale}%</td>
                                        <td className="px-5 py-3 text-slate-600">{c.parDefaut}%</td>
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => openEdit(c)}
                                                    className="w-7 h-7 rounded-md bg-[#DFECFF] text-[#1775FF] flex items-center justify-center hover:bg-[#1775FF] hover:text-white transition-colors"
                                                >
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(c.id)}
                                                    className="w-7 h-7 rounded-md bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create/edit dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editingId != null ? 'Modifier Commission' : 'Ajouter Commission'}</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-5 py-2">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs text-slate-500">Fournisseur</Label>
                                <Select value={form.fournisseurCode} onValueChange={(v) => setForm(f => ({ ...f, fournisseurCode: v }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {FOURNISSEURS.map((f) => (
                                            <SelectItem key={f.code} value={f.code} disabled={!f.enabled}>
                                                {f.label}{!f.enabled ? ' (bientôt)' : ''}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs text-slate-500">Compagnie aérienne</Label>
                                <Select value={form.airlineCode} onValueChange={(v) => setForm(f => ({ ...f, airlineCode: v }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">Toutes</SelectItem>
                                        {AIRLINES.map((a) => (
                                            <SelectItem key={a.code} value={a.code}>{a.name} ({a.code})</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs text-slate-500">Appliquée sur Tarif</Label>
                                <Select value={form.tarif} onValueChange={(v) => setForm(f => ({ ...f, tarif: v }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {TARIF_OPTIONS.map((t) => (
                                            <SelectItem key={t.code} value={t.code}>{t.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs text-slate-500">
                                    Commission <span className="italic">globale</span> fixée par la compagnie
                                </Label>
                                <div className="relative">
                                    <Input
                                        value={form.globale}
                                        onChange={(e) => setForm(f => ({ ...f, globale: e.target.value }))}
                                        inputMode="decimal"
                                        placeholder="5"
                                        className="pr-8"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs text-slate-500">
                                    Commission <span className="italic underline">par défaut</span> réservée aux distributeurs
                                </Label>
                                <div className="relative">
                                    <Input
                                        value={form.parDefaut}
                                        onChange={(e) => setForm(f => ({ ...f, parDefaut: e.target.value }))}
                                        inputMode="decimal"
                                        placeholder="0"
                                        className="pr-8"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
                        <Button
                            className="bg-[#1775FF] hover:bg-[#1775FF]/90 text-white"
                            onClick={handleSave}
                            disabled={!form.fournisseurCode || !form.globale.trim()}
                        >
                            {editingId != null ? 'Enregistrer' : 'Ajouter'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}