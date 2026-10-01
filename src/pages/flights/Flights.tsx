import { Hero } from '@/components/flights/indexPage/Hero.tsx';
import { ServiceCards } from '@/components/home/ServiceCards';
import { Partners } from '@/components/home/Partners';

const FlightPage = () => {
    return (
        <div className="min-h-screen bg-transparent">
            <Hero />
            {/* Seamless gradient starting right where the hero illustration ends */}
            <div className="bg-gradient-to-b from-[#DFECFF] via-[#F0F6FF] to-[#DFECFF] pt-2 pb-12">
                <ServiceCards />
                <Partners />
            </div>
        </div>
    );
};

export default FlightPage;