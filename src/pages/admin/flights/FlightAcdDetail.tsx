// src/pages/admin/FlightAcdFeeDetail.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getAcdFee, updateAcdFee, type FlightAcdFee, type FareClassScope } from '@/service/admin/flightAcdFee.service';
import { AIRLINES } from '@/data/airlines';

const CLASSES: { code: FareClassScope; label: string; sub: string }[] = [
    { code: 'ECO', label: 'Economique', sub: 'Economy' },
    { code: 'BUSINESS', label: 'Affaires', sub: 'Business' },
    { code: 'FIRST', label: 'Première', sub: 'First' },
    { code: 'PREM_ECO', label: 'Economie Premium', sub: 'Premium Economy' },
];

interface BlockFormState {
    fraisInt: string;
    montantMin: string;
    montantMax: string;
}

const emptyBlock = (): BlockFormState => ({ fraisInt: '0', montantMin: '0', montantMax: '1000000' });

function FeeBlockFields({ block, onChange }: { block: BlockFormState; onChange: (patch: Partial<BlockFormState>) => void }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
                <label className="text-sm text-slate-700">Frais Int.*</label>
                <Input value={block.fraisInt} onChange={(e) => onChange({ fraisInt: e.target.value })} inputMode="decimal" />
            </div>
            <div className="space-y-1.5">
                <label className="text-sm text-slate-700">si montant &gt; à (Min)*</label>
                <Input value={block.montantMin} onChange={(e) => onChange({ montantMin: e.target.value })} inputMode="decimal" />
            </div>
            <div className="space-y-1.5">
                <label className="text-sm text-slate-700">si montant &lt;= à (Max)*</label>
                <Input value={block.montantMax} onChange={(e) => onChange({ montantMax: e.target.value })} inputMode="decimal" />
            </div>
        </div>
    );
}

export default function FlightAcdFeeDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [fee, setFee] = useState<FlightAcdFee | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [defaultBlock, setDefaultBlock] = useState<BlockFormState>(emptyBlock());
    const [classBlocks, setClassBlocks] = useState<Record<FareClassScope, BlockFormState>>({
        DEFAULT: emptyBlock(), ECO: emptyBlock(), BUSINESS: emptyBlock(), FIRST: emptyBlock(), PREM_ECO: emptyBlock(),
    });

    useEffect(() => {
        if (!id) return;
        (async () => {
            setLoading(true);
            try {
                const data = await getAcdFee(id);
                setFee(data);

                const toForm = (b?: { fraisInt: string; montantMin: string; montantMax: string }) =>
                    b ? { fraisInt: b.fraisInt, montantMin: b.montantMin, montantMax: b.montantMax } : emptyBlock();

                setDefaultBlock(toForm(data.blocks.find((b) => b.scope === 'DEFAULT')));
                setClassBlocks({
                    DEFAULT: toForm(data.blocks.find((b) => b.scope === 'DEFAULT')),
                    ECO: toForm(data.blocks.find((b) => b.scope === 'ECO')),
                    BUSINESS: toForm(data.blocks.find((b) => b.scope === 'BUSINESS')),
                    FIRST: toForm(data.blocks.find((b) => b.scope === 'FIRST')),
                    PREM_ECO: toForm(data.blocks.find((b) => b.scope === 'PREM_ECO')),
                });
            } catch (err: any) {
                alert(err.message ?? 'Impossible de charger ce frais ACD');
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    if (loading || !fee) {
        return <div className="text-slate-400 text-sm">Chargement...</div>;
    }

    const airlineDisplay = fee.airlineCode === null
        ? 'toute les compagnies aériennes'
        : `${AIRLINES.find((a) => a.code === fee.airlineCode)?.name ?? fee.airlineCode} (${fee.airlineCode})`;

    const handleSave = async () => {
        if (!id) return;
        setSaving(true);
        try {
            const blocks = [
                { scope: 'DEFAULT' as const, fraisInt: Number(defaultBlock.fraisInt), montantMin: Number(defaultBlock.montantMin), montantMax: Number(defaultBlock.montantMax) },
                ...CLASSES.map((c) => ({
                    scope: c.code,
                    fraisInt: Number(classBlocks[c.code].fraisInt),
                    montantMin: Number(classBlocks[c.code].montantMin),
                    montantMax: Number(classBlocks[c.code].montantMax),
                })),
            ];
            const updated = await updateAcdFee(id, { blocks });
            setFee(updated);
            alert('Enregistré.');
        } catch (err: any) {
            alert(err.message ?? "Échec de l'enregistrement");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <button onClick={() => navigate('/admin/flight-acd-fees')} className="text-slate-500 hover:text-[#1775FF] flex items-center gap-2 text-sm font-medium transition-colors">
                <ArrowLeft className="w-4 h-4" /> Retour
            </button>

            <h1 className="text-2xl font-bold text-slate-800">
                {fee.airlineCode === null ? 'Frais ACD Par défaut' : `Frais ACD "${airlineDisplay}"`}
            </h1>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
                <div className="space-y-1 text-sm text-slate-700">
                    <p className="font-semibold">Frais ACD zone A appliqué pour {airlineDisplay}</p>
                    <p>Monnaie : {fee.monnaie}</p>
                    <p>Appliqués sur le montant <strong>{fee.tarif}</strong></p>
                    <p>Type de frais : <strong>{fee.typeFrais === 'FIXED' ? 'montant fixe' : 'pourcentage'}</strong></p>
                    <p>
                        Les frais ACD s'appliquent aux vols au sein de{' '}
                        <button onClick={() => navigate('/admin/flight-acd-fees/countries')} className="text-[#1775FF] hover:underline font-medium">
                            la zone A
                        </button>
                        , incluant une destination en <span className="text-[#1775FF] font-medium">Amérique</span> ou en <span className="text-[#1775FF] font-medium">Asie</span>
                    </p>
                </div>

                <div>
                    <h3 className="font-semibold text-slate-800 mb-3">
                        Frais ACD par défaut <span className="italic font-normal text-slate-400">(peu importe la classe — utilisé tant que le mapping par classe n'est pas actif)</span>
                    </h3>
                    <FeeBlockFields block={defaultBlock} onChange={(patch) => setDefaultBlock((b) => ({ ...b, ...patch }))} />
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-8">
                    <h3 className="font-semibold text-slate-800">Frais ACD par Classe <span className="text-xs font-normal text-slate-400">(non encore utilisés dans le calcul)</span></h3>
                    {CLASSES.map((c) => (
                        <div key={c.code}>
                            <h4 className="font-semibold text-emerald-600 mb-3">{c.label} <span className="text-slate-500 font-normal">({c.sub})</span></h4>
                            <FeeBlockFields
                                block={classBlocks[c.code]}
                                onChange={(patch) => setClassBlocks((prev) => ({ ...prev, [c.code]: { ...prev[c.code], ...patch } }))}
                            />
                        </div>
                    ))}
                </div>

                <Button className="bg-emerald-500 hover:bg-emerald-600 text-white" onClick={handleSave} disabled={saving}>
                    {saving ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
            </div>
        </div>
    );
}