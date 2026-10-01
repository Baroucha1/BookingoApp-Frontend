import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plane, FileCheck2, Wifi, Building2, ChevronRight, Luggage, Gift, Lock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getApplicationsByClient } from '../../service/visaApplication.service';
import { searchBookings, type BookingListItem } from '../../service/flights/searchBookings.service';
import { useLanguage } from '@/i18n/LanguageContext';
import type { TranslationKey } from '@/i18n/translations';

const API = import.meta.env.VITE_API_URL;

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-600 border-amber-200',
  UNDER_REVIEW: 'bg-blue-50 text-blue-600 border-blue-200',
  APPROVED: 'bg-green-50 text-green-600 border-green-200',
  CONFIRMED: 'bg-green-50 text-green-600 border-green-200',
  TICKETED: 'bg-green-50 text-green-600 border-green-200',
  ACTIVE: 'bg-green-50 text-green-600 border-green-200',
  REJECTED: 'bg-red-50 text-red-600 border-red-200',
  CANCELLED: 'bg-gray-50 text-gray-600 border-gray-200',
};

const STATUS_LABEL: Record<string, TranslationKey> = {
  PENDING: 'clientStatusPending',
  UNDER_REVIEW: 'clientStatusUnderReview',
  APPROVED: 'clientStatusApproved',
  CONFIRMED: 'clientStatusConfirmed',
  TICKETED: 'clientStatusConfirmed',
  ACTIVE: 'clientStatusActive',
  REJECTED: 'clientStatusRejected',
  CANCELLED: 'clientStatusCancelled',
};

const formatDate = (iso?: string, locale = 'fr-FR') => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
};

