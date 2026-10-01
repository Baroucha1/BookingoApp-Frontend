import { useEffect, useState } from 'react';
import {
    Phone, Mail, MessageCircle, MapPin, ChevronRight,
    User, Send, Facebook, Instagram, X, Youtube, Linkedin,
    Headphones, Smartphone, Clock, Building2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';

const API = import.meta.env.VITE_API_URL;

const Anchor = 'a';

const phoneNumbers = [
    '0563 02 96 00',
    '0563 02 96 01',
    '0563 02 96 03',
    '0563 02 96 04',
];

const contactMethods = [
    {
        icon: Smartphone,
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
        kind: 'app',
        titleKey: 'contactAppTitle',
        lineKeys: ['contactAppAvailability', 'contactAppDescription'],
        href: '#',
    },
    {
        icon: Phone,
        iconBg: 'bg-green-100',
        iconColor: 'text-green-600',
        kind: 'phone',
        titleKey: 'contactPhoneTitle',
        lineKeys: ['contactPhoneAvailability'],
        href: `tel:+213${phoneNumbers[0].replace(/\s/g, '').slice(1)}`,
    },
    {
        icon: Mail,
        iconBg: 'bg-purple-100',
        iconColor: 'text-purple-600',
        kind: 'email',
        titleKey: 'contactEmailTitle',
        lineKeys: ['contactEmailResponse'],
        href: 'mailto:info@bookingo.app',
    },
    {
        icon: Clock,
        iconBg: 'bg-amber-100',
        iconColor: 'text-amber-600',
        kind: 'hours',
        titleKey: 'contactHoursTitle',
        lineKeys: ['contactHoursWeekdays', 'contactHoursFriday'],
        href: undefined,
    },
] as const;

const socials = [
    { label: 'Facebook', Icon: Facebook, href: '#' },
    { label: 'Instagram', Icon: Instagram, href: '#' },
    { label: 'X', Icon: X, href: '#' },
    { label: 'YouTube', Icon: Youtube, href: '#' },
    { label: 'LinkedIn', Icon: Linkedin, href: '#' },
];

const subjects = [
    { value: 'Reservation & Billets', labelKey: 'contactSubjectReservations' },
    { value: 'Paiements', labelKey: 'contactSubjectPayments' },
    { value: 'Annulation / Remboursement', labelKey: 'contactSubjectCancellation' },
    { value: 'Vols & Bagages', labelKey: 'contactSubjectFlights' },
    { value: 'eSIM', labelKey: 'contactSubjectEsim' },
    { value: 'Visas', labelKey: 'contactSubjectVisas' },
    { value: 'Hotels', labelKey: 'contactSubjectHotels' },
    { value: 'Autre', labelKey: 'contactSubjectOther' },
] as const;

interface Office {
    name: string;
    wilaya: string;
    subtitle?: string;
    isHeadOffice?: boolean;
    mapsUrl: string;
}

const ContactPage = () => {
    const { t } = useLanguage();
    const [form, setForm] = useState({
        subject: '',
        name: '',
        email: '',
        phone: '',
        message: '',
    });
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [offices, setOffices] = useState<Office[]>([]);

    useEffect(() => {
        let cancelled = false;
        fetch(`${API}/api/contact/offices`)
            .then((res) => {
                if (!res.ok) throw new Error('Failed to load offices');
                return res.json() as Promise<Office[]>;
            })
            .then((data) => {
                if (!cancelled) setOffices(data);
            })
            .catch((error) => console.error('[ContactPage] offices:', error));

        return () => {
            cancelled = true;
        };
    }, []);

    const handleChange = (field: keyof typeof form) => (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        try {
            const res = await fetch(`${API}/api/contact`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            if (!res.ok) throw new Error('Request failed');
            setStatus('success');
            setForm({ subject: '', name: '', email: '', phone: '', message: '' });
        } catch (err) {
            console.error(err);
            setStatus('error');
        }
    };

    return (
        <div className="min-h-screen bg-[#F3F6FB]">

            {/* ── Hero ── */}
            <section className="relative overflow-hidden">
                <img
                    src="/contact.png"
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-white via-white/70 to-transparent" />

                <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 py-16 md:py-20">
                    <p className="text-sm font-semibold text-[#0B1E5C] flex items-center gap-1">
                        <Mail className="w-4 h-4" /> {t('contactHeroEyebrow')}
                    </p>
                    <h1 className="text-3xl md:text-5xl font-extrabold text-[#0B1E5C] mt-2 leading-tight">
                        {t('contactHeroTitle')}
                    </h1>
                    <p className="text-gray-600 mt-4 max-w-md leading-relaxed">
                        {t('contactHeroDescription')}
                    </p>
                    <div className="w-14 h-1 mt-5 rounded-full" style={{ background: '#FFB400' }} />
                </div>
            </section>

            {/* ── Coordonnees + Formulaire ── */}
            <section className="max-w-7xl mx-auto px-6 md:px-10 py-12 md:py-16">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* Coordonnees */}
                    <div>
                        <p className="text-sm font-semibold text-[#0B1E5C] flex items-center gap-1">
                            <MapPin className="w-4 h-4" /> {t('contactDetailsEyebrow')}
                        </p>
                        <h2 className="text-2xl md:text-3xl font-extrabold text-[#0B1E5C] mt-2">
                            {t('contactDetailsTitle')}
                        </h2>
                        <p className="text-gray-500 mt-3 max-w-md leading-relaxed">
                            {t('contactDetailsDescription')}
                        </p>

                        <div className="flex flex-col gap-4 mt-6">
                            {contactMethods.map((method) => {
                                const Icon = method.icon;
                                const Wrapper = method.href ? Anchor : 'div';
                                const wrapperProps = method.href ? { href: method.href } : {};
                                return (
                                    <Wrapper
                                        key={method.titleKey}
                                        {...wrapperProps}
                                        className={`flex items-center justify-between gap-4 bg-white rounded-2xl px-6 py-5 shadow-sm ${method.href ? 'hover:shadow-md transition-shadow' : ''}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${method.iconBg}`}>
                                                <Icon className={`w-5 h-5 ${method.iconColor}`} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-[#0B1E5C]">{t(method.titleKey)}</h3>
                                                {method.kind === 'phone' ? (
                                                    <>
                                                        <p className="text-sm mt-0.5 text-gray-500">{t(method.lineKeys[0])}</p>
                                                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                                                            {phoneNumbers.map((num) => (
                                                                <span key={num} className="text-sm text-[#0B1E5C] font-semibold">
                                  {num}
                                </span>
                                                            ))}
                                                        </div>
                                                    </>
                                                ) : (
                                                    method.lineKeys.map((lineKey, i) => (
                                                        <p
                                                            key={i}
                                                            className={`text-sm mt-0.5 ${i === method.lineKeys.length - 1 && method.kind !== 'email' ? 'text-[#0B1E5C] font-semibold' : 'text-gray-500'}`}
                                                        >
                                                            {t(lineKey)}
                                                        </p>
                                                    ))
                                                )}
                                                {method.kind === 'email' && (
                                                    <p className="text-sm mt-0.5 text-[#0B1E5C] font-semibold">info@bookingo.app</p>
                                                )}
                                            </div>
                                        </div>
                                        {method.href && <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />}
                                    </Wrapper>
                                );
                            })}
                        </div>

                        <p className="font-semibold text-[#0B1E5C] mt-8 mb-3">{t('contactFollowUs')}</p>
                        <div className="flex items-center gap-3">
                            {socials.map((s) => (
                                <Anchor
                                    key={s.label}
                                    href={s.href}
                                    aria-label={s.label}
                                    className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110 text-[#0B1E5C]"
                                    style={{ background: 'rgba(11,30,92,0.08)' }}
                                >
                                    <s.Icon className="w-4 h-4" strokeWidth={2} />
                                </Anchor>
                            ))}
                        </div>
                    </div>

                    {/* Formulaire */}
                    <div className="bg-white rounded-3xl shadow-sm p-6 md:p-8">
                        <h3 className="text-xl font-bold text-[#0B1E5C]">{t('contactFormTitle')}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            {t('contactFormDescription')}
                        </p>

                        <form onSubmit={handleSubmit} className="flex flex-col gap-5 mt-6">
                            <div>
                                <label className="text-sm font-semibold text-[#0B1E5C]">
                                    {t('contactSubjectLabel')}
                                </label>
                                <select
                                    value={form.subject}
                                    onChange={handleChange('subject')}
                                    className="w-full mt-2 rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#0B1E5C]/20 focus:border-[#0B1E5C] bg-white"
                                >
                                    <option value="">{t('contactSubjectPlaceholder')}</option>
                                    {subjects.map((subject) => (
                                        <option key={subject.value} value={subject.value}>{t(subject.labelKey)}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-[#0B1E5C] flex items-center gap-1">
                                    <User className="w-4 h-4" /> {t('contactNameLabel')}
                                </label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={handleChange('name')}
                                    placeholder={t('contactNamePlaceholder')}
                                    className="w-full mt-2 rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1E5C]/20 focus:border-[#0B1E5C]"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-[#0B1E5C] flex items-center gap-1">
                                    <Mail className="w-4 h-4" /> {t('contactEmailLabel')}
                                </label>
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={handleChange('email')}
                                    placeholder={t('contactEmailPlaceholder')}
                                    className="w-full mt-2 rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1E5C]/20 focus:border-[#0B1E5C]"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-[#0B1E5C] flex items-center gap-1">
                                    <Phone className="w-4 h-4" /> {t('contactPhoneLabel')}
                                </label>
                                <input
                                    type="tel"
                                    value={form.phone}
                                    onChange={handleChange('phone')}
                                    placeholder={t('contactPhonePlaceholder')}
                                    className="w-full mt-2 rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1E5C]/20 focus:border-[#0B1E5C]"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-[#0B1E5C]">{t('contactMessageLabel')}</label>
                                <textarea
                                    value={form.message}
                                    onChange={handleChange('message')}
                                    placeholder={t('contactMessagePlaceholder')}
                                    rows={4}
                                    className="w-full mt-2 rounded-xl border border-gray-200 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#0B1E5C]/20 focus:border-[#0B1E5C]"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={status === 'loading'}
                                className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                                style={{ background: '#0B1E5C' }}
                            >
                                <Send className="w-4 h-4" />
                                {status === 'loading' ? t('contactSending') : t('contactSend')}
                            </button>

                            {status === 'success' && (
                                <p className="text-sm text-green-600 font-semibold text-center">
                                    {t('contactSuccess')}
                                </p>
                            )}
                            {status === 'error' && (
                                <p className="text-sm text-red-600 font-semibold text-center">
                                    {t('contactError')}
                                </p>
                            )}
                        </form>
                    </div>
                </div>
            </section>

            {/* ── Nos bureaux ── */}
            <section className="max-w-7xl mx-auto px-6 md:px-10 py-4">
                <div className="bg-white rounded-3xl shadow-sm p-6 md:p-8">
                    <p className="text-sm font-semibold text-[#0B1E5C] flex items-center gap-1">
                        <Building2 className="w-4 h-4" /> {t('contactOfficesEyebrow')}
                    </p>
                    <h3 className="text-xl md:text-2xl font-extrabold text-[#0B1E5C] mt-2">
                        {t('contactOfficesTitle')}
                    </h3>
                    <p className="text-sm text-gray-500 mt-2 max-w-lg leading-relaxed">
                        {t('contactOfficesDescription')}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                        {offices.map((office) => (
                            <Anchor
                                key={`${office.name}-${office.wilaya}`}
                                href={office.mapsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`${t('contactViewOfficeOnMaps')} ${office.name}`}
                                className={`flex items-start gap-3 rounded-2xl px-5 py-4 border transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer ${
                                    office.isHeadOffice
                                        ? 'border-[#FFB400] bg-amber-50 hover:border-amber-400'
                                        : 'border-gray-100 bg-[#F8FAFD] hover:border-blue-200'
                                }`}
                            >
                                <div
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                        office.isHeadOffice ? 'bg-amber-100' : 'bg-blue-100'
                                    }`}
                                >
                                    <MapPin className={`w-4 h-4 ${office.isHeadOffice ? 'text-amber-600' : 'text-blue-600'}`} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h4 className="font-bold text-[#0B1E5C] text-sm">{office.name}</h4>
                                        {office.isHeadOffice && (
                                            <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-400 text-white">
                        {t('contactHeadOffice')}
                      </span>
                                        )}
                                        {office.subtitle && (
                                            <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                        {office.subtitle}
                      </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-0.5">{t('contactWilayaOf')} {office.wilaya}</p>
                                </div>
                            </Anchor>
                        ))}
                    </div>

                    {offices[0] && (
                        <Anchor
                            href={offices[0].mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 mt-6 px-4 py-2 rounded-lg text-sm font-semibold"
                            style={{ background: 'rgba(11,30,92,0.08)', color: '#0B1E5C' }}
                        >
                            <MapPin className="w-4 h-4" />
                            {t('contactViewHeadOfficeOnMaps')}
                            <ChevronRight className="w-4 h-4" />
                        </Anchor>
                    )}
                </div>
            </section>

            {/* ── CTA FAQ ── */}
            <section className="max-w-7xl mx-auto px-6 md:px-10 py-12 md:py-16">
                <div
                    className="flex flex-col sm:flex-row items-center justify-between gap-6 rounded-3xl px-8 py-8"
                    style={{ background: '#E3EAFB' }}
                >
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shrink-0">
                            <Headphones className="w-6 h-6 text-[#0B1E5C]" />
                        </div>
                        <div>
                            <h3 className="font-bold text-[#0B1E5C] text-lg">{t('contactNeedHelp')}</h3>
                            <p className="text-sm text-gray-600 mt-1 max-w-md">
                                {t('contactFaqDescription')}
                            </p>
                        </div>
                    </div>
                    <Link
                        to="/assistance"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white shrink-0"
                        style={{ background: '#0B1E5C' }}
                    >
                        {t('contactFaqCta')}
                        <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>
            </section>
        </div>
    );
};

export default ContactPage;