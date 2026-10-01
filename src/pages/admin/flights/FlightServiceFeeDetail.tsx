// src/pages/admin/FlightServiceFeeDetail.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Info, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    getServiceFee, updateServiceFee, testServiceFee,
    type FlightServiceFee, type FareClassScope, type TestFeeResult,
} from '@/service/admin/flightServiceFee.service';
import { AIRLINES } from '@/data/airlines';

const CLASSES: { code: FareClassScope; label: string; sub: string }[] = [
    { code: 'ECO', label: 'Economique', sub: 'Economy' },
    { code: 'BUSINESS', label: 'Affaires', sub: 'Business' },
    { code: 'FIRST', label: 'Première', sub: 'First' },
    { code: 'PREM_ECO', label: 'Economie Premium', sub: 'Premium Economy' },
];

interface BlockFormState {
    fraisInt: string;
    fraisDom: string;
    montantMin: string;
    montantMax: string;
}

const emptyBlock = (): BlockFormState => ({ fraisInt: '0', fraisDom: '0', montantMin: '0', montantMax: '1000000' });

function FeeBlockFields({ block, onChange }: { block: BlockFormState; onChange: (patch: Partial<BlockFormState>) => void }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="space-y-1.5">
                <label className="text-sm text-slate-700">Frais Int.*</label>
                <Input value={block.fraisInt} onChange={(e) => onChange({ fraisInt: e.target.value })} inputMode="decimal" />
            </div>
            <div className="space-y-1.5">
                <label className="text-sm text-slate-700">Frais Dom.*</label>
                <Input value={block.fraisDom} onChange={(e) => onChange({ fraisDom: e.target.value })} inputMode="decimal" />
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

export default function FlightServiceFeeDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [fee, setFee] = useState<FlightServiceFee | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [defaultBlock, setDefaultBlock] = useState<BlockFormState>(emptyBlock());
    const [classBlocks, setClassBlocks] = useState<Record<FareClassScope, BlockFormState>>({
        DEFAULT: emptyBlock(), ECO: emptyBlock(), BUSINESS: emptyBlock(), FIRST: emptyBlock(), PREM_ECO: emptyBlock(),
    });

    const [testPrice, setTestPrice] = useState('50000');
    const [testAdults, setTestAdults] = useState('1');
    const [testResult, setTestResult] = useState<TestFeeResult | null>(null);
    const [testing, setTesting] = useState(false);
    const [testError, setTestError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;
        (async () => {
            setLoading(true);
            try {
                const data = await getServiceFee(id);
                setFee(data);

                const toForm = (b?: { fraisInt: string; fraisDom: string; montantMin: string; montantMax: string }) =>
                    b ? { fraisInt: b.fraisInt, fraisDom: b.fraisDom, montantMin: b.montantMin, montantMax: b.montantMax } : emptyBlock();

                setDefaultBlock(toForm(data.blocks.find((b) => b.scope === 'DEFAULT')));
                setClassBlocks({
                    DEFAULT: toForm(data.blocks.find((b) => b.scope === 'DEFAULT')),
                    ECO: toForm(data.blocks.find((b) => b.scope === 'ECO')),
                    BUSINESS: toForm(data.blocks.find((b) => b.scope === 'BUSINESS')),
                    FIRST: toForm(data.blocks.find((b) => b.scope === 'FIRST')),
                    PREM_ECO: toForm(data.blocks.find((b) => b.scope === 'PREM_ECO')),
                });
            } catch (err: any) {
                alert(err.message ?? 'Impossible de charger ce frais');
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    if (loading || !fee) {
        return <div className="text-slate-400 text-sm">Chargement...</div>;
    }

    const airline = fee.airlineCode ? AIRLINES.find((a) => a.code === fee.airlineCode) : null;
    const airlineDisplay = fee.airlineCode === null ? 'Toutes compagnies' : `${airline?.name ?? fee.airlineCode} (${fee.airlineCode})`;

    const handleSave = async () => {
        if (!id) return;
        setSaving(true);
        try {
            const blocks = [
                { scope: 'DEFAULT' as const, fraisInt: Number(defaultBlock.fraisInt), fraisDom: Number(defaultBlock.fraisDom), montantMin: Number(defaultBlock.montantMin), montantMax: Number(defaultBlock.montantMax) },
                ...CLASSES.map((c) => ({
                    scope: c.code,
                    fraisInt: Number(classBlocks[c.code].fraisInt),
                    fraisDom: Number(classBlocks[c.code].fraisDom),
                    montantMin: Number(classBlocks[c.code].montantMin),
                    montantMax: Number(classBlocks[c.code].montantMax),
                })),
            ];
            const updated = await updateServiceFee(id, { blocks });
            setFee(updated);
            alert('Enregistré.');
        } catch (err: any) {
            alert(err.message ?? "Échec de l'enregistrement");
        } finally {
            setSaving(false);
        }
    };

    const handleTest = async () => {
        setTesting(true);
        setTestError(null);
        setTestResult(null);
        try {
            const result = await testServiceFee({
                airlineCode: fee.airlineCode ?? 'AH',
                fournisseurCode: fee.fournisseurCode,
                price: Number(testPrice),
                adults: Number(testAdults) || 1,
            });
            setTestResult(result);
        } catch (err: any) {
            setTestError(err.message ?? 'Échec du test');
        } finally {
            setTesting(false);
        }
    };

    return (
        <div className="space-y-6">
            <button onClick={() => navigate('/admin/flight-service-fees')} className="text-slate-500 hover:text-[#1775FF] flex items-center gap-2 text-sm font-medium transition-colors">
                <ArrowLeft className="w-4 h-4" /> Retour
            </button>

            <h1 className="text-2xl font-bold text-slate-800">Frais de service "{airlineDisplay}"</h1>

            <div className="grid lg:grid-cols-[1fr,360px] gap-6 items-start">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
                    <div className="space-y-1 text-sm text-slate-700">
                        <p>Monnaie : {fee.monnaie}</p>
                        <p>Appliqués sur le montant <strong>{fee.tarif}</strong></p>
                        <p>Type de frais : <strong>{fee.typeFrais === 'FIXED' ? 'montant fixe' : 'pourcentage'}</strong></p>
                    </div>

                    <div>
                        <h3 className="font-semibold text-slate-800 mb-3">
                            Frais par défaut <span className="italic font-normal text-slate-400">(peu importe la classe — utilisé tant que le mapping par classe n'est pas actif)</span>
                        </h3>
                        <FeeBlockFields block={defaultBlock} onChange={(patch) => setDefaultBlock((b) => ({ ...b, ...patch }))} />
                    </div>

                    <div className="pt-4 border-t border-slate-100 space-y-8">
                        <h3 className="font-semibold text-slate-800">Frais par Classe <span className="text-xs font-normal text-slate-400">(non encore utilisés dans le calcul)</span></h3>
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

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4 lg:sticky lg:top-24">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <PlayCircle className="w-4 h-4 text-[#1775FF]" /> Tester le calcul
                    </h3>
                    <p className="text-xs text-slate-400 flex items-start gap-1.5">
                        <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                        Simule le calcul appliqué lors d'une recherche réelle, sans appeler le fournisseur.
                    </p>

                    <div className="space-y-1.5">
                        <label className="text-xs text-slate-500">Prix de base (avant frais)</label>
                        <Input value={testPrice} onChange={(e) => setTestPrice(e.target.value)} inputMode="decimal" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs text-slate-500">Nombre de passagers</label>
                        <Input value={testAdults} onChange={(e) => setTestAdults(e.target.value)} inputMode="numeric" />
                    </div>

                    <Button className="w-full bg-[#1775FF] hover:bg-[#1775FF]/90 text-white" onClick={handleTest} disabled={testing}>
                        {testing ? 'Calcul...' : 'Tester'}
                    </Button>

                    {testError && <p className="text-sm text-red-500">{testError}</p>}

                    {testResult && (
                        <div className="rounded-xl bg-[#DFECFF]/40 p-4 space-y-1.5 text-sm">
                            <div className="flex justify-between"><span className="text-slate-500">Frais appliqué</span><span className="font-semibold">{testResult.fee.toLocaleString('fr-FR')} DZD</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Prix final</span><span className="font-bold text-[#1775FF]">{testResult.finalPrice.toLocaleString('fr-FR')} DZD</span></div>
                            <div className="flex justify-between text-xs text-slate-400"><span>Enregistrement trouvé</span><span>{testResult.feeRecordFound ? 'Oui' : 'Non'}</span></div>
                            {testResult.tierMatched !== undefined && (
                                <div className="flex justify-between text-xs text-slate-400"><span>Tranche correspondante</span><span>{testResult.tierMatched ? 'Oui' : 'Non'}</span></div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}