import { useEffect } from 'react';
import {
    X, Search, Headphones, Mail,
    Plane, Luggage, CreditCard, Building2, Stamp,
    ChevronRight,
} from 'lucide-react';

interface HelpCategory {
    icon: React.ComponentType<{ className?: string }>;
    iconBg: string;
    iconColor: string;
    title: string;
    description: string;
}

const categories: HelpCategory[] = [
    {
        icon: Plane,
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
        title: 'Reservations & Billets',
        description: 'Gestion de vos reservations, modifications et billets d\'avion.',
    },
    {
        icon: CreditCard,
        iconBg: 'bg-amber-100',
        iconColor: 'text-amber-600',
        title: 'Paiements',
        description: 'Modes de paiement, remboursements et suivi de vos transactions.',
    },
    {
        icon: Luggage,
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
        title: 'Vols & Bagages',
        description: 'Informations sur les vols, bagages et conditions d\'embarquement.',
    },
    {
        icon: Building2,
        iconBg: 'bg-green-100',
        iconColor: 'text-green-600',
        title: 'Hotels',
        description: 'Reservations, annulations et informations sur vos hotels.',
    },
    {
        icon: Stamp,
        iconBg: 'bg-purple-100',
        iconColor: 'text-purple-600',
        title: 'Visas & eSIM',
        description: 'Demarches de visa, activation eSIM et assistance sur vos forfaits.',
    },
];

interface HelpCenterModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const HelpCenterModal = ({ isOpen, onClose }: HelpCenterModalProps) => {
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
                className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl relative"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    aria-label="Fermer"
                    className="absolute top-5 right-5 w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="px-6 md:px-10 pt-8 md:pt-10 pb-6">
                    {/* Header */}
                    <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                            <Headphones className="w-7 h-7 text-[#0B1E5C]" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-[#0B1E5C]">Centre d'aide</h2>
                            <p className="text-gray-500 mt-1">Trouvez rapidement les reponses a vos questions.</p>
                        </div>
                    </div>

                    {/* Search bar */}
                    <div className="relative mt-6">
                        <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Rechercher dans l'aide..."
                            className="w-full rounded-xl border border-gray-200 pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1E5C]/20 focus:border-[#0B1E5C]"
                        />
                    </div>

                    {/* Categories grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                        {categories.map((cat) => {
                            const Icon = cat.icon;
                            return (
                                <button
                                    key={cat.title}
                                    className="flex items-center justify-between gap-3 text-left bg-[#F3F6FB] hover:bg-[#EBF0FA] rounded-2xl px-5 py-4 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${cat.iconBg}`}>
                                            <Icon className={`w-5 h-5 ${cat.iconColor}`} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-[#0B1E5C] text-sm">{cat.title}</h3>
                                            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{cat.description}</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Bottom CTA */}
                <div
                    className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 md:px-10 py-5 rounded-b-3xl"
                    style={{ background: '#E3EAFB' }}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center shrink-0">
                            <Headphones className="w-5 h-5 text-[#0B1E5C]" />
                        </div>
                        <div>
                            <h3 className="font-bold text-[#0B1E5C] text-sm">Vous ne trouvez pas votre reponse ?</h3>
                            <p className="text-xs text-gray-600 mt-0.5">Notre equipe est disponible 24h/7j</p>
                        </div>
                    </div>
                    <button
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white text-sm shrink-0"
                        style={{ background: '#0B1E5C' }}
                    >
                        <Mail className="w-4 h-4" />
                        Nous contacter
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HelpCenterModal;