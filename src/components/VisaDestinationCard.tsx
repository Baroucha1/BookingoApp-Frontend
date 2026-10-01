import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { motion } from 'framer-motion';
import type { CountryGroup } from '../pages/visa/Destinations.tsx';

const countryPhotos: Record<string, string> = {
  tr: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=900&q=80',
  eg: 'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?w=900&q=80',
  jo: 'https://images.unsplash.com/photo-1518684079-3c830dcef090?w=900&q=80',
  az: 'https://images.unsplash.com/photo-1596386461350-326ccb383e9f?w=900&q=80',
  et: 'https://images.unsplash.com/photo-1523805009345-7448845a9e53?w=900&q=80',
  vn: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=900&q=80',
  om: 'https://images.unsplash.com/photo-1578895101408-1a36b834405b?w=900&q=80',
  id: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=900&q=80',
  am: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=900&q=80',
  uz: 'https://images.unsplash.com/photo-1602523498222-4d75d6a6aac0?w=900&q=80',
  qa: 'https://images.unsplash.com/photo-1563299796-17596ed6b017?w=900&q=80',
  th: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=900&q=80',
  ae: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=900&q=80',
  ma: 'https://images.unsplash.com/photo-1553244297-c7c4f2bb5fb1?w=900&q=80',
  sa: 'https://images.unsplash.com/photo-1586724237569-f3d0c1dee8c6?w=900&q=80',
  my: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=900&q=80',
  sg: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=900&q=80',
  ke: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=900&q=80',
  tn: 'https://images.unsplash.com/photo-1605216663980-b7ca6e9f2451?w=900&q=80',
};

const FALLBACK_PHOTO = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=900&q=80';

interface Props {
  group: CountryGroup;
  index?: number;
}

const VisaDestinationCard = ({ group, index = 0 }: Props) => {
  const { language, t } = useLanguage();
  const navigate = useNavigate();

  // ── Localized fields from the new CountryGroup shape ──────────────────────
  const name =
      language === 'ar' ? group.nameAr :
          language === 'fr' ? group.nameFr :
              group.nameEn;

  const desc =
      language === 'ar' ? group.country.descriptionAr :
          language === 'fr' ? group.country.descriptionFr :
              group.country.descriptionEn;

  // prefer uploaded hero, fall back to curated Unsplash, then generic fallback
  const photo =
      group.hero_url ??
      countryPhotos[group.code.toLowerCase()] ??
      FALLBACK_PHOTO;

  // flag: prefer uploaded, fall back to flagcdn
  const flagSrc =
      group.flag_url ??
      `https://flagcdn.com/w80/${group.code.toLowerCase()}.png`;

  // processing label
  const processingLabel =
      language === 'ar' ? 'المعالجة:' :
          language === 'fr' ? 'Traitement :' :
              'Processing:';

  const processingValue =
      group.processing_days < 1
          ? language === 'ar' ? 'أقل من 24 ساعة' : language === 'fr' ? '< 24 h' : '< 24 h'
          : language === 'ar' ? `${group.processing_days} أيام`
              : language === 'fr' ? `${group.processing_days} j`
                  :                     `${group.processing_days} days`;

  return (
      <motion.button
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5, delay: index * 0.05 }}
          onClick={() => navigate(`/apply?country=${group.code}`)}
          className="group relative h-72 rounded-2xl overflow-hidden text-left shadow-md hover:shadow-2xl transition-all duration-500 w-full"
      >
        <img
            src={photo}
            alt={name}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            loading="lazy"
        />

        {/* Resting gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent group-hover:opacity-0 transition-opacity duration-500" />

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 to-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Resting state: name pinned bottom-left */}
        <div className="absolute inset-x-0 bottom-0 p-5 group-hover:opacity-0 transition-opacity duration-300">
          <div className="flex items-center gap-2.5">
            <img src={flagSrc} alt="" className="w-8 h-8 rounded-full border-2 border-white object-cover shadow" />
            <h3 className="text-xl font-bold text-white drop-shadow">{name}</h3>
          </div>
        </div>

        {/* Hover content */}
        <div className="absolute inset-0 flex flex-col justify-end p-6 translate-y-3 group-hover:translate-y-0 transition-transform duration-500 pointer-events-none">
          <div className="flex items-center gap-3 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-75">
            <img src={flagSrc} alt="" className="w-9 h-9 rounded-full border-2 border-white object-cover shadow" />
            <h3 className="text-2xl font-bold text-white">{name}</h3>
          </div>

          {desc && (
              <p className="text-white/85 text-sm line-clamp-2 mb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                {desc}
              </p>
          )}

          <div className="flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-150">
            <div>
              <div className="text-white/60 text-[11px] uppercase tracking-wider">{t('startingFrom')}</div>
              <div className="text-white text-lg font-bold">
                {group.min_price.toLocaleString()} {group.currency}
              </div>
              <div className="text-white/70 text-[11px] mt-0.5">
                {processingLabel} {processingValue}
              </div>
            </div>
            <span onClick={() => navigate(`/apply?country=${group.code}`)} className="inline-flex items-center gap-1.5 bg-white text-primary text-xs font-semibold px-4 py-2 rounded-full pointer-events-auto">
            {t('applyNow')}
              <ArrowRight className="w-3.5 h-3.5" />
          </span>
          </div>
        </div>
      </motion.button>
  );
};

export default VisaDestinationCard;