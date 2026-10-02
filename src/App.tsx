import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, BrowserRouter, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { App as CapApp } from "@capacitor/app";
import { SplashScreen } from "@capacitor/splash-screen";
import { ThemeProvider } from "next-themes";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { AuthProvider } from "@/hooks/useAuth";
import { GoogleOAuthProvider } from "@react-oauth/google";
import Navbar from "@/components/Navbar";
import BottomNavbar, { isBottomNavExcluded } from "@/components/BottomNavbar";
import Footer from "@/components/Footer";
import Login from "./pages/Login";
import ForgotPassword from "@/pages/client/ForgotPassword";
import VerifyResetOtp from "@/pages/client/VerifyResetOtp";
import ResetPasswordForm from "@/pages/client/ResetPasswordForm";
import NotFound from "./pages/NotFound";
import ScrollToTop from "@/components/ScrollToTop";
import MobileBackButtonHandler from "@/components/MobileBackButtonHandler";
import KeyboardManager from "@/components/common/KeyboardManager";
import StatusBarManager from "@/components/common/StatusBarManager";
import OfflineBanner from "@/components/common/OfflineBanner";
import VideoSplashScreen from "@/components/common/VideoSplashScreen";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import VisaTypesAdmin from "./pages/admin/VisaTypesAdmin";
import ApplicationsAdmin from "./pages/admin/ApplicationsAdmin";
import CountriesAdmin from "./pages/admin/CountriesAdmin";
import DocumentTypesAdmin from "./pages/admin/DocumentTypesAdmin";
import PromoCodesAdmin from "./pages/admin/PromoCodesAdmin";
import PaymentsAdmin from "./pages/admin/PaymentsAdmin";
import UsersAdmin from "./pages/admin/UsersAdmin";
import AgencyGroupsAdmin from "./pages/admin/AgencyGroupsAdmin";
import ImagesAdmin from "./pages/admin/ImagesAdmin";
import EsimAdmin from "./pages/admin/EsimAdmin";
import AgencyLayout from "./pages/agency/AgencyLayout";
import AgencyDashboard from "./pages/agency/AgencyDashboard";
import NewApplication from "./pages/agency/NewApplication";
import AgencyApplications from "./pages/agency/AgencyApplications";
import AgencyPayments from "./pages/agency/AgencyPayments";
import AgencyPricing from "./pages/agency/AgencyPricing";
import AgencyProfile from "./pages/agency/AgencyProfile";
import ClientLayout from "./pages/client/ClientLayout";
import ClientDashboard from "./pages/client/ClientDashboard";
import ClientApplications from "./pages/client/ClientApplications";
import ClientVisaPayments from "./pages/client/ClientVisaPayments.tsx";
import ClientNotifications from "./pages/client/ClientNotifications";
import ClientProfile from "./pages/client/ClientProfile";
import ClientEsim from "./pages/client/ClientEsim";
import ClientFlights from "./pages/client/ClientFlights";
import RouteTopLoader from "@/components/RouteTopLoader.tsx";
import { FlightProvider } from "@/context/FlightContext.tsx";
import FlightConfirmation from "@/pages/flights/FlightConfirmation.tsx";
import FlightBook from "@/pages/flights/AggregatedFlightBooking.tsx";
import FlightMyBookings from "@/pages/flights/FlightMyBookings.tsx";
import FlightBookingDetail from "@/pages/flights/FlightBookingDetail.tsx";
import FlightBookingsAdmin from "@/pages/admin/flilghtAdmin.tsx";
import SatimResult from "./pages/Satim/SatimResult.tsx";
import ReceiptPDF from "@/pages/Satim/ReceiptPDF.tsx";
import PayApplication from "@/pages/Satim/PayApplication.tsx";
import EsimStore from './pages/esim/EsimStore';
import EsimCheckout from './pages/esim/EsimCheckout';
import EsimStatus from './pages/esim/EsimStatus';
import AggregatedFlightResults from "./pages/flights/AggregatedFlightResults.tsx";
import AggregatedFlightBooking from "@/pages/flights/AggregatedFlightBooking.tsx";
import HomePage from "@/pages/home.tsx";
import FlightPage from "@/pages/flights/Flights.tsx";
import FlightServiceFees from "@/pages/admin/flights/FlightServiceFees.tsx";
import FlightServiceFeeDetail from "@/pages/admin/flights/FlightServiceFeeDetail.tsx";
import FlightAcdCountries from "@/pages/admin/flights/FlightAcdCountries.tsx";
import FlightAcdFeeDetail from "@/pages/admin/flights/FlightAcdDetail.tsx";
import FlightAcdFees from "@/pages/admin/flights/FlightAcdFees.tsx";
import FlightCommissions from "@/pages/admin/flights/FlightComissions.tsx";
import FlightPromoCodes from "@/pages/admin/flights/FlightPromoCodes.tsx";
import FlightPromoCodeAdd from "@/pages/admin/flights/FlightPromoCodeAdd.tsx";
import FlightPromoCodeEdit from "@/pages/admin/flights/FlightPromoCodeEdit.tsx";
import ExchangeRates from "./pages/admin/flights/ExchangeRates.tsx";
import Fournisseurs from "@/pages/admin/flights/Fournisseurs.tsx";
import HotelPage from "@/pages/hotels/Hotels.tsx";
import HotelResults from "@/pages/hotels/HotelResults.tsx";
import HotelDetail from "@/pages/hotels/HotelDetail.tsx";
import HotelRoomSelect from "@/pages/hotels/HotelRoomSelect.tsx";
import HotelCheckout from "@/pages/hotels/HotelCheckout.tsx";
import HotelSatimResult from "@/pages/hotels/HotelSatimResult.tsx";
import SatimCustomResult from "@/pages/client/SatimCustomResult.tsx";
import ClientCustomPayments from "@/pages/client/ClientCustomPayments.tsx";
import CustomPaymentPay from "@/pages/client/CustomPaymentPay.tsx";
import CustomPaymentsAdmin from "@/pages/admin/CustomPaymentAdmin.tsx";
import Visa from "./pages/visa/Visa.tsx";
import Destinations from "./pages/visa/Destinations.tsx";
import VisaFree from "./pages/visa/VisaFree.tsx";
import Apply from "./pages/visa/Apply.tsx";
import ApplyVisa from "./pages/visa/ApplyVisa.tsx";
import AdminProtectedRoute from "@/components/AdminProtectedRoute.tsx";
import ProtectedRoute from "@/components/ProtectedRoute.tsx";
import EsimSatimResult from "@/pages/Satim/EsimSatimResult.tsx";
import AssistancePage from "@/pages/AssistancePage.tsx";
import AboutPage from "@/pages/AboutPage.tsx";

