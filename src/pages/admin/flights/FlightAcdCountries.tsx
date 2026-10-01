// src/pages/admin/AcdZoneCountries.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';

const API = import.meta.env.VITE_API_URL;

interface AcdCountry {
    id: string;
    isoCode: string;
    nom: string;
}

function authHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

async function handle<T>(res: Response): Promise<T> {
    const data = await res.json();
    if (!res.ok) throw new Error(data.message ?? 'Erreur');
    return data.data as T;
}

const EMPTY_FORM = { isoCode: '', nom: '' };

export default function AcdZoneCountries() {
    const navigate = useNavigate();
    const [countries, setCountries] = useState<AcdCountry[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);

    const load = async () => {
        setLoading(true);
        setLoadError(null);
        try {
            const res = await fetch(`${API}/api/admin/acd-zone-countries`, { headers: authHeaders() });
            setCountries(await handle<AcdCountry[]>(res));
        } catch (err: any) {
            setLoadError(err.message ?? 'Impossible de charger la liste');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const openCreate = () => {
        setEditingId(null);
        setForm(EMPTY_FORM);
        setDialogOpen(true);
    };

    const openEdit = (c: AcdCountry) => {
        setEditingId(c.id);
        setForm({ isoCode: c.isoCode, nom: c.nom });
        setDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Retirer ce pays de la zone ACD ?')) return;
        try {
            const res = await fetch(`${API}/api/admin/acd-zone-countries/${id}`, { method: 'DELETE', headers: authHeaders() });
            await handle<void>(res);
            setCountries((prev) => prev.filter((c) => c.id !== id));
        } catch (err: any) {
            alert(err.message ?? 'Échec de la suppression');
        }
    };

    const handleSave = async () => {
        if (!form.isoCode.trim() || !form.nom.trim()) return;
        setSaving(true);
        try {
            if (editingId != null) {
                const res = await fetch(`${API}/api/admin/acd-zone-countries/${editingId}`, {
                    method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ nom: form.nom }),
                });
                const updated = await handle<AcdCountry>(res);
                setCountries((prev) => prev.map((c) => (c.id === editingId ? updated : c)));
            } else {
                const res = await fetch(`${API}/api/admin/acd-zone-countries`, {
                    method: 'POST', headers: authHeaders(),
                    body: JSON.stringify({ isoCode: form.isoCode, nom: form.nom }),
                });
                const created = await handle<AcdCountry>(res);
                setCountries((prev) => [...prev, created].sort((a, b) => a.nom.localeCompare(b.nom)));
            }
            setDialogOpen(false);
        } catch (err: any) {
            alert(err.message ?? "Échec de l'enregistrement");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <button onClick={() => navigate('/admin/flight-acd-fees')} className="text-slate-500 hover:text-[#1775FF] flex items-center gap-2 text-sm font-medium transition-colors">
                <ArrowLeft className="w-4 h-4" /> Retour aux frais ACD
            </button>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800">Liste des pays qui demandent un ACD</h3>
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
                    <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 bg-white z-10">
                            <tr className="border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wide">
                                <th className="text-left font-semibold px-6 py-3">isoCode</th>
                                <th className="text-left font-semibold px-6 py-3">Nom</th>
                                <th className="text-left font-semibold px-6 py-3">Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {countries.map((c) => (
                                <tr key={c.id} className="border-b border-slate-50 hover:bg-[#DFECFF]/30 transition-colors">
                                    <td className="px-6 py-3 font-medium text-slate-800">{c.isoCode}</td>
                                    <td className="px-6 py-3 text-slate-600">{c.nom}</td>
                                    <td className="px-6 py-3">
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => openEdit(c)} className="w-7 h-7 rounded-md bg-[#DFECFF] text-[#1775FF] flex items-center justify-center hover:bg-[#1775FF] hover:text-white transition-colors">
                                                <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                            <button onClick={() => handleDelete(c.id)} className="w-7 h-7 rounded-md bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {countries.length === 0 && (
                                <tr><td colSpan={3} className="px-6 py-10 text-center text-slate-400">Aucun pays configuré.</td></tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader><DialogTitle>{editingId != null ? 'Modifier le pays' : 'Ajouter un pays'}</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label className="text-xs text-slate-500">isoCode</Label>
                            <Input
                                value={form.isoCode}
                                onChange={(e) => setForm((f) => ({ ...f, isoCode: e.target.value.toUpperCase() }))}
                                maxLength={2}
                                placeholder="US"
                                disabled={editingId != null}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs text-slate-500">Nom</Label>
                            <Input value={form.nom} onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))} placeholder="États-Unis" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
                        <Button className="bg-[#1775FF] hover:bg-[#1775FF]/90 text-white" onClick={handleSave} disabled={!form.isoCode.trim() || !form.nom.trim() || saving}>
                            {saving ? 'Enregistrement...' : editingId != null ? 'Enregistrer' : 'Ajouter'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}