// src/pages/admin/FlightAcdFees.tsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Pencil, Trash2, Eye, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { listAcdFees, deleteAcdFee, createAcdFee, type FlightAcdFee } from '@/service/admin/flightAcdFee.service';
import { listActiveFournisseurs, type Fournisseur } from '@/service/admin/fournisseur.service';
import { AIRLINES } from '@/data/airlines';

export default function FlightAcdFees() {
    const navigate = useNavigate();
    const [rows, setRows] = useState<FlightAcdFee[]>([]);
    const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    const [filterCompagnie, setFilterCompagnie] = useState('');
    const [filterFournisseur, setFilterFournisseur] = useState('Indifférent');

    // Create dialog
    const [dialogOpen, setDialogOpen] = useState(false);
    const [createAirline, setCreateAirline] = useState('ALL');
    const [createFournisseur, setCreateFournisseur] = useState('');
    const [saving, setSaving] = useState(false);

    const load = async () => {
        setLoading(true);
        setLoadError(null);
        try {
            const [feeRows, fournisseurRows] = await Promise.all([listAcdFees(), listActiveFournisseurs()]);
            setRows(feeRows);
            setFournisseurs(fournisseurRows);
        } catch (err: any) {
            setLoadError(err.message ?? 'Impossible de charger les frais ACD');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const fournisseurLabel = (code: string) => fournisseurs.find((f) => f.code === code)?.nom ?? code;
    const airlineLabel = (code: string | null) =>
        code === null ? 'Toute les compagnies (ALL)' : `${AIRLINES.find((a) => a.code === code)?.name ?? code} (${code})`;

    const filtered = useMemo(() => {
        return rows.filter((r) => {
            const matchesCompagnie = !filterCompagnie.trim()
                || r.airlineCode === null
                || airlineLabel(r.airlineCode).toLowerCase().includes(filterCompagnie.trim().toLowerCase());
            const matchesFournisseur = filterFournisseur === 'Indifférent' || r.fournisseurCode === filterFournisseur;
            return matchesCompagnie && matchesFournisseur;
        });
    }, [rows, filterCompagnie, filterFournisseur]);

    const handleDelete = async (id: string) => {
        if (!confirm('Supprimer ce frais ACD ?')) return;
        try {
            await deleteAcdFee(id);
            setRows((prev) => prev.filter((r) => r.id !== id));
        } catch (err: any) {
            alert(err.message ?? 'Échec de la suppression');
        }
    };

    const openCreateDialog = () => {
        if (fournisseurs.length === 0) {
            alert('Aucun fournisseur actif — activez-en un dans la page Fournisseurs avant de créer un frais ACD.');
            return;
        }
        setCreateAirline('ALL');
        setCreateFournisseur(fournisseurs[0].code); // just the dialog's initial value, not a silent final choice
        setDialogOpen(true);
    };

    const handleCreate = async () => {
        if (!createFournisseur) return;
        setSaving(true);
        try {
            const created = await createAcdFee({
                airlineCode: createAirline === 'ALL' ? null : createAirline,
                fournisseurCode: createFournisseur,
                monnaie: 'DZD',
                tarif: 'TTC',
                typeFrais: 'FIXED',
                blocks: [{ scope: 'DEFAULT', fraisInt: 0, montantMin: 0, montantMax: 1000000 }],
            });
            setRows((prev) => [...prev, created]);
            setDialogOpen(false);
            navigate(`/admin/flight-acd-fees/${created.id}`);
        } catch (err: any) {
            alert(err.message ?? 'Échec de la création');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-800">Frais ACD Zone A</h1>
                <Button
                    variant="outline"
                    className="border-[#1775FF] text-[#1775FF] hover:bg-[#DFECFF]/50 gap-2"
                    onClick={() => navigate('/admin/flight-acd-fees/countries')}
                >
                    <Eye className="w-4 h-4" /> Liste des pays ACD
                </Button>
            </div>

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

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800">Frais ACD Zone A</h3>
                    <Button size="icon" className="rounded-full bg-[#1775FF] hover:bg-[#1775FF]/90 text-white h-9 w-9" onClick={openCreateDialog}>
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
                                <th className="text-left font-semibold px-6 py-3">Monnaie</th>
                                <th className="text-left font-semibold px-6 py-3">Classes configurées</th>
                                <th className="text-left font-semibold px-6 py-3">Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {filtered.map((r) => (
                                <tr key={r.id} className="border-b border-slate-50 hover:bg-[#DFECFF]/30 transition-colors">
                                    <td className="px-6 py-3 font-medium text-slate-800">{airlineLabel(r.airlineCode)}</td>
                                    <td className="px-6 py-3 text-slate-600">{fournisseurLabel(r.fournisseurCode)}</td>
                                    <td className="px-6 py-3 text-slate-600">{r.monnaie}</td>
                                    <td className="px-6 py-3 text-slate-600">{r.blocks.map((b) => b.scope).join(', ') || '—'}</td>
                                    <td className="px-6 py-3">
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => navigate(`/admin/flight-acd-fees/${r.id}`)} className="w-7 h-7 rounded-md bg-[#DFECFF] text-[#1775FF] flex items-center justify-center hover:bg-[#1775FF] hover:text-white transition-colors">
                                                <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                            <button onClick={() => handleDelete(r.id)} className="w-7 h-7 rounded-md bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-400">Aucun frais trouvé.</td></tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create dialog — airline + fournisseur chosen explicitly, no silent default */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Ajouter Frais ACD Zone A</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label className="text-xs text-slate-500">Compagnie</Label>
                            <Select value={createAirline} onValueChange={setCreateAirline}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">Toute les compagnies</SelectItem>
                                    {AIRLINES.map((a) => (
                                        <SelectItem key={a.code} value={a.code}>{a.name} ({a.code})</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs text-slate-500">Fournisseur*</Label>
                            <Select value={createFournisseur} onValueChange={setCreateFournisseur}>
                                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                                <SelectContent>
                                    {fournisseurs.map((f) => (
                                        <SelectItem key={f.code} value={f.code}>{f.nom} ({f.code})</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-[11px] text-slate-400">Seuls les fournisseurs actifs apparaissent ici.</p>
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
                            disabled={!createFournisseur || saving}
                        >
                            {saving ? 'Création...' : 'Créer'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}