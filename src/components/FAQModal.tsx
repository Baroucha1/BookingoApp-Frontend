import { useEffect, useState } from 'react';
import {
    X, Search, User, Calendar, CreditCard, RotateCcw,
    Briefcase, Wifi, Stamp, Building2, MoreHorizontal,
    ChevronDown, Mail, Send,
} from 'lucide-react';

interface FaqCategory {
    id: string;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
}

const faqCategories: FaqCategory[] = [
    { id: 'account', icon: User, label: 'Compte & Inscription' },
    { id: 'bookings', icon: Calendar, label: 'Reservations' },
    { id: 'payments', icon: CreditCard, label: 'Paiements' },
    { id: 'cancellation', icon: RotateCcw, label: 'Annulation & Remboursement' },
    { id: 'flights', icon: Briefcase, label: 'Vols & Bagages' },
    { id: 'esim', icon: Wifi, label: 'eSIM' },
    { id: 'visas', icon: Stamp, label: 'Visas' },
    { id: 'hotels', icon: Building2, label: 'Hotels' },
    { id: 'other', icon: MoreHorizontal, label: 'Autres questions' },
];

interface FaqEntry {
    question: string;
    answer: string;
}

const faqByCategory: Record<string, FaqEntry[]> = {
    account: [
        { question: 'Comment creer un compte sur BookinGO ?', answer: "Cliquez sur \"Connexion\" en haut de la page, puis \"Creer un compte\". Renseignez votre email et un mot de passe pour finaliser votre inscription." },
        { question: 'Comment reserver un billet d\'avion ?', answer: "Rendez-vous sur la page Vols, renseignez votre trajet et vos dates, puis choisissez l'offre qui vous convient et suivez les etapes de paiement." },
        { question: 'Quels sont les moyens de paiement acceptes ?', answer: "Nous acceptons les cartes CIB, le paiement en especes a la livraison, ainsi que le paiement a la livraison selon les services." },
        { question: 'Comment modifier ou annuler une reservation ?', answer: "Rendez-vous dans votre espace client, section \"Mes reservations\", puis selectionnez la reservation concernee pour la modifier ou l'annuler." },
        { question: 'Quand recevrai-je ma confirmation de reservation ?', answer: "La confirmation est envoyee par email immediatement apres validation du paiement." },
        { question: 'Comment fonctionne l\'assurance voyage ?', answer: "L'assurance voyage peut etre ajoutee lors de la reservation et couvre les annulations, retards et incidents medicaux selon la formule choisie." },
    ],
};

interface FAQModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const FAQModal = ({ isOpen, onClose }: FAQModalProps) => {
    const [activeCategory, setActiveCategory] = useState('account');
    const [openQuestion, setOpenQuestion] = useState<number | null>(null);
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (!isOpen) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKey);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handleKey);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const entries = faqByCategory[activeCategory] || [];
    const activeCat = faqCategories.find((c) => c.id === activeCategory);
    const filteredEntries = search.trim()
        ? entries.filter((e) => e.question.toLowerCase().includes(search.toLowerCase()))
        : entries;

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-4"
            style={{ 
                background: 'rgba(15, 23, 42, 0.55)',
                paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1.5rem)',
                paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1.5rem)',
            }}
            onClick={onClose}
        >
            <div
                className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl relative flex flex-col md:flex-row overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    aria-label="Fermer"
                    className="absolute top-5 right-5 w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors z-10"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* ── Sidebar ── */}
                <div className="w-full md:w-64 shrink-0 border-b md:border-b-0 md:border-r border-gray-100 px-6 pt-8 pb-6 flex flex-col">
                    <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                            <Send className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-[#0B1E5C]">FAQ</h2>
                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                Trouvez rapidement les reponses a vos questions.
                            </p>
                        </div>
                    </div>

                    <nav className="mt-6 flex flex-col gap-1">
                        {faqCategories.map((cat) => {
                            const Icon = cat.icon;
                            const isActive = cat.id === activeCategory;
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => {
                                        setActiveCategory(cat.id);
                                        setOpenQuestion(null);
                                    }}
                                    className={`flex items-center gap-3 text-left px-3 py-2.5 rounded-lg text-sm transition-colors border-l-2 ${
                                        isActive
                                            ? 'bg-blue-50 border-[#0B1E5C] text-[#0B1E5C] font-semibold'
                                            : 'border-transparent text-gray-500 hover:bg-gray-50'
                                    }`}
                                >
                                    <Icon className="w-4 h-4 shrink-0" />
                                    <span>{cat.label}</span>
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* ── Content ── */}
                <div className="flex-1 flex flex-col min-w-0">
                    <div className="px-6 md:px-8 pt-8 pb-4">
                        <div className="relative">
                            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Rechercher une question..."
                                className="w-full rounded-xl border border-gray-200 pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1E5C]/20 focus:border-[#0B1E5C]"
                            />
                        </div>

                        <h3 className="text-lg font-bold text-[#0B1E5C] mt-6">Questions frequentes</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            Retrouvez ici les reponses aux questions les plus posees par nos utilisateurs.
                        </p>
                    </div>

                    <div className="px-6 md:px-8 pb-4 flex-1 overflow-y-auto max-h-[360px]">
                        <div className="flex flex-col gap-3">
                            {filteredEntries.length === 0 && (
                                <p className="text-sm text-gray-400 py-6 text-center">
                                    Aucune question ne correspond a votre recherche.
                                </p>
                            )}
                            {filteredEntries.map((entry, index) => {
                                const isOpenQ = openQuestion === index;
                                return (
                                    <div
                                        key={entry.question}
                                        className="border border-gray-100 rounded-xl overflow-hidden"
                                    >
                                        <button
                                            onClick={() => setOpenQuestion(isOpenQ ? null : index)}
                                            className="w-full flex items-center justify-between gap-3 text-left px-5 py-4 bg-white hover:bg-gray-50 transition-colors"
                                        >
                                            <span className="font-semibold text-sm text-[#0B1E5C]">{entry.question}</span>
                                            <ChevronDown
                                                className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${isOpenQ ? 'rotate-180' : ''}`}
                                            />
                                        </button>
                                        {isOpenQ && (
                                            <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed">
                                                {entry.answer}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Bottom CTA */}
                    <div
                        className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 md:px-8 py-5"
                        style={{ background: '#E3EAFB' }}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center shrink-0">
                                <Mail className="w-5 h-5 text-[#0B1E5C]" />
                            </div>
                            <div>
                                <h3 className="font-bold text-[#0B1E5C] text-sm">Vous n'avez pas trouve la reponse ?</h3>
                                <p className="text-xs text-gray-600 mt-0.5">
                                    Notre equipe est disponible 24h/7j pour vous accompagner.
                                </p>
                            </div>
                        </div>
                        <button
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white text-sm shrink-0"
                            style={{ background: '#0B1E5C' }}
                        >
                            <Mail className="w-4 h-4" />
                            Nous contacter
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FAQModal;