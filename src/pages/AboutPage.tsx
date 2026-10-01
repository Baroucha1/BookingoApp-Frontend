import { Link } from 'react-router-dom';
import { Package, Users, Laptop, User, ArrowRight } from 'lucide-react';

const timeline = [
    {
        year: '1989',
        icon: Package,
        text: 'Fondation de l\'agence El Kawther par M. Mahmoud Lichani. Spécialisation dans le Hajj et la Omra.',
    },
    {
        year: '2013',
        icon: Users,
        text: 'Après le décès d\'Elhaj Mahmoud, ses deux fils, Mohamed et Youcef, reprennent l\'entreprise familiale et la modernisent.',
    },
    {
        year: '2019',
        icon: Laptop,
        text: 'Lancement de la plateforme BookinGO, d\'abord en B2B (pour les professionnels).',
    },
    {
        year: '2024',
        icon: User,
        text: 'Ouverture de BookinGO directement aux particuliers (B2C).',
    },
];

const AboutPage = () => {
    return (
        <div className="min-h-screen bg-white overflow-hidden">

            {/* ── Hero ── */}
            <section className="relative">
                <div className="relative">
                    <img
                        src="/cover.png"
                        alt="BookinGO — voyageuse"
                        className="w-full h-[420px] md:h-[560px] object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-white/70 via-white/20 to-transparent" />

                    <div className="absolute inset-0 flex items-center">
                        <div className="max-w-7xl mx-auto px-6 md:px-10 w-full">
                            <div className="max-w-xl">
                                <p className="text-sm font-bold text-[#0865FE] tracking-wider">
                                    À PROPOS DE BOOKINGO
                                </p>
                                <h1 className="text-3xl md:text-5xl font-extrabold text-[#0B1E5C] mt-3 leading-[1.2]">
                                    Plus qu'une plateforme, une histoire humaine et une{' '}
                                    <span className="italic font-serif text-[#0865FE]">vision</span> tournée vers l'avenir
                                </h1>
                                <p className="text-gray-600 mt-5 leading-relaxed text-base">
                                    BookinGO est la plateforme digitale d'El Kawther Voyages, conçue
                                    pour simplifier chaque étape de votre voyage.{' '}
                                    <Link to="/flights" className="font-semibold text-[#0865FE] hover:underline">
                                        Vols
                                    </Link>
                                    ,{' '}
                                    <Link to="/hotels" className="font-semibold text-[#0865FE] hover:underline">
                                        hôtels
                                    </Link>
                                    ,{' '}
                                    <Link to="/visa" className="font-semibold text-[#0865FE] hover:underline">
                                        visas électroniques
                                    </Link>
                                    {' '}et{' '}
                                    <Link to="/esim" className="font-semibold text-[#0865FE] hover:underline">
                                        eSIM
                                    </Link>
                                    {' '}: réservez tout au même endroit, suivez vos demandes en
                                    temps réel et bénéficiez d'un accompagnement personnalisé à
                                    chaque étape. Que vous soyez un voyageur individuel ou une
                                    agence professionnelle, nous mettons le monde à portée de
                                    clic, avec la fiabilité d'une agence qui accompagne les
                                    voyageurs depuis plus de 35 ans.
                                </p>
                                <div className="w-14 h-1 mt-5 rounded-full" style={{ background: '#FFB400' }} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="w-full leading-none -mb-1">
                    <svg viewBox="0 0 1440 100" className="w-full h-[60px] md:h-[90px]" preserveAspectRatio="none">
                        <path
                            d="M0,50 C360,10 1080,90 1440,40 L1440,100 L0,100 Z"
                            fill="#EAF1FF"
                        />
                    </svg>
                </div>
            </section>

            {/* ── Histoire — texte + timeline superposés sur hadj.png ── */}
            <section className="relative bg-[#EAF1FF]">
                <img
                    src="/hadj.png"
                    alt="Une expertise qui traverse les générations"
                    className="w-full h-auto min-h-[900px] md:min-h-[720px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#EAF1FF] via-[#EAF1FF]/90 md:via-[#EAF1FF]/80 to-transparent" />

                <div className="absolute inset-0 py-10 md:py-16 overflow-y-auto">
                    <div className="max-w-7xl mx-auto px-6 md:px-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">

                        {/* Texte */}
                        <div>
                            <p className="text-sm font-bold text-[#0865FE] tracking-wider">
                                L'HISTOIRE DE NOTRE AGENCE
                            </p>
                            <h2 className="text-3xl md:text-4xl font-extrabold text-[#0B1E5C] mt-3 leading-tight">
                                De la tradition<br />
                                à l'<span className="italic font-serif text-[#0865FE]">innovation</span>
                            </h2>

                            <p className="text-gray-600 mt-5 leading-relaxed text-base">
                                Fondée en 1989 par M. Mahmoud Lichani, l'agence El Kawther
                                s'est d'abord spécialisée dans le Hajj et la Omra, avant de
                                diversifier son offre vers de nouvelles destinations.
                            </p>
                            <p className="text-gray-600 mt-3 leading-relaxed text-base">
                                Après le décès d'Elhaj Mahmoud en 2013, ses deux fils, Mohamed
                                et Youcef, ont repris le flambeau en modernisant l'entreprise
                                familiale.
                            </p>
                            <p className="text-gray-600 mt-3 leading-relaxed text-base">
                                En 2019, ils franchissent une nouvelle étape avec le lancement
                                de la plateforme BookinGO, d'abord dédiée aux professionnels
                                (B2B), puis ouverte directement aux particuliers (B2C) en 2024.
                            </p>

                            <p className="italic font-serif text-[#0865FE] font-medium mt-5 text-base">
                                Une même passion : vous accompagner, partout dans le monde.
                            </p>
                            <div className="w-14 h-1 mt-4 rounded-full" style={{ background: '#FFB400' }} />
                        </div>

                        {/* Timeline compacte, ligne pointillée fine */}
                        <div className="relative px-2 md:px-4">
                            <div
                                className="absolute left-[17px] top-3 bottom-3 border-l border-dotted"
                                style={{ borderColor: '#0865FE99', borderLeftWidth: '1.5px' }}
                            />
                            <div className="flex flex-col gap-7 relative">
                                {timeline.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <div key={item.year} className="flex items-start gap-4 relative">
                                            <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shrink-0 z-10 shadow-sm">
                                                <Icon className="w-4 h-4 text-[#0865FE]" strokeWidth={2.2} />
                                            </div>
                                            <div className="pt-0.5">
                                                <p className="font-extrabold text-[#0B1E5C] text-base">{item.year}</p>
                                                <p className="text-sm text-gray-600 leading-relaxed mt-1 max-w-[240px]">
                                                    {item.text}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Elkawther Voyages — texte superposé sur kawther.png, arc en haut ── */}
            <section className="relative">
                <div className="relative">
                    <img
                        src="/kawther.png"
                        alt="L'agence Elkawther, la force derrière BookinGO"
                        className="w-full h-[420px] md:h-[520px] object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />

                    {/* Arc en haut de la photo — même couleur que le fond de la section précédente */}
                    <div className="absolute top-0 left-0 right-0 leading-none">
                        <svg viewBox="0 0 1440 80" className="w-full h-[40px] md:h-[70px]" preserveAspectRatio="none">
                            <path
                                d="M0,0 L0,40 C360,80 1080,0 1440,40 L1440,0 Z"
                                fill="#EAF1FF"
                            />
                        </svg>
                    </div>

                    <div className="absolute inset-0 flex items-center pt-8 md:pt-0">
                        <div className="max-w-7xl mx-auto px-6 md:px-10 w-full">
                            <div className="max-w-lg">
                                <h2 className="text-2xl md:text-4xl font-extrabold text-white leading-tight">
                                    L'agence Elkawther,<br />
                                    la force derrière Bookin<span style={{ color: '#FFB400' }}>GO</span>
                                </h2>
                                <div className="w-14 h-1 mt-4 rounded-full" style={{ background: '#FFB400' }} />

                                <p className="text-white/90 mt-5 leading-relaxed text-base max-w-md">
                                    Derrière la plateforme BookinGO, il y a l'agence Elkawther
                                    Voyages, une équipe passionnée et expérimentée, qui vous
                                    accompagne depuis plus de 35 ans dans tous vos projets de
                                    voyage.
                                </p>

                                <button className="inline-flex items-center gap-2 mt-6 bg-white text-[#0B1E5C] font-semibold text-sm px-6 py-3 rounded-full hover:bg-gray-100 transition-colors">
                                    Découvrir Elkawther Voyages
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default AboutPage;