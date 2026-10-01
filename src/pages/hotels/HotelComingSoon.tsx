export function HotelComingSoon() {
    return (
        <div className="min-h-[85vh] flex flex-col items-center justify-center px-6 text-center py-16">
            {/* Logo */}
            <div className="mb-6">
                <span className="text-5xl font-extrabold text-[#0454E8]">
                    Bookin<span className="text-[#FFAA01]">GO</span>
                </span>
            </div>

            {/* Coming soon pill */}
            <div className="inline-flex items-center gap-2 bg-white rounded-full px-5 py-2.5 shadow-sm mb-8">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0454E8]" />
                <span className="text-[#0454E8] font-bold text-sm tracking-wide">COMING SOON</span>
            </div>

            {/* Heading */}
            <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight max-w-2xl mb-6">
                <span className="text-slate-900">Réservez votre séjour,</span>
                <br />
                <span className="text-[#FFAA01]">bientôt avec BookinGO</span>
            </h1>

            {/* Description */}
            <p className="text-slate-500 text-base sm:text-lg max-w-xl mb-10 leading-relaxed">
                Notre service de réservation d'hôtels arrive bientôt. Nous préparons une
                expérience simple, rapide et avantageuse pour vos prochains séjours.
            </p>

            {/* Dots progress */}
            <div className="flex items-center gap-3 mb-6">
                <span className="w-10 h-[2px] bg-[#B9D3FF] rounded-full" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#FFAA01]" />
                <span className="w-10 h-[2px] bg-[#B9D3FF] rounded-full" />
            </div>

            <p className="text-slate-400 text-sm">
                Une nouvelle façon de voyager arrive bientôt.
            </p>
        </div>
    );
}