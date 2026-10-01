import { Button } from '@/components/ui/button';
import { useLanguage } from '@/i18n/LanguageContext';

const texts = {
    fr: {
        title: "Inscrivez-vous et profitez d'offres exclusives !",
        desc: "Recevez nos meilleures offres et promotions directement dans votre boîte mail.",
        placeholder: "Votre adresse e-mail",
        button: "S'inscrire",
    },
    en: {
        title: "Sign up and enjoy exclusive offers!",
        desc: "Receive our best deals and promotions directly in your inbox.",
        placeholder: "Your email address",
        button: "Subscribe",
    },
    ar: {
        title: "اشترك واستمتع بعروض حصرية!",
        desc: "احصل على أفضل العروض والخصومات مباشرة في بريدك الإلكتروني.",
        placeholder: "عنوان بريدك الإلكتروني",
        button: "اشتراك",
    },
};

export const NewsletterBanner = () => {
    const { language } = useLanguage();
    const t = texts[language] || texts.fr;

    return (
        <section className="max-w-6xl mx-auto px-4 mt-16">
            <div
                className="relative rounded-2xl border-2 border-[#F5A623] px-6 py-8 md:px-10 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #071A3D, #0B2A5C)' }}
            >
                {/* Background image */}
                <img
                    src="/assets/home/newsletter.webp"
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                />

                {/* Text */}
                <div className="relative z-10 text-center md:text-left rtl:md:text-right max-w-md">
                    <h3 className="text-white text-lg md:text-xl font-bold mb-1.5">
                        {t.title}
                    </h3>
                    <p className="text-white/80 text-sm">
                        {t.desc}
                    </p>
                </div>

                {/* Merged input + button */}
                <form className="relative z-10 flex items-center w-full md:w-auto max-w-md bg-white rounded-xl shrink-0 overflow-hidden">
                    <input
                        type="email"
                        placeholder={t.placeholder}
                        className="flex-1 min-w-0 bg-transparent px-4 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400"
                    />
                    <Button
                        type="submit"
                        className="rounded-none px-6 font-semibold shrink-0"
                        style={{ background: '#F5A623', color: '#0B2A5C' }}
                    >
                        {t.button}
                    </Button>
                </form>
            </div>
        </section>
    );
};

export default NewsletterBanner;