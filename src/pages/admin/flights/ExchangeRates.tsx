// src/pages/admin/ExchangeRates.tsx
import { useState, useEffect, useCallback } from 'react';
import { Plus, Save, Trash2, Loader2 } from 'lucide-react';
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
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { toast } from 'sonner';
import {
    listExchangeRates, createExchangeRate, updateExchangeRate, deleteExchangeRate, getExchangeRateHistory,
    type ExchangeRateDTO, type ExchangeRateHistoryPoint,
} from '@/service/admin/exchangeRate.service';

// ── Currencies available for pairing — expand as needed ─────────────────
const CURRENCIES = [
    { code: 'DZD', label: 'Dinar Algérien (DZD)' },
    { code: 'EUR', label: 'Euro (EUR)' },
    { code: 'GBP', label: 'Livre Sterling (GBP)' },
    { code: 'USD', label: 'Dollar US (USD)' },
];

const EMPTY_FORM = { from: 'EUR', to: 'DZD', cours: '' };

const formatDate = (iso: string) =>
    new Date(iso).toLocaleString('fr-FR', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });

const formatTime = (iso: string) =>
    new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

export default function ExchangeRates() {
    const [rates, setRates] = useState<ExchangeRateDTO[]>([]);
    const [loadingRates, setLoadingRates] = useState(true);

    const [editValues, setEditValues] = useState<Record<string, string>>({});
    const [savingId, setSavingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Chart is scoped to one specific pair (an ExchangeRate id), not a bare
    // currency code — there's no such thing as "history for GBP" alone,
    // only history for a given pair.
    const [selectedPairId, setSelectedPairId] = useState<string | null>(null);
    const [chartData, setChartData] = useState<ExchangeRateHistoryPoint[]>([]);
    const [loadingChart, setLoadingChart] = useState(false);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [creating, setCreating] = useState(false);

    const loadRates = useCallback(async () => {
        setLoadingRates(true);
        try {
            const data = await listExchangeRates();
            setRates(data);
            setEditValues(Object.fromEntries(data.map((r) => [r.id, r.rate])));
            // keep current chart selection if it still exists, else default
            // to the first pair
            setSelectedPairId((prev) => (prev && data.some((r) => r.id === prev)) ? prev : (data[0]?.id ?? null));
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Échec du chargement des taux');
        } finally {
            setLoadingRates(false);
        }
    }, []);

    useEffect(() => { loadRates(); }, [loadRates]);

    useEffect(() => {
        if (!selectedPairId) { setChartData([]); return; }
        let cancelled = false;
        (async () => {
            setLoadingChart(true);
            try {
                const history = await getExchangeRateHistory(selectedPairId, 30);
                if (!cancelled) setChartData(history);
            } catch (err) {
                if (!cancelled) toast.error(err instanceof Error ? err.message : "Échec du chargement de l'historique");
            } finally {
                if (!cancelled) setLoadingChart(false);
            }
        })();
        return () => { cancelled = true; };
    }, [selectedPairId]);

    const selectedPair = rates.find((r) => r.id === selectedPairId) ?? null;

    const handleFieldChange = (id: string, value: string) => {
        setEditValues((prev) => ({ ...prev, [id]: value }));
    };

    const handleSaveRate = async (id: string) => {
        const value = editValues[id];
        if (!value?.trim()) return;
        setSavingId(id);
        try {
            const updated = await updateExchangeRate(id, value);
            setRates((prev) => prev.map((r) => (r.id === id ? updated : r)));
            if (id === selectedPairId) {
                // refresh chart since a new history point was just written
                const history = await getExchangeRateHistory(id, 30);
                setChartData(history);
            }
            toast.success('Taux mis à jour');
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Échec de la mise à jour');
        } finally {
            setSavingId(null);
        }
    };

    const handleDelete = async (id: string) => {
        setDeletingId(id);
        try {
            await deleteExchangeRate(id);
            setRates((prev) => prev.filter((r) => r.id !== id));
            if (id === selectedPairId) setSelectedPairId(null);
            toast.success('Devise supprimée');
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Échec de la suppression');
        } finally {
            setDeletingId(null);
        }
    };

    const handleAddDevise = async () => {
        if (!form.cours.trim()) return;
        if (form.from === form.to) { toast.error('Les devises source et cible doivent être différentes'); return; }
        setCreating(true);
        try {
            const created = await createExchangeRate({ fromCurrency: form.from, toCurrency: form.to, rate: form.cours });
            setRates((prev) => [...prev, created]);
            setEditValues((prev) => ({ ...prev, [created.id]: created.rate }));
            setSelectedPairId(created.id);
            setForm(EMPTY_FORM);
            setDialogOpen(false);
            toast.success('Devise ajoutée');
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Échec de l'ajout");
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-800">Taux de change</h1>

            <div className="grid lg:grid-cols-[1fr,420px] gap-6 items-start">
                {/* Left: rates table */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">Taux de change</h3>
                        </div>
                        <Button
                            size="icon"
                            className="rounded-full bg-[#1775FF] hover:bg-[#1775FF]/90 text-white h-10 w-10 shrink-0"
                            onClick={() => setDialogOpen(true)}
                        >
                            <Plus className="w-5 h-5" />
                        </Button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                            <tr className="border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wide">
                                <th className="text-left font-semibold px-6 py-3">Paire de devises</th>
                                <th className="text-left font-semibold px-6 py-3">Cours</th>
                                <th className="text-left font-semibold px-6 py-3">Date M.A.J</th>
                                <th className="text-left font-semibold px-6 py-3">Action</th>
                            </tr>
                            </thead>
                            <tbody>
                            {loadingRates && (
                                <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-400">
                                    <Loader2 className="w-5 h-5 animate-spin inline mr-2" /> Chargement...
                                </td></tr>
                            )}
                            {!loadingRates && rates.map((r) => (
                                <tr
                                    key={r.id}
                                    onClick={() => setSelectedPairId(r.id)}
                                    className={`border-b border-slate-50 hover:bg-[#DFECFF]/30 transition-colors cursor-pointer ${r.id === selectedPairId ? 'bg-[#DFECFF]/50' : ''}`}
                                >
                                    <td className="px-6 py-3 font-medium text-slate-800">{r.fromCurrency} / {r.toCurrency}</td>
                                    <td className="px-6 py-3" onClick={(e) => e.stopPropagation()}>
                                        <Input
                                            value={editValues[r.id] ?? r.rate}
                                            onChange={(e) => handleFieldChange(r.id, e.target.value)}
                                            className="w-32 h-9"
                                            inputMode="decimal"
                                        />
                                    </td>
                                    <td className="px-6 py-3 text-slate-500">{formatDate(r.updatedAt)}</td>
                                    <td className="px-6 py-3" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleSaveRate(r.id)}
                                                disabled={savingId === r.id}
                                                className="w-8 h-8 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-colors disabled:opacity-50"
                                            >
                                                {savingId === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                            </button>
                                            <button
                                                onClick={() => handleDelete(r.id)}
                                                disabled={deletingId === r.id}
                                                className="w-8 h-8 rounded-md bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors disabled:opacity-50"
                                            >
                                                {deletingId === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!loadingRates && rates.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-10 text-center text-slate-400">
                                        Aucune devise configurée.
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right: chart + history */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-slate-800">Évolution taux de change</h3>
                            <Select value={selectedPairId ?? undefined} onValueChange={setSelectedPairId}>
                                <SelectTrigger className="w-32 h-9"><SelectValue placeholder="Paire" /></SelectTrigger>
                                <SelectContent>
                                    {rates.map((r) => (
                                        <SelectItem key={r.id} value={r.id}>{r.fromCurrency}/{r.toCurrency}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <p className="text-xs text-slate-400 mb-2">
                            {selectedPair ? `${selectedPair.fromCurrency} / ${selectedPair.toCurrency}` : 'Sélectionnez une paire'}
                        </p>
                        <div className="h-56">
                            {loadingChart ? (
                                <div className="h-full flex items-center justify-center text-slate-400">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                </div>
                            ) : chartData.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                                    Aucun historique disponible.
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart
                                        data={chartData.map((p) => ({ time: formatTime(p.recordedAt), value: Number(p.rate) }))}
                                        margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="#EEF3FB" />
                                        <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#94A3B8' }} />
                                        <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} />
                                        <Tooltip />
                                        <Line
                                            type="monotone" dataKey="value"
                                            name={selectedPair ? `${selectedPair.fromCurrency}/${selectedPair.toCurrency}` : 'Taux'}
                                            stroke="#1775FF" strokeWidth={2} dot={{ r: 3 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                        <h3 className="font-bold text-slate-800">Historique des valeurs</h3>
                        <p className="text-xs text-slate-400 mb-4">
                            {selectedPair ? `${selectedPair.fromCurrency} / ${selectedPair.toCurrency} — dernières valeurs` : 'Sélectionnez une paire'}
                        </p>

                        <div className="space-y-3">
                            {[...chartData].reverse().slice(0, 5).map((h) => (
                                <div key={h.id} className="flex items-center justify-between text-sm border-b border-slate-50 pb-2 last:border-0">
                                    <span className="text-slate-500">{formatDate(h.recordedAt)}</span>
                                    <span className="font-semibold text-slate-800">{h.rate}</span>
                                </div>
                            ))}
                            {chartData.length === 0 && (
                                <p className="text-sm text-slate-400">Aucune modification récente.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Add devise dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Ajouter une devise</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs text-slate-500">Du</Label>
                                <Select value={form.from} onValueChange={(v) => setForm(f => ({ ...f, from: v }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {CURRENCIES.map((c) => (
                                            <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs text-slate-500">Au</Label>
                                <Select value={form.to} onValueChange={(v) => setForm(f => ({ ...f, to: v }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {CURRENCIES.map((c) => (
                                            <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs text-slate-500">Taux de change</Label>
                                <Input
                                    value={form.cours}
                                    onChange={(e) => setForm(f => ({ ...f, cours: e.target.value }))}
                                    placeholder="0.0000"
                                    inputMode="decimal"
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
                        <Button
                            className="bg-[#1775FF] hover:bg-[#1775FF]/90 text-white"
                            onClick={handleAddDevise}
                            disabled={!form.cours.trim() || creating}
                        >
                            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ajouter'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}