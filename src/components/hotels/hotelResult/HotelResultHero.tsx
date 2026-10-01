interface HotelResultsHeroProps {
    title?: string;
    subtitle?: string;
    imageSrc?: string;
}

export default function HotelResultsHero({
                                             title = "Trouvez l'hôtel idéal",
                                             subtitle = "Des milliers d'hôtels dans le monde, au meilleur prix",
                                             imageSrc = '/assets/hotels/result.png',
                                         }: HotelResultsHeroProps) {
    return (
        <section className="relative h-40 sm:h-48 md:h-56 overflow-hidden">
            <img src={imageSrc} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/5 to-[#DFECFF] z-10" />
            <div className="relative z-20 max-w-6xl mx-auto px-4 sm:px-6 h-full flex flex-col justify-center">
                <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow">{title}</h1>
                <p className="text-white/90 text-xs sm:text-sm mt-1 drop-shadow">{subtitle}</p>
            </div>
        </section>
    );
}