// src/pages/admin/ExchangeRates.tsx
import { useState, useMemo } from 'react';
import { Plus, Save, Trash2, X } from 'lucide-react';
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

// ── Currencies available for pairing — expand as needed ─────────────────
const CURRENCIES = [
    { code: 'DZD', label: 'Dinar Algérien (DZD)' },
    { code: 'EUR', label: 'Euro (EUR)' },
    { code: 'GBP', label: 'Livre Sterling (GBP)' },
    { code: 'USD', label: 'Dollar US (USD)' },
];
const currencyLabel = (code: string) => CURRENCIES.find(c => c.code === code)?.label ?? code;

interface ExchangeRate {
    id: number;
    from: string;
    to: string;
    cours: string;
    updatedAt: string; // display string
}

interface HistoryEntry {
    id: number;
    user: string;
    date: string;
    message: string;
}

// ── Mock seed — matches the reference screenshot's rows ──────────────────
const initialRates: ExchangeRate[] = [
    { id: 1, from: 'DZD', to: 'EUR', cours: '0.0068', updatedAt: '04/06/2026 16:38' },
    { id: 2, from: 'GBP', to: 'DZD', cours: '330',     updatedAt: '12/02/2026 12:41' },
];

const initialHistory: HistoryEntry[] = [
    { id: 1, user: 'Youcef Lichani', date: '04/06/2026 16:38', message: 'Modif. Taux de change DZD/EUR : 0.007 au lieu de 0.007 pour Bookingo.Pro #23430' },
    { id: 2, user: 'Youcef Lichani', date: '04/06/2026 16:38', message: 'Modif. Taux de change DZD/EUR : 0.007 au lieu de 0.007 pour Bookingo.Pro #23430' },
];

// Mock chart data for the selected pair — replace with real time-series once available
const mockChartData = [
    { time: '3 juin 06:00', value: 0 },
    { time: '3 juin 18:00', value: 0 },
    { time: '4 juin 06:00', value: 0.0068 },
    { time: '4 juin 18:00', value: 0 },
    { time: '5 juin 18:00', value: 0 },
];

const EMPTY_FORM = { from: 'EUR', to: 'EUR', cours: '' };

export default function ExchangeRates() {
    const [rates, setRates] = useState<ExchangeRate[]>(initialRates);
    const [history] = useState<HistoryEntry[]>(initialHistory);
    const [chartCurrency, setChartCurrency] = useState('DZD');

    const [dialogOpen, setDialogOpen] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);

    const [editValues, setEditValues] = useState<Record<number, string>>(
        Object.fromEntries(initialRates.map(r => [r.id, r.cours]))
    );

    const handleFieldChange = (id: number, value: string) => {
        setEditValues((prev) => ({ ...prev, [id]: value }));
    };

    const handleSaveRate = (id: number) => {
        // TODO: call PATCH /api/admin/exchange-rates/:id with { cours: editValues[id] }
        setRates((prev) => prev.map((r) => (r.id === id ? { ...r, cours: editValues[id] } : r)));
    };

    const handleDelete = (id: number) => {
        // TODO: call DELETE /api/admin/exchange-rates/:id
        setRates((prev) => prev.filter((r) => r.id !== id));
    };

    const handleAddDevise = () => {
        if (!form.cours.trim()) return;
        // TODO: call POST /api/admin/exchange-rates
        const nextId = Math.max(0, ...rates.map(r => r.id)) + 1;
        const now = new Date().toLocaleString('fr-FR', {
            day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
        }).replace(',', '');
        setRates((prev) => [...prev, { id: nextId, from: form.from, to: form.to, cours: form.cours, updatedAt: now }]);
        setEditValues((prev) => ({ ...prev, [nextId]: form.cours }));
        setForm(EMPTY_FORM);
        setDialogOpen(false);
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
                            <p className="text-sm text-slate-400 mt-0.5">Distributeur principal Bookingo.Pro #23430</p>
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
                            {rates.map((r) => (
                                <tr key={r.id} className="border-b border-slate-50 hover:bg-[#DFECFF]/30 transition-colors">
                                    <td className="px-6 py-3 font-medium text-slate-800">{r.from} / {r.to}</td>
                                    <td className="px-6 py-3">
                                        <Input
                                            value={editValues[r.id] ?? r.cours}
                                            onChange={(e) => handleFieldChange(r.id, e.target.value)}
                                            className="w-32 h-9"
                                            inputMode="decimal"
                                        />
                                    </td>
                                    <td className="px-6 py-3 text-slate-500">{r.updatedAt}</td>
                                    <td className="px-6 py-3">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleSaveRate(r.id)}
                                                className="w-8 h-8 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-colors"
                                            >
                                                <Save className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(r.id)}
                                                className="w-8 h-8 rounded-md bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {rates.length === 0 && (
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
                            <Select value={chartCurrency} onValueChange={setChartCurrency}>
                                <SelectTrigger className="w-28 h-9"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {CURRENCIES.map((c) => (
                                        <SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <p className="text-xs text-slate-400 mb-2">Taux de change</p>
                        <div className="h-56">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={mockChartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#EEF3FB" />
                                    <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#94A3B8' }} />
                                    <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} domain={[-1, 2]} />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="value" name={`${chartCurrency}/EUR`} stroke="#1775FF" strokeWidth={2} dot={{ r: 3 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                        <h3 className="font-bold text-slate-800">Historique des modifications</h3>
                        <p className="text-xs text-slate-400 mb-4">Les 5 dernières</p>

                        <div className="space-y-4">
                            {history.map((h, i) => (
                                <div key={h.id} className="flex gap-3">
                                    <div className="flex flex-col items-center">
                                        <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                                            {h.user.split(' ').map(w => w[0]).join('').slice(0, 2)}
                                        </div>
                                        {i < history.length - 1 && <div className="w-px flex-1 bg-slate-200 mt-1" />}
                                    </div>
                                    <div className="pb-4">
                                        <p className="text-sm font-semibold text-slate-800">
                                            {h.user} <span className="text-slate-400 font-normal text-xs">{h.date}</span>
                                        </p>
                                        <p className="text-sm text-slate-600 mt-0.5">{h.message}</p>
                                    </div>
                                </div>
                            ))}
                            {history.length === 0 && (
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
                        <p className="text-sm font-semibold text-slate-700">Distributeur principal Bookingo.Pro #23430</p>

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
                            disabled={!form.cours.trim()}
                        >
                            Ajouter
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}