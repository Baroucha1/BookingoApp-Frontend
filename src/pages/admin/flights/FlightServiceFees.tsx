// src/pages/admin/FlightServiceFees.tsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
    listServiceFees, deleteServiceFee, createServiceFee,
    type FlightServiceFee, type FeeTarifBasis, type FeeType,
} from '@/service/admin/flightServiceFee.service';
import { listFournisseurs, type Fournisseur } from '@/service/admin/fournisseur.service';
import { AIRLINES } from '@/data/airlines';

const TARIF_OPTIONS: { code: FeeTarifBasis; label: string }[] = [
    { code: 'TTC', label: 'TTC' },
    { code: 'HT', label: 'HT' },
];

const TYPE_FRAIS_OPTIONS: { code: FeeType; label: string }[] = [
    { code: 'FIXED', label: 'Montant fixe' },
    { code: 'PERCENT', label: 'Pourcentage' },
];

const EMPTY_FORM = {
    airlineCode: 'ALL' as string, // 'ALL' maps to null on submit
    fournisseurCode: '',
    tarif: 'TTC' as FeeTarifBasis,
    typeFrais: 'FIXED' as FeeType,
};

export default function FlightServiceFees() {
    const navigate = useNavigate();
    const [fees, setFees] = useState<FlightServiceFee[]>([]);
    const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    const [filterCompagnie, setFilterCompagnie] = useState('');
    const [filterFournisseur, setFilterFournisseur] = useState('Indifférent');

    const [dialogOpen, setDialogOpen] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);

    const load = async () => {
        setLoading(true);
        setLoadError(null);
        try {
            const [feeRows, fournisseurRows] = await Promise.all([listServiceFees(), listFournisseurs()]);
            setFees(feeRows);
            setFournisseurs(fournisseurRows);
        } catch (err: any) {
            setLoadError(err.message ?? 'Impossible de charger les frais');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const fournisseurLabel = (code: string) => fournisseurs.find((f) => f.code === code)?.nom ?? code;
    const airlineLabel = (code: string | null) =>
        code === null ? 'Toutes' : (AIRLINES.find((a) => a.code === code)?.name ?? code) + ` (${code})`;

    const filtered = useMemo(() => {
        return fees.filter((f) => {
            const matchesCompagnie = !filterCompagnie.trim()
                || f.airlineCode === null
                || airlineLabel(f.airlineCode).toLowerCase().includes(filterCompagnie.trim().toLowerCase());
            const matchesFournisseur = filterFournisseur === 'Indifférent' || f.fournisseurCode === filterFournisseur;
            return matchesCompagnie && matchesFournisseur;
        });
    }, [fees, filterCompagnie, filterFournisseur]);

    const openCreate = () => {
        setForm({ ...EMPTY_FORM, fournisseurCode: fournisseurs[0]?.code ?? '' });
        setDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Supprimer ce frais ?')) return;
        try {
            await deleteServiceFee(id);
            setFees((prev) => prev.filter((f) => f.id !== id));
        } catch (err: any) {
            alert(err.message ?? 'Échec de la suppression');
        }
    };

    const handleCreate = async () => {
        if (!form.fournisseurCode) return;
        setSaving(true);
        try {
            const created = await createServiceFee({
                airlineCode: form.airlineCode === 'ALL' ? null : form.airlineCode,
                fournisseurCode: form.fournisseurCode,
                monnaie: 'DZD',
                tarif: form.tarif,
                typeFrais: form.typeFrais,
                blocks: [{ scope: 'DEFAULT', fraisInt: 0, fraisDom: 0, montantMin: 0, montantMax: 1000000 }],
            });
            setFees((prev) => [...prev, created]);
            setDialogOpen(false);
            navigate(`/admin/flight-service-fees/${created.id}`);
        } catch (err: any) {
            alert(err.message ?? 'Échec de la création');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-800">Frais de service</h1>

            {/* Filters */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
                <h3 className="text-sm font-bold text-slate-700">Filtrer votre recherche</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label className="text-xs text-slate-500">Compagnie</Label>
                        <Input value={filterCompagnie} onChange={(e) => setFilterCompagnie(e.target.value)} placeholder="Rechercher une compagnie..." />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs text-slate-500">Fournisseur</Label>
                        <Select value={filterFournisseur} onValueChange={setFilterFournisseur}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Indifférent">Indifférent</SelectItem>
                                {fournisseurs.map((f) => (
                                    <SelectItem key={f.code} value={f.code}>{f.nom}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="flex justify-end">
                    <Button className="bg-[#1775FF] hover:bg-[#1775FF]/90 text-white gap-2">
                        <Search className="w-4 h-4" /> Rechercher
                    </Button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800">Frais</h3>
                    <Button size="icon" className="rounded-full bg-[#1775FF] hover:bg-[#1775FF]/90 text-white h-9 w-9" onClick={openCreate}>
                        <Plus className="w-5 h-5" />
                    </Button>
                </div>

                {loading && (
                    <div className="px-6 py-10 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Chargement...
                    </div>
                )}
                {!loading && loadError && <div className="px-6 py-6 text-sm text-red-500">{loadError}</div>}

                {!loading && !loadError && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                            <tr className="border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wide">
                                <th className="text-left font-semibold px-6 py-3">Compagnie</th>
                                <th className="text-left font-semibold px-6 py-3">Fournisseur</th>
                                <th className="text-left font-semibold px-6 py-3">Tarif</th>
                                <th className="text-left font-semibold px-6 py-3">Type</th>
                                <th className="text-left font-semibold px-6 py-3">Classes configurées</th>
                                <th className="text-left font-semibold px-6 py-3">Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {filtered.map((fee) => (
                                <tr key={fee.id} className="border-b border-slate-50 hover:bg-[#DFECFF]/30 transition-colors">
                                    <td className="px-6 py-3 font-medium text-slate-800">{airlineLabel(fee.airlineCode)}</td>
                                    <td className="px-6 py-3 text-slate-600">{fournisseurLabel(fee.fournisseurCode)}</td>
                                    <td className="px-6 py-3 text-slate-600">{fee.tarif}</td>
                                    <td className="px-6 py-3 text-slate-600">{fee.typeFrais === 'FIXED' ? 'Montant fixe' : 'Pourcentage'}</td>
                                    <td className="px-6 py-3 text-slate-600">{fee.blocks.map((b) => b.scope).join(', ') || '—'}</td>
                                    <td className="px-6 py-3">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => navigate(`/admin/flight-service-fees/${fee.id}`)}
                                                className="w-7 h-7 rounded-md bg-[#DFECFF] text-[#1775FF] flex items-center justify-center hover:bg-[#1775FF] hover:text-white transition-colors"
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(fee.id)}
                                                className="w-7 h-7 rounded-md bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr><td colSpan={6} className="px-6 py-10 text-center text-slate-400">Aucun frais trouvé.</td></tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create dialog — picks airline (from real partners) + provider (from real Fournisseur table) */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Ajouter Frais de service vol</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label className="text-xs text-slate-500">Compagnie</Label>
                            <Select value={form.airlineCode} onValueChange={(v) => setForm((f) => ({ ...f, airlineCode: v }))}>
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
                            <Label className="text-xs text-slate-500">Fournisseur*</Label>
                            <Select
                                value={form.fournisseurCode}
                                onValueChange={(v) => setForm((f) => ({ ...f, fournisseurCode: v }))}
                                disabled={fournisseurs.length === 0}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={fournisseurs.length === 0 ? 'Aucun fournisseur configuré' : 'Sélectionner'} />
                                </SelectTrigger>
                                <SelectContent>
                                    {fournisseurs.map((f) => (
                                        <SelectItem key={f.code} value={f.code}>{f.nom} ({f.code})</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs text-slate-500">Tarifs en</Label>
                                <Select value={form.tarif} onValueChange={(v) => setForm((f) => ({ ...f, tarif: v as FeeTarifBasis }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {TARIF_OPTIONS.map((t) => (
                                            <SelectItem key={t.code} value={t.code}>{t.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs text-slate-500">Type du frais</Label>
                                <Select value={form.typeFrais} onValueChange={(v) => setForm((f) => ({ ...f, typeFrais: v as FeeType }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {TYPE_FRAIS_OPTIONS.map((t) => (
                                            <SelectItem key={t.code} value={t.code}>{t.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <p className="text-[11px] text-slate-400">
                            Les montants par défaut/par classe se configurent sur la page suivante après création.
                        </p>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
                        <Button
                            className="bg-[#1775FF] hover:bg-[#1775FF]/90 text-white"
                            onClick={handleCreate}
                            disabled={!form.fournisseurCode || saving}
                        >
                            {saving ? 'Création...' : 'Créer'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}