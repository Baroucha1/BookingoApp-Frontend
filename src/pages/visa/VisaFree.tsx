import { ArrowLeft, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '@/i18n/LanguageContext.tsx';
import { visaFreeCountries } from '@/data/countries.ts';

const VisaFree = () => {
  const { t, language } = useLanguage();

  return (
    <div className="container py-10 max-w-2xl">
      <Link to="/destinations" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4" />
      </Link>
      <h1 className="text-3xl font-bold mb-2">{t('visaFreeCountries')}</h1>
      <p className="text-muted-foreground mb-6">{t('visaFreeDesc')}</p>

      <div className="flex items-start gap-3 bg-primary/5 border border-primary/20 rounded-xl p-4 mb-8">
        <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
        <p className="text-sm">
          {t('passportMustBeValid')} <strong>{t('sixMonths')}</strong> {t('fromTravelDate')}
        </p>
      </div>

      <div className="space-y-1">
        {visaFreeCountries.map((c, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: language === 'ar' ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-4 p-4 rounded-xl hover:bg-muted transition-colors"
          >
            <span className="text-3xl">{c.flag}</span>
            <div className="flex-1">
              <p className="font-semibold">{c.name[language]}</p>
              <p className="text-sm text-muted-foreground">{c.days} {t('days')}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default VisaFree;