const queryClient = new QueryClient();
const RouterComponent = Capacitor.isNativePlatform() ? HashRouter : BrowserRouter;

const NativeReadyNotifier = () => {
  useEffect(() => {
    // If running in HashRouter mode on native platform with a direct pathname
    if (Capacitor.isNativePlatform() && window.location.pathname && window.location.pathname !== '/' && (!window.location.hash || window.location.hash === '#/')) {
      const fullPath = window.location.pathname + window.location.search;
      window.location.replace(`/#${fullPath}`);
    }

    const hideSplash = async () => {
      try {
        if (Capacitor.isNativePlatform()) {
          await SplashScreen.hide({ fadeOutDuration: 300 });
        }
        if ((window as any).AndroidNativeApp?.onReactReady) {
          (window as any).AndroidNativeApp.onReactReady();
        } else if ((window as any).AndroidNativeApp?.dismissSplash) {
          (window as any).AndroidNativeApp.dismissSplash();
        }
      } catch (e) { }
    };

    // Keep cold start active until the initial page has finished rendering
    const timer = setTimeout(hideSplash, 400);

    // Listen for custom scheme app opens (e.g. bookingo://visa or bookingo://satim/result)
    const appUrlListener = CapApp.addListener('appUrlOpen', (event) => {
      try {
        const raw = event.url || '';
        const clean = raw.replace(/^bookingo:\/\/?/, '/');
        if (clean) {
          const target = clean.startsWith('/') ? clean : `/${clean}`;
          if (Capacitor.isNativePlatform()) {
            window.location.hash = `#${target}`;
          } else {
            window.location.href = target;
          }
        }
      } catch {}
    });

    return () => {
      clearTimeout(timer);
      appUrlListener.then(l => l.remove()).catch(() => {});
    };
  }, []);

  return null;
};

