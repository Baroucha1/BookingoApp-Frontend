import { Button } from '@/components/ui/button';
import { useLanguage } from '@/i18n/LanguageContext';

export const NewsletterBanner = () => {
    const { t } = useLanguage();

    return (
        <section className="max-w-6xl mx-auto px-4 mt-16">
            <div
                className="relative rounded-2xl  px-6 py-8 md:px-10 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #071A3D, #0B2A5C)' }}
            >
                {/* Background image */}
                <img
                    src="/assets/hotels/newsletterhotel.png"
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                />


                {/* Text */}
                <div className="relative z-10 text-center md:text-left max-w-md">
                    <h3 className="text-white text-lg md:text-xl font-bold mb-1.5">
                        {t('hotelNewsletterTitle')}
                    </h3>
                    <p className="text-[#002161] text-sm">
                        {t('hotelNewsletterDescription')}
                    </p>
                </div>

                {/* Merged input + button */}
                <form className="relative z-10 flex items-center w-full md:w-auto max-w-md bg-white rounded-xl  shrink-0">
                    <input
                        type="email"
                        placeholder={t('hotelEmailPlaceholder')}
                        className="flex-1 min-w-0 bg-transparent px-4 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400"
                    />
                    <Button
                        type="submit"
                        className="rounded-r-xl  px-6 font-semibold shrink-0"
                        style={{ background: '#F5A623', color: '#0B2A5C' }}
                    >
                        {t('hotelSubscribe')}
                    </Button>
                </form>
            </div>
        </section>
    );
};

export default NewsletterBanner;