// src/pages/admin/FlightPromoCodes.tsx
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronRight, Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface PromoCode {
    id: number;
    code: string;
    description: string;
    validFrom: string; // display string, e.g. "10/02/26"
    validTo: string;
    clientDistributeur: string[]; // e.g. ["Tous les clients", "Bookingo App #35978"]
    promoLabel: string; // e.g. "1600 DZD"
}

// ── Mock seed — matches the reference table rows ─────────────────────────
const initialPromoCodes: PromoCode[] = [
    { id: 1, code: 'bookingo', description: 'bookingo',       validFrom: '10/02/26', validTo: '28/02/26', clientDistributeur: ['Tous les clients', 'Bookingo App #35978'], promoLabel: '1600 DZD' },
    { id: 2, code: 'bg1001',   description: 'test code promo', validFrom: '09/05/26', validTo: '09/05/27', clientDistributeur: ['Tous les clients', 'Bookingo App #35978'], promoLabel: '100 DZD' },
    { id: 3, code: 'BG3000',   description: 'remise de 3000',  validFrom: '14/05/26', validTo: '23/05/26', clientDistributeur: ['Tous les clients', 'Bookingo App #35978'], promoLabel: '3000 DZD' },
    { id: 4, code: 'BG500',    description: 'REMISE NATIONAL', validFrom: '15/05/26', validTo: '23/05/26', clientDistributeur: ['Tous les clients', 'Bookingo App #35978'], promoLabel: '500 DZD' },
];

export default function FlightPromoCodes() {
    const navigate = useNavigate();
    const [promoCodes, setPromoCodes] = useState<PromoCode[]>(initialPromoCodes);
    const [advancedOpen, setAdvancedOpen] = useState(false);
    const [resultsOpen, setResultsOpen] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const pageSize = 10;

    const filtered = useMemo(() => {
        if (!search.trim()) return promoCodes;
        const q = search.trim().toLowerCase();
        return promoCodes.filter((p) =>
            p.code.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
        );
    }, [promoCodes, search]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

    const handleDelete = (id: number) => {
        // TODO: call DELETE /api/admin/flight-promo-codes/:id
        setPromoCodes((prev) => prev.filter((p) => p.id !== id));
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-800">Codes Promos</h1>
                <Button
                    className="bg-[#1775FF] hover:bg-[#1775FF]/90 text-white gap-2"
                    onClick={() => navigate('/admin/flight-promo-codes/new')}
                >
                    <Plus className="w-4 h-4" /> Ajouter un Code Promo
                </Button>
            </div>

            {/* Recherche avancée — collapsible, no fields specified yet */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <button
                    onClick={() => setAdvancedOpen((o) => !o)}
                    className="w-full flex items-center gap-2 px-6 py-4 text-[#1775FF] font-medium hover:bg-[#DFECFF]/30 transition-colors"
                >
                    {advancedOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    Recherche avancée
                </button>
                {advancedOpen && (
                    <div className="px-6 pb-5 text-sm text-slate-400">
                        {/* TODO: advanced filter fields once defined (date range, client, distributeur, etc.) */}
                        Filtres avancés à définir.
                    </div>
                )}
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
                    <div className="px-6 pb-6 space-y-4">
                        <div className="flex items-center justify-between flex-wrap gap-3">
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                Show
                                <select
                                    className="border border-slate-200 rounded-md px-2 py-1 text-sm"
                                    value={pageSize}
                                    disabled
                                >
                                    <option>10</option>
                                </select>
                                entries
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-slate-500">Search:</span>
                                <Input
                                    value={search}
                                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                    className="w-56 h-8"
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto rounded-xl border border-slate-100">
                            <table className="w-full text-sm">
                                <thead>
                                <tr className="border-b border-slate-100 text-slate-700 text-sm">
                                    <th className="text-left font-semibold px-5 py-3">Code</th>
                                    <th className="text-left font-semibold px-5 py-3">Description</th>
                                    <th className="text-left font-semibold px-5 py-3">Valable du – au</th>
                                    <th className="text-left font-semibold px-5 py-3">Client/Distributeur</th>
                                    <th className="text-left font-semibold px-5 py-3">Promo.</th>
                                    <th className="text-left font-semibold px-5 py-3">Actions</th>
                                </tr>
                                </thead>
                                <tbody>
                                {pageRows.map((p) => (
                                    <tr key={p.id} className="border-b border-slate-50 hover:bg-[#DFECFF]/30 transition-colors">
                                        <td className="px-5 py-3 font-medium text-slate-800">{p.code}</td>
                                        <td className="px-5 py-3 text-slate-600">{p.description}</td>
                                        <td className="px-5 py-3 text-slate-600">{p.validFrom} - {p.validTo}</td>
                                        <td className="px-5 py-3 text-slate-600">
                                            {p.clientDistributeur.map((line, i) => (
                                                <div key={i} className={i === 0 ? 'font-medium text-slate-700' : 'text-xs text-slate-400'}>
                                                    {line}
                                                </div>
                                            ))}
                                        </td>
                                        <td className="px-5 py-3 font-semibold text-[#1775FF]">{p.promoLabel}</td>
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => navigate(`/admin/flight-promo-codes/${p.id}/edit`)}
                                                    className="w-7 h-7 rounded-md bg-[#DFECFF] text-[#1775FF] flex items-center justify-center hover:bg-[#1775FF] hover:text-white transition-colors"
                                                >
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(p.id)}
                                                    className="w-7 h-7 rounded-md bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {pageRows.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                                            Aucun code promo trouvé.
                                        </td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex items-center justify-between text-sm text-slate-500">
                  <span>
                    Showing {filtered.length === 0 ? 0 : (page - 1) * pageSize + 1} to{' '}
                      {Math.min(page * pageSize, filtered.length)} of {filtered.length} entries
                  </span>
                            <div className="flex items-center gap-1">
                                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                                    Previous
                                </Button>
                                <span className="w-7 h-7 rounded-md bg-[#1775FF] text-white text-xs font-semibold flex items-center justify-center">
                      {page}
                    </span>
                                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                                    Next
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}