const SafePageTop = ({ children }: { children: React.ReactNode }) => (
  <div className="flex-1 flex flex-col w-full" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 4.5rem)' }}>
    {children}
  </div>
);

const PublicLayout = () => {
  const location = useLocation();

  const isBottomNavHidden = isBottomNavExcluded(location.pathname);

  // Match the page background color so the bottom navbar space seamlessly takes the page color
  const getPageBg = () => {
    const p = location.pathname;
    if (p.startsWith('/hotels/results') || p.startsWith('/hotels/')) return 'bg-[#F0F6FF]';
    if (p === '/hotels') return 'bg-[#DFECFF]';
    if (p.startsWith('/esim')) return 'bg-[#e2f1fb]';
    if (p.startsWith('/visa') || p.startsWith('/destinations') || p.startsWith('/visa-free') || p.startsWith('/apply')) return 'bg-[#e6f0fa]';
    if (p.startsWith('/about')) return 'bg-white';
    if (p.startsWith('/login')) return 'bg-transparent';
    if (
      p.startsWith('/forgot-password') ||
      p.startsWith('/verify-reset-otp') ||
      p.startsWith('/reset-password')
    ) return 'bg-white';
    if (p.startsWith('/assistance')) return 'bg-[#F3F6FB]';
    if (p.startsWith('/flights/confirmation')) return 'bg-[#0B0F2E]';
    if (p.startsWith('/flights/booking') || p.startsWith('/flights/book')) return 'bg-[#DFECFF]';
    if (p.startsWith('/flights')) return 'bg-gradient-to-b from-[#DFECFF] via-[#F0F6FF] to-[#DFECFF] bg-fixed';
    return 'bg-gradient-to-b from-[#DFECFF] via-[#F0F6FF] to-[#DFECFF] bg-fixed';
  };

  return (
    <div className={`flex flex-col min-h-screen transition-colors duration-150 ${getPageBg()}`}>
      <Navbar />
      <BottomNavbar />
      <main className={`flex-1 flex flex-col ${isBottomNavHidden ? 'bottom-nav-hidden' : ''}`}>
        <Routes>
          <Route path="/" element={<FlightPage />} />
          <Route path="/index.html" element={<HomePage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/visa" element={<Visa />} />
          <Route path="/flights" element={<FlightPage />} />
          <Route path="/esim" element={<EsimStore />} />
          <Route path="/esim/checkout" element={<EsimCheckout />} />
          <Route path="/esim/status/:id" element={<EsimStatus />} />

          <Route path="/hotels" element={<HotelPage />} />
          <Route path="/hotels/results" element={<HotelResults />} />
          <Route path="/hotels/checkout" element={<HotelCheckout />} />
          <Route path="/hotels/satim/result" element={<HotelSatimResult />} />
          <Route path="/hotels/:hotelId" element={<HotelDetail />} />
          <Route path="/hotels/:hotelId/rooms" element={<HotelRoomSelect />} />
          <Route path="/destinations" element={<SafePageTop><Destinations /></SafePageTop>} />
          <Route path="/visa-free" element={<SafePageTop><VisaFree /></SafePageTop>} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<SafePageTop><ForgotPassword /></SafePageTop>} />
          <Route path="/verify-reset-otp" element={<SafePageTop><VerifyResetOtp /></SafePageTop>} />
          <Route path="/reset-password" element={<SafePageTop><ResetPasswordForm /></SafePageTop>} />
          <Route path="/satim/result" element={<SatimResult />} />
          <Route path="/receipt/:applicationId" element={<ReceiptPDF />} />
          <Route path="/client/pay/:applicationId" element={<PayApplication />} />
          <Route path="/apply" element={<Apply />} />
          <Route path="/apply/:slug" element={<ApplyVisa />} />
          <Route path="/assistance" element={<SafePageTop><AssistancePage /></SafePageTop>} />
          <Route path="/about" element={<SafePageTop><AboutPage /></SafePageTop>} />
          <Route element={<FlightProvider><Outlet /></FlightProvider>}>
            <Route path="/flights/v2" element={<AggregatedFlightResults />} />
            <Route>
              <Route path="/flights/booking" element={<AggregatedFlightBooking />} />
              <Route path="/flights/book" element={<FlightBook />} />
              <Route path="/flights/confirmation" element={<FlightConfirmation />} />
              <Route path="/flights/my-bookings" element={<FlightMyBookings />} />
              <Route path="/flights/booking/:ref" element={<FlightBookingDetail />} />
            </Route>
          </Route>
          <Route path="*" element={<SafePageTop><NotFound /></SafePageTop>} />
        </Routes>
      </main>
      <div className="hidden md:block">
        <Footer />
      </div>
    </div>
  );
};

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const Application = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} storageKey="visago-theme">
      <LanguageProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            {/*<ComingSoonGate>*/}
            <RouterComponent>
              <VideoSplashScreen />
              <NativeReadyNotifier />
              <ScrollToTop />
              <MobileBackButtonHandler />
              <KeyboardManager />
              <StatusBarManager />
              <OfflineBanner />
              <RouteTopLoader />
              <Routes>

                <Route
                  path="/admin"
                  element={
                    <AdminProtectedRoute>
                      <AdminLayout />
                    </AdminProtectedRoute>
                  }
                >
                  <Route index element={<AdminDashboard />} />
                  <Route path="flight-bookings" element={<FlightBookingsAdmin />} />
                  <Route path="flight-service-fees" element={<FlightServiceFees />} />
                  <Route path="flight-service-fees/:id" element={<FlightServiceFeeDetail />} />
                  <Route path="flight-acd-fees" element={<FlightAcdFees />} />
                  <Route path="flight-acd-fees/countries" element={<FlightAcdCountries />} />
                  <Route path="flight-acd-fees/:id" element={<FlightAcdFeeDetail />} />
                  <Route path="flight-commissions" element={<FlightCommissions />} />
                  <Route path="flight-promo-codes" element={<FlightPromoCodes />} />
                  <Route path="flight-promo-codes/new" element={<FlightPromoCodeAdd />} />
                  <Route path="flight-promo-codes/:id/edit" element={<FlightPromoCodeEdit />} />
                  <Route path="exchange-rates" element={<ExchangeRates />} />
                  <Route path="fournisseurs" element={<Fournisseurs />} />
                  <Route path="visa-types" element={<VisaTypesAdmin />} />
                  <Route path="countries" element={<CountriesAdmin />} />
                  <Route path="document-types" element={<DocumentTypesAdmin />} />
                  <Route path="applications" element={<ApplicationsAdmin />} />
                  <Route path="payments" element={<PaymentsAdmin />} />
                  <Route path="promo-codes" element={<PromoCodesAdmin />} />
                  <Route path="users" element={<UsersAdmin />} />
                  <Route path="agency-groups" element={<AgencyGroupsAdmin />} />
                  <Route path="images" element={<ImagesAdmin />} />
                  <Route path="esim" element={<EsimAdmin />} />
                  <Route path="client-payments" element={<CustomPaymentsAdmin />} />

                </Route>

                {/* Agency routes */}
                <Route path="/agency" element={<AgencyLayout />}>
                  <Route index element={<AgencyDashboard />} />
                  <Route path="new-application" element={<NewApplication />} />
                  <Route path="applications" element={<AgencyApplications />} />
                  <Route path="payments" element={<AgencyPayments />} />
                  <Route path="pricing" element={<AgencyPricing />} />
                  <Route path="profile" element={<AgencyProfile />} />
                </Route>

                {/* Client routes */}
                <Route
                  path="/client"
                  element={
                    <ProtectedRoute>
                      <ClientLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<ClientDashboard />} />
                  <Route path="applications" element={<ClientApplications />} />
                  <Route path="payments" element={<ClientVisaPayments />} />
                  <Route path="notifications" element={<ClientNotifications />} />
                  <Route path="profile" element={<ClientProfile />} />
                  <Route path="esim" element={<ClientEsim />} />
                  <Route path="flights" element={<ClientFlights />} />
                  <Route path="custom-payments" element={<ClientCustomPayments />} />
                  <Route path="custom-payments/:id/pay" element={<CustomPaymentPay />} />
                </Route>

                <Route path="/satim/result-custom" element={<SatimCustomResult />} />
                <Route path="/satim/result-esim" element={<EsimSatimResult />} />

                {/* Public routes */}
                <Route path="*" element={<PublicLayout />} />

              </Routes>
            </RouterComponent>

          </TooltipProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

const App = () => googleClientId
  ? <GoogleOAuthProvider clientId={googleClientId}><Application /></GoogleOAuthProvider>
  : <Application />;

export default App;