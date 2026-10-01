import { Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

const CancellationPolicyPage = () => {
    const { t } = useLanguage();
    const policyParagraphs = t('cancellationPolicyText').split(/\n{2,}/);

    return (
        <main className="min-h-screen bg-[#F3F6FB] px-4 py-10 sm:px-6 sm:py-14">
            <div className="mx-auto max-w-4xl">
                <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[#0865FE] hover:underline">
                    <ArrowLeft className="h-4 w-4" />
                    {t('applyBack')}
                </Link>

                <header className="mb-6 border-b border-slate-200 pb-5">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-[#0865FE]">
                        <FileText className="h-5 w-5" />
                    </div>
                    <h1 className="text-2xl font-bold text-[#0B1E5C] sm:text-3xl">
                        {t('assistanceCancellationTitle')}
                    </h1>
                    <p className="mt-2 text-sm text-slate-600">{t('cancellationPolicySubtitle')}</p>
                </header>

                <article className="space-y-5 rounded-lg border border-slate-200 bg-white p-5 text-sm leading-7 text-slate-700 sm:p-8">
                    {policyParagraphs.map((paragraph, index) => (
                        <p key={index} className="whitespace-pre-line">
                            {paragraph}
                        </p>
                    ))}
                </article>
            </div>
        </main>
    );
};

export default CancellationPolicyPage;