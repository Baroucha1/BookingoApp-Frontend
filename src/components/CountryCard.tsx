import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import type { Country } from '@/data/countries';
import { motion } from 'framer-motion';

interface CountryCardProps {
  country: Country;
  index?: number;
}

const CountryCard = ({ country, index = 0 }: CountryCardProps) => {
  const { t, language } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
    >
      <Link
        to={`/destination/${country.slug}`}
        className="group block rounded-xl overflow-hidden bg-card border shadow-sm hover:shadow-lg transition-all duration-300"
      >
        <div className="relative h-44 overflow-hidden">
          <img
            src={country.image}
            alt={country.name[language]}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute top-3 start-3 text-3xl">{country.flag}</div>
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-foreground/60 to-transparent p-3">
            <span className="text-sm font-medium text-background bg-primary/90 px-2.5 py-1 rounded-full">
              {country.price.toLocaleString()} DA
            </span>
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-lg">{country.name[language]}</h3>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {country.description[language]}
          </p>
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-muted-foreground">
              {t('electronicVisa')} • {country.stayDuration} {t('days')}
            </span>
            <ArrowRight className="w-4 h-4 text-primary group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default CountryCard;