const ClientDashboard = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [apps, setApps] = useState<any[]>([]);
  const [esims, setEsims] = useState<any[]>([]);
  const [flights, setFlights] = useState<BookingListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem('token');

    fetch(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(async me => {
          const clientId = me.profile?.id;
          if (!clientId) return;

          const [appsData, esimsRes, flightsData] = await Promise.all([
            getApplicationsByClient(clientId),
            fetch(`${API}/api/esim/my-orders`, { headers: { Authorization: `Bearer ${token}` } })
                .then(r => r.json()).catch(() => ({ data: [] })),
            searchBookings({}),
          ]);

          setApps(appsData.data ?? []);
          setEsims(esimsRes.data ?? []);
          setFlights(flightsData ?? []);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
  }, [user]);

  const firstName = user?.firstName ?? user?.email?.split('@')[0] ?? '';
  const dateLocale = language === 'ar' ? 'ar-DZ' : language === 'en' ? 'en-US' : 'fr-FR';

  const stats = [
    { labelKey: 'clientStatFlights', subKey: 'clientStatBookings', value: flights.length, icon: Plane, bg: 'bg-blue-50', color: 'text-blue-600', to: '/client/flights' },
    { labelKey: 'clientStatVisaRequests', subKey: 'clientStatInProgress', value: apps.filter(a => a.status === 'PENDING' || a.status === 'UNDER_REVIEW').length, icon: FileCheck2, bg: 'bg-red-50', color: 'text-red-500', to: '/client/applications' },
    { labelKey: 'clientStatEsim', subKey: 'clientStatActive', value: esims.length, icon: Wifi, bg: 'bg-purple-50', color: 'text-purple-600', to: '/client/esim' },
    { labelKey: 'clientStatHotels', subKey: 'clientComingSoon', value: '—', icon: Building2, bg: 'bg-amber-50', color: 'text-amber-600', to: '#', disabled: true },
  ];

  return (
      <div className="space-y-6">

        {/* Hero */}
        <div className="rounded-3xl overflow-hidden relative h-[220px] flex items-center px-8 bg-blue-50">
          <img src="/hero-bg.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/70 to-transparent" />
          <div className="relative z-10 max-w-md">
            <p className="text-2xl font-bold text-gray-900">{t('clientGreeting')} {firstName || '...'} 👋</p>
            <p className="text-lg font-semibold text-gray-800 mt-1">{t('clientWelcome')}</p>
            <p className="text-sm text-gray-500 mt-2">{t('clientDashboardDescription')}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map(s =>
              s.disabled ? (
                  <div
                      key={s.label}
                      className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 opacity-60 cursor-not-allowed"
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${s.bg} ${s.color}`}>
                      <s.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">{t(s.labelKey)}</p>
                        <Lock className="w-3.5 h-3.5 text-gray-300" />
                      </div>
                      <p className="text-2xl font-bold text-gray-400 mt-0.5">{s.value}</p>
                      <p className="text-xs text-gray-400">{t(s.subKey)}</p>
                    </div>
                  </div>
              ) : (
                  <Link
                      key={s.label}
                      to={s.to}
                      className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 hover:shadow-md transition-shadow"
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${s.bg} ${s.color}`}>
                      <s.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">{t(s.labelKey)}</p>
                        <ChevronRight className="w-4 h-4 text-gray-300" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900 mt-0.5">{loading ? '–' : s.value}</p>
                      <p className="text-xs text-gray-400">{t(s.subKey)}</p>
                    </div>
                  </Link>
              )
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Réservations récentes */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="font-semibold text-gray-900">{t('clientRecentBookings')}</p>
              <Link to="/client/flights" className="text-sm text-blue-600 font-medium hover:underline">
                {t('clientViewAll')}
              </Link>
            </div>

            <Tabs defaultValue="flights">
              <TabsList className="bg-transparent p-0 h-auto gap-6 border-b border-gray-100 rounded-none justify-start mb-4">
                <TabsTrigger
                    value="flights"
                    className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none pb-3 px-0 gap-1.5 text-gray-500"
                >
                  <Plane className="w-4 h-4" /> {t('clientTabFlights')}
                </TabsTrigger>
                <TabsTrigger
                    value="hotels"
                    className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none pb-3 px-0 gap-1.5 text-gray-500"
                >
                  <Building2 className="w-4 h-4" /> {t('clientTabHotels')}
                </TabsTrigger>
                <TabsTrigger
                    value="esim"
                    className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none pb-3 px-0 gap-1.5 text-gray-500"
                >
                  <Wifi className="w-4 h-4" /> {t('clientTabEsim')}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="flights" className="space-y-3">
                {!loading && flights.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-6">{t('clientNoFlightBookings')}</p>
                )}
                {flights.slice(0, 3).map(f => (
                    <Link
                        key={f.id}
                        to="/client/flights"
                        className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                        <Plane className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Badge variant="outline" className={`mb-1 text-xs font-normal ${STATUS_COLOR[f.status ?? ''] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                          {f.status ? t(STATUS_LABEL[f.status] ?? 'clientStatusUnknown') : '—'}
                        </Badge>
                        <p className="font-medium text-gray-900 truncate">{f.departureAirport} → {f.arrivalAirport}</p>
                        <p className="text-xs text-gray-400">
                          {formatDate(f.departureDate, dateLocale)} · {f.passengers?.length ?? 1} {t((f.passengers?.length ?? 1) === 1 ? 'clientPassenger' : 'clientPassengers')}
                        </p>
                      </div>
                      <div className="text-right shrink-0 flex items-center gap-2">
                        <p className="font-semibold text-sm text-gray-900">
                          {f.totalAmount != null ? `${f.totalAmount} ${f.currency ?? 'DZD'}` : '—'}
                        </p>
                        <ChevronRight className="w-4 h-4 text-gray-300" />
                      </div>
                    </Link>
                ))}
              </TabsContent>

              <TabsContent value="hotels" className="space-y-3">
                <div className="text-center py-8">
                  <Building2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">{t('clientHotelModuleComingSoon')}</p>
                </div>
              </TabsContent>

              <TabsContent value="esim" className="space-y-3">
                {!loading && esims.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-6">{t('clientNoEsim')}</p>
                )}
                {esims.slice(0, 3).map(esim => (
                    <Link
                        key={esim.id}
                        to="/client/esim"
                        className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-14 h-14 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                        <Wifi className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Badge variant="outline" className={`mb-1 text-xs font-normal ${STATUS_COLOR[esim.status] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                          {t(STATUS_LABEL[esim.status] ?? 'clientStatusUnknown')}
                        </Badge>
                        <p className="font-medium text-gray-900 truncate">{esim.locationName}</p>
                        <p className="text-xs text-gray-400">
                          {esim.volumeBytes >= 1073741824
                              ? `${(esim.volumeBytes / 1073741824).toFixed(0)} GB`
                              : `${(esim.volumeBytes / 1048576).toFixed(0)} MB`} · {esim.durationDays}j
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                    </Link>
                ))}
              </TabsContent>
            </Tabs>

            <Link to="/client/flights" className="text-sm text-blue-600 font-medium hover:underline mt-3 inline-block">
              {t('clientAllFlightBookings')}
            </Link>
          </div>

          {/* Colonne droite */}
          <div className="space-y-6">

            {/* Demandes récentes */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="font-semibold text-gray-900">{t('clientRecentRequests')}</p>
                <Link to="/client/applications" className="text-sm text-blue-600 font-medium hover:underline">
                  {t('clientViewAll')}
                </Link>
              </div>

              <div className="space-y-1">
                {apps.length === 0 && !loading && (
                    <p className="text-sm text-gray-400 text-center py-6">{t('clientNoRequests')}</p>
                )}
                {apps.slice(0, 2).map(app => (
                    <Link
                        key={app.id}
                        to="/client/applications"
                        className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                        <FileCheck2 className="w-4 h-4 text-red-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm text-gray-900 truncate">
                            {t('clientVisaPrefix')} {app.visaType?.country?.nameFr}
                          </p>
                          <Badge variant="outline" className={`text-[10px] font-normal ${STATUS_COLOR[app.status]}`}>
                            {STATUS_LABEL[app.status]}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-400">{t('clientSubmittedOn')} {formatDate(app.submittedAt ?? app.createdAt, dateLocale)}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                    </Link>
                ))}
                {esims.slice(0, 1).map(esim => (
                    <Link
                        key={esim.id}
                        to="/client/esim"
                        className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
                        <Wifi className="w-4 h-4 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm text-gray-900 truncate">{t('clientEsimPrefix')} {esim.locationName}</p>
                          <Badge variant="outline" className={`text-[10px] font-normal ${STATUS_COLOR[esim.status] ?? ''}`}>
                            {t(STATUS_LABEL[esim.status] ?? 'clientStatusUnknown')}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-400">{t('clientValidUntil')} {formatDate(esim.expiresAt, dateLocale)}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                    </Link>
                ))}
              </div>
            </div>

            {/* Bannière promo */}
            <div className="rounded-2xl overflow-hidden relative p-6 text-white bg-gradient-to-br from-blue-600 to-blue-500">
              <p className="font-semibold text-lg">{t('clientTravelPromoTitle')}</p>
              <p className="text-sm opacity-90 mt-1 max-w-[180px]">{t('clientTravelPromoDescription')}</p>
              <button className="mt-4 flex items-center gap-1.5 bg-white text-blue-600 text-sm font-medium rounded-lg px-4 py-2 hover:bg-white/90 transition-colors">
                <Gift className="w-3.5 h-3.5" /> {t('clientDiscoverOffers')}
              </button>
              <Luggage className="w-20 h-20 absolute -bottom-4 -right-4 opacity-20" />
            </div>
          </div>
        </div>
      </div>
  );
};

export default ClientDashboard;