import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, Download, Printer, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getReceipt, type ReceiptData } from '@/service/payment.service';
import AppLoading from '@/components/common/AppLoading';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatAmount = (v: number | string) => `${Number(v).toFixed(2)} DA`;

// ─────────────────────────────────────────────────────────────────────────────
const ReceiptPDF = () => {
    const { applicationId } = useParams<{ applicationId: string }>();
    const navigate          = useNavigate();

    const [receipt, setReceipt] = useState<ReceiptData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState<string | null>(null);

    useEffect(() => {
        if (!applicationId) return;
        getReceipt(applicationId)
            .then(setReceipt)
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, [applicationId]);

    // ── Impression ────────────────────────────────────────────────────────────
    const handlePrint = () => window.print();

    // ── Téléchargement CSV ────────────────────────────────────────────────────
    const handleDownload = () => {
        if (!receipt) return;
        const rows = [
            ['BOOKINGO VISA — Reçu de paiement', ''],
            ['Powered by SATIM I-PAY', ''],
            ['', ''],
            ['Identifiant SATIM',    receipt.satimIdentifiant  ?? '—'],
            ['N° de commande',       receipt.satimOrderNumber  ?? '—'],
            ["Code d'autorisation",  receipt.satimApprovalCode ?? '—'],
            ['Montant',              formatAmount(receipt.amount)],
            ['Mode de paiement',     'CIB/EDAHABIA'],
            ['Statut',               'Votre paiement a été accepté.'],
            ['Date / Heure',         receipt.formattedDate ?? '—'],
            ['Référence BGV',        receipt.receiptRef ?? '—'],
            ['', ''],
            ['Destination',          receipt.visaApplication.visaType.country.nameFr],
            ['Type de visa',         receipt.visaApplication.visaType.nameFr],
            ['Voyageurs',            String(receipt.visaApplication.numberOfPeople)],
            ['Email',                receipt.visaApplication.email],
            ['Téléphone',            receipt.visaApplication.phone],
            ['', ''],
            ...receipt.visaApplication.passengers.map((p, i) => [
                `Voyageur ${i + 1}`,
                `${p.firstName} ${p.lastName} — Passeport: ${p.passportNumber}`,
            ]),
            ['', ''],
            ['En cas de problème, contactez le numéro vert SATIM : 3020', ''],
        ];
        const csv  = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `recu-${receipt.receiptRef ?? applicationId?.slice(0, 8)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // ── Loading ───────────────────────────────────────────────────────────────
    if (loading) return (
        <AppLoading message="Génération de votre reçu..." />
    );

    if (error || !receipt) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center space-y-3">
                <p className="text-destructive font-semibold">{error ?? 'Reçu introuvable'}</p>
                <Button onClick={() => navigate(-1)}>Retour</Button>
            </div>
        </div>
    );

    const app = receipt.visaApplication;

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 print:bg-white print:p-0 print:py-0">

            {/* ── Boutons actions — masqués à l'impression ── */}
            <div className="max-w-xl mx-auto mb-4 flex items-center gap-3 print:hidden">
                <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="rounded-full">
                    <ArrowLeft className="w-4 h-4 mr-1" /> Retour
                </Button>
                <div className="flex-1" />
                <Button variant="outline" size="sm" onClick={handleDownload} className="rounded-full">
                    <Download className="w-4 h-4 mr-1" /> Télécharger CSV
                </Button>
                <Button variant="outline" size="sm" onClick={handlePrint} className="rounded-full">
                    <Printer className="w-4 h-4 mr-1" /> Imprimer
                </Button>
            </div>

            {/* ══════════════════════════════════════════════════════════════
                REÇU — design identique à la photo MAZADATI / SATIM I-PAY
            ══════════════════════════════════════════════════════════════ */}
            <div className="max-w-xl mx-auto bg-white border border-gray-200 rounded-2xl shadow-md overflow-hidden print:shadow-none print:rounded-none print:border-none">

                {/* ── En-tête ── */}
                <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <img src="/chart/LOGO_BOOKINGO.png" alt="BookinGO" className="h-7 w-auto object-contain mb-1.5" />
                        <p className="text-xs font-semibold text-gray-700">Reçu de paiement officiel</p>
                        <p className="text-[11px] text-gray-400">Powered by SATIM I-PAY</p>
                    </div>
                    <img src="/chart/SYMBOLE.png" alt="BookinGO" className="h-10 w-auto object-contain opacity-85" />
                </div>

                {/* ── Section paiement SATIM ── */}
                <div className="px-6 py-5 space-y-4">
                    <Row label="Identifiant SATIM"   value={receipt.satimIdentifiant  ?? '—'} mono />
                    <Row label="N° de commande"      value={receipt.satimOrderNumber  ?? '—'} mono />
                    <Row label="Code d'autorisation" value={receipt.satimApprovalCode ?? '—'} mono />

                    <div className="border-t border-dashed border-gray-200" />

                    <Row
                        label="Montant"
                        value={formatAmount(receipt.amount)}
                        valueClass="text-green-600 font-bold text-base"
                    />
                    <Row label="Mode de paiement" value="CIB/EDAHABIA" />
                    <Row
                        label="Statut"
                        value="Votre paiement a été accepté."
                        valueClass="text-green-600 font-semibold"
                    />
                    <Row label="Date / Heure" value={receipt.formattedDate ?? '—'} />

                    {receipt.receiptRef && (
                        <>
                            <div className="border-t border-dashed border-gray-200" />
                            <Row label="Référence BGV" value={receipt.receiptRef} mono bold />
                        </>
                    )}
                </div>

                {/* ── Séparateur ── */}
                <div className="border-t border-gray-100 mx-6" />

                {/* ── Détails de la demande ── */}
                <div className="px-6 py-5 space-y-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                        Détails de la demande
                    </p>
                    <Row label="Destination"    value={app.visaType.country.nameFr} />
                    <Row label="Type de visa"   value={app.visaType.nameFr} />
                    <Row label="Durée"          value={`${app.visaType.duration} jours`} />
                    <Row label="Date de départ" value={new Date(app.startDate).toLocaleDateString('fr-DZ')} />
                    <Row label="Voyageurs"      value={String(app.numberOfPeople)} />
                    <Row label="Email"          value={app.email} />
                    <Row label="Téléphone"      value={app.phone} />
                </div>

                {/* ── Séparateur ── */}
                <div className="border-t border-gray-100 mx-6" />

                {/* ── Voyageurs ── */}
                <div className="px-6 py-5 space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Voyageurs</p>
                    {app.passengers.map((p, i) => (
                        <div key={i} className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                            <div>
                                <p className="font-semibold text-sm text-gray-800">{p.firstName} {p.lastName}</p>
                                <p className="text-xs text-gray-400">{p.nationality}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-400">N° passeport</p>
                                <p className="font-mono text-sm font-semibold text-gray-700">{p.passportNumber}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Pied de page : logo + numéro vert ── */}
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                    <img src="/dhahabiaCIB.png" alt="CIB EDAHABIA" className="h-8 object-contain" />
                    <p className="text-xs text-gray-400 text-right">
                        En cas de problème, contactez<br />
                        le numéro vert SATIM :{' '}
                        <span className="inline-flex items-center gap-1">
                            <span className="font-bold text-green-600">3020</span>
                            <img src="/satim.png" alt="SATIM" className="h-5 object-contain inline" />
                        </span>
                    </p>
                </div>

                {/* ── Mention légale ── */}
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 text-center">
                    <p className="text-[11px] text-gray-400">
                        Reçu généré automatiquement · Référence {receipt.receiptRef} · {receipt.formattedDate}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                        Paiement sécurisé via SATIM I-PAY · SSL certifié
                    </p>
                </div>
            </div>

            {/* ── Styles impression ── */}
            <style>{`
                @media print {
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    @page { margin: 1cm; size: A4; }
                }
            `}</style>
        </div>
    );
};

// ── Sous-composant ligne ──────────────────────────────────────────────────────
const Row = ({
                 label, value, mono = false, bold = false, valueClass = '',
             }: {
    label:       string;
    value:       string;
    mono?:       boolean;
    bold?:       boolean;
    valueClass?: string;
}) => (
    <div className="flex items-start justify-between gap-6 text-sm">
        <span className="text-gray-500 shrink-0">{label}</span>
        <span className={[
            'text-right text-gray-800',
            mono  ? 'font-mono'  : '',
            bold  ? 'font-bold'  : 'font-medium',
            valueClass,
        ].filter(Boolean).join(' ')}>
            {value}
        </span>
    </div>
);

export default ReceiptPDF;