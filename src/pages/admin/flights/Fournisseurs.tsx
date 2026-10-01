// src/pages/admin/Fournisseurs.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ChevronDown, ChevronRight, Pencil, ShieldCheck, Loader2, Plus, Percent, CheckCircle2, XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
    listFournisseurs, listAvailableCodes, createFournisseur, updateFournisseur,
    toggleFournisseur, testFournisseur,
    type Fournisseur, type FournisseurMode, type FournisseurTypeCode,
} from '@/service/admin/fournisseur.service';

const EMPTY_FORM = { code: '', nom: '', mode: 'TEST' as FournisseurMode, monnaie: 'DZD', type: 'FLIGHT' as FournisseurTypeCode };

const TYPE_LABELS: Record<FournisseurTypeCode, string> = {
    FLIGHT: 'Vols',
    HOTEL: 'Hôtels',
};

export default function Fournisseurs() {
    const navigate = useNavigate();

    const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    const [resultsOpen, setResultsOpen] = useState(true);

    const [togglingId, setTogglingId] = useState<string | null>(null);
    const [testingId, setTestingId] = useState<string | null>(null);

    // Create dialog
    const [createOpen, setCreateOpen] = useState(false);
    const [availableCodes, setAvailableCodes] = useState<string[]>([]);
    const [createForm, setCreateForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [codesLoading, setCodesLoading] = useState(false);

    // Edit dialog — separate state, no route/navigation involved
    const [editOpen, setEditOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState(EMPTY_FORM);
    const [editSaving, setEditSaving] = useState(false);

    const loadFournisseurs = async () => {
        setLoading(true);
        setLoadError(null);
        try {
            const data = await listFournisseurs();
            setFournisseurs(data);
        } catch (err: any) {
            setLoadError(err.message ?? 'Impossible de charger les fournisseurs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadFournisseurs();
    }, []);

    const handleToggle = async (id: string) => {
        setTogglingId(id);
        try {
            const updated = await toggleFournisseur(id);
            setFournisseurs((prev) => prev.map((f) => (f.id === id ? updated : f)));
        } catch (err: any) {
            alert(err.message ?? "Échec de l'activation/désactivation");
        } finally {
            setTogglingId(null);
        }
    };

    const handleTest = async (id: string) => {
        setTestingId(id);
        try {
            const { fournisseur } = await testFournisseur(id);
            setFournisseurs((prev) => prev.map((f) => (f.id === id ? fournisseur : f)));
        } catch (err: any) {
            alert(err.message ?? 'Échec du test de connexion');
        } finally {
            setTestingId(null);
        }
    };

    // Fetches available codes for a given type and resets the code field
    // to the first one — called on dialog open and whenever Type changes.
    const loadAvailableCodesForType = async (type: FournisseurTypeCode) => {
        setCodesLoading(true);
        try {
            const codes = await listAvailableCodes(type);
            setAvailableCodes(codes);
            setCreateForm((f) => ({ ...f, type, code: codes[0] ?? '' }));
        } catch (err: any) {
            alert(err.message ?? 'Impossible de charger les codes disponibles');
        } finally {
            setCodesLoading(false);
        }
    };

    const openCreateDialog = () => {
        setCreateForm(EMPTY_FORM);
        setCreateOpen(true);
        loadAvailableCodesForType('FLIGHT');
    };

    const handleCreate = async () => {
        if (!createForm.code || !createForm.nom.trim()) return;
        setSaving(true);
        try {
            const created = await createFournisseur({
                code: createForm.code,
                nom: createForm.nom.trim(),
                mode: createForm.mode,
                monnaie: createForm.monnaie,
                type: createForm.type,
            });
            setFournisseurs((prev) => [...prev, created]);
            setCreateOpen(false);
        } catch (err: any) {
            alert(err.message ?? 'Échec de la création');
        } finally {
            setSaving(false);
        }
    };

    const openEditDialog = (f: Fournisseur) => {
        setEditingId(f.id);
        setEditForm({
            code: f.code,
            nom: f.nom,
            mode: f.mode,
            monnaie: f.monnaie,
            type: f.type.code,
        });
        setEditOpen(true);
    };

    const handleEditSave = async () => {
        if (!editingId || !editForm.nom.trim()) return;
        setEditSaving(true);
        try {
            const updated = await updateFournisseur(editingId, {
                nom: editForm.nom.trim(),
                mode: editForm.mode,
                monnaie: editForm.monnaie,
            });
            setFournisseurs((prev) => prev.map((f) => (f.id === editingId ? updated : f)));
            setEditOpen(false);
        } catch (err: any) {
            alert(err.message ?? 'Échec de la mise à jour');
        } finally {
            setEditSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-800">Fournisseurs</h1>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        className="border-[#1775FF] text-[#1775FF] hover:bg-[#DFECFF]/50 gap-2"
                        onClick={() => navigate('/admin/fournisseurs/marges')}
                    >
                        <Percent className="w-4 h-4" /> Gestion des marges
                    </Button>
                    <Button className="bg-[#1775FF] hover:bg-[#1775FF]/90 text-white gap-2" onClick={openCreateDialog}>
                        <Plus className="w-4 h-4" /> Ajouter
                    </Button>
                </div>
            </div>

            {/* Résultat de la recherche */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <button
                    onClick={() => setResultsOpen((o) => !o)}
                    className="w-full flex items-center gap-2 px-6 py-4 text-[#1775FF] font-medium hover:bg-[#DFECFF]/30 transition-colors"
                >
                    {resultsOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    Résultat de la recherche
                </button>

                {resultsOpen && (
                    <>
                        {loading && (
                            <div className="px-6 py-10 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" /> Chargement...
                            </div>
                        )}

                        {!loading && loadError && (
                            <div className="px-6 py-6 text-sm text-red-500">{loadError}</div>
                        )}

                        {!loading && !loadError && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                    <tr className="border-b border-slate-100 text-slate-700 text-sm">
                                        <th className="text-left font-semibold px-5 py-3">Code</th>
                                        <th className="text-left font-semibold px-5 py-3">Type</th>
                                        <th className="text-left font-semibold px-5 py-3">Nom</th>
                                        <th className="text-left font-semibold px-5 py-3">Marge</th>
                                        <th className="text-left font-semibold px-5 py-3">Mode</th>
                                        <th className="text-left font-semibold px-5 py-3">Monnaie</th>
                                        <th className="text-left font-semibold px-5 py-3">Activé</th>
                                        <th className="text-left font-semibold px-5 py-3">Dernier test</th>
                                        <th className="text-left font-semibold px-5 py-3">Action</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {fournisseurs.map((f) => (
                                        <tr key={f.id} className="border-b border-slate-50 hover:bg-[#DFECFF]/30 transition-colors">
                                            <td className="px-5 py-3 font-mono text-xs text-slate-500">{f.code}</td>
                                            <td className="px-5 py-3">
                                                <span className={cn(
                                                    'px-2 py-0.5 rounded-md text-xs font-semibold',
                                                    f.type.code === 'HOTEL' ? 'bg-sky-50 text-sky-600' : 'bg-violet-50 text-violet-600'
                                                )}>
                                                    {f.type.label}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 font-semibold text-slate-800">{f.nom}</td>
                                            <td className="px-5 py-3 text-slate-600">{Number(f.marge).toFixed(2)}%</td>
                                            <td className="px-5 py-3">
                                                <span className={cn(
                                                    'px-2 py-0.5 rounded-md text-xs font-semibold',
                                                    f.mode === 'LIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                                                )}>
                                                    {f.mode}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-slate-600">{f.monnaie}</td>
                                            <td className="px-5 py-3">
                                                <span className={cn(
                                                    'px-3 py-1 rounded-md text-xs font-bold text-white',
                                                    f.actif ? 'bg-[#1775FF]' : 'bg-slate-300'
                                                )}>
                                                    {f.actif ? 'Oui' : 'Non'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3">
                                                {f.lastTestStatus ? (
                                                    <span
                                                        className={cn(
                                                            'inline-flex items-center gap-1 text-xs font-medium',
                                                            f.lastTestStatus === 'SUCCESS' ? 'text-emerald-600' : 'text-red-500'
                                                        )}
                                                        title={f.lastTestMessage ?? ''}
                                                    >
                                                        {f.lastTestStatus === 'SUCCESS'
                                                            ? <CheckCircle2 className="w-3.5 h-3.5" />
                                                            : <XCircle className="w-3.5 h-3.5" />}
                                                        {f.lastTestedAt
                                                            ? new Date(f.lastTestedAt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
                                                            : ''}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-slate-400">Jamais testé</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-2">
                                                    {/* Real enable/disable action — this replaces editing providerRegistry.js by hand */}
                                                    <button
                                                        role="switch"
                                                        aria-checked={f.actif}
                                                        disabled={togglingId === f.id}
                                                        onClick={() => handleToggle(f.id)}
                                                        className={cn(
                                                            'relative w-11 h-6 rounded-full transition-colors shrink-0 disabled:opacity-50',
                                                            f.actif ? 'bg-emerald-500' : 'bg-slate-300'
                                                        )}
                                                    >
                                                        <span
                                                            className={cn(
                                                                'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform',
                                                                f.actif && 'translate-x-5'
                                                            )}
                                                        />
                                                    </button>

                                                    <button
                                                        onClick={() => openEditDialog(f)}
                                                        className="w-8 h-8 rounded-lg bg-[#DFECFF] text-[#1775FF] flex items-center justify-center hover:bg-[#1775FF] hover:text-white transition-colors"
                                                        title="Modifier"
                                                    >
                                                        <Pencil className="w-3.5 h-3.5" />
                                                    </button>

                                                    <button
                                                        onClick={() => handleTest(f.id)}
                                                        disabled={testingId === f.id}
                                                        className="w-8 h-8 rounded-lg bg-[#DFECFF] text-[#1775FF] flex items-center justify-center hover:bg-[#1775FF] hover:text-white transition-colors disabled:opacity-50"
                                                        title="Tester la connexion"
                                                    >
                                                        {testingId === f.id
                                                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                            : <ShieldCheck className="w-3.5 h-3.5" />}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {fournisseurs.length === 0 && (
                                        <tr>
                                            <td colSpan={9} className="px-5 py-10 text-center text-slate-400">
                                                Aucun fournisseur configuré.
                                            </td>
                                        </tr>
                                    )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Create dialog */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Ajouter un Fournisseur</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label className="text-xs text-slate-500">Type</Label>
                            <Select
                                value={createForm.type}
                                onValueChange={(v) => loadAvailableCodesForType(v as FournisseurTypeCode)}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="FLIGHT">Vols</SelectItem>
                                    <SelectItem value="HOTEL">Hôtels</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs text-slate-500">Code</Label>
                            <Select
                                value={createForm.code}
                                onValueChange={(v) => setCreateForm((f) => ({ ...f, code: v }))}
                                disabled={codesLoading || availableCodes.length === 0}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={
                                        codesLoading
                                            ? 'Chargement...'
                                            : availableCodes.length === 0
                                                ? 'Tous les providers sont déjà configurés'
                                                : 'Sélectionner un code'
                                    } />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableCodes.map((c) => (
                                        <SelectItem key={c} value={c}>{c}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-[11px] text-slate-400">
                                Seuls les providers réellement implémentés côté serveur apparaissent ici.
                            </p>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs text-slate-500">Nom</Label>
                            <Input
                                value={createForm.nom}
                                onChange={(e) => setCreateForm((f) => ({ ...f, nom: e.target.value }))}
                                placeholder="Aqc"
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-4">

                            <div className="space-y-1.5">
                                <Label className="text-xs text-slate-500">Mode</Label>
                                <Select value={createForm.mode} onValueChange={(v) => setCreateForm((f) => ({ ...f, mode: v as FournisseurMode }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="TEST">TEST</SelectItem>
                                        <SelectItem value="LIVE">LIVE</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs text-slate-500">Monnaie</Label>
                                <Input
                                    value={createForm.monnaie}
                                    onChange={(e) => setCreateForm((f) => ({ ...f, monnaie: e.target.value.toUpperCase() }))}
                                    maxLength={3}
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateOpen(false)}>Annuler</Button>
                        <Button
                            className="bg-[#1775FF] hover:bg-[#1775FF]/90 text-white"
                            onClick={handleCreate}
                            disabled={!createForm.code || !createForm.nom.trim() || saving}
                        >
                            {saving ? 'Ajout...' : 'Ajouter'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit dialog — code and type are fixed/read-only, everything else editable */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Modifier {editForm.nom || 'le fournisseur'}</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs text-slate-500">Code</Label>
                                <Input value={editForm.code} disabled className="font-mono text-xs bg-slate-50" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs text-slate-500">Type</Label>
                                <Input value={TYPE_LABELS[editForm.type]} disabled className="text-xs bg-slate-50" />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs text-slate-500">Nom</Label>
                            <Input
                                value={editForm.nom}
                                onChange={(e) => setEditForm((f) => ({ ...f, nom: e.target.value }))}
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-4">

                            <div className="space-y-1.5">
                                <Label className="text-xs text-slate-500">Mode</Label>
                                <Select value={editForm.mode} onValueChange={(v) => setEditForm((f) => ({ ...f, mode: v as FournisseurMode }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="TEST">TEST</SelectItem>
                                        <SelectItem value="LIVE">LIVE</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs text-slate-500">Monnaie</Label>
                                <Input
                                    value={editForm.monnaie}
                                    onChange={(e) => setEditForm((f) => ({ ...f, monnaie: e.target.value.toUpperCase() }))}
                                    maxLength={3}
                                />
                            </div>
                        </div>


                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditOpen(false)}>Annuler</Button>
                        <Button
                            className="bg-[#1775FF] hover:bg-[#1775FF]/90 text-white"
                            onClick={handleEditSave}
                            disabled={!editForm.nom.trim() || editSaving}
                        >
                            {editSaving ? 'Enregistrement...' : 'Enregistrer'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}