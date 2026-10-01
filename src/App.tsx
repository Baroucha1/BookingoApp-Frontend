import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Outlet, Route, Routes } from "react-router-dom";
import { ThemeProvider }    from "next-themes";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster }          from "@/components/ui/toaster";
import { TooltipProvider }  from "@/components/ui/tooltip";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { AuthProvider }     from "@/hooks/useAuth";
import { GoogleOAuthProvider } from "@react-oauth/google";
import Navbar               from "@/components/Navbar";
import Footer               from "@/components/Footer";
import Login                from "./pages/Login";
import ForgotPassword       from "@/pages/client/ForgotPassword";
import VerifyResetOtp       from "@/pages/client/VerifyResetOtp";
import ResetPasswordForm    from "@/pages/client/ResetPasswordForm";
import NotFound             from "./pages/NotFound";
import ScrollToTop          from "@/components/ScrollToTop";
import AdminLayout          from "./pages/admin/AdminLayout";
import AdminDashboard       from "./pages/admin/AdminDashboard";
import VisaTypesAdmin       from "./pages/admin/VisaTypesAdmin";
import ApplicationsAdmin    from "./pages/admin/ApplicationsAdmin";
import CountriesAdmin       from "./pages/admin/CountriesAdmin";
import DocumentTypesAdmin   from "./pages/admin/DocumentTypesAdmin";
import PromoCodesAdmin      from "./pages/admin/PromoCodesAdmin";
import PaymentsAdmin        from "./pages/admin/PaymentsAdmin";
import UsersAdmin           from "./pages/admin/UsersAdmin";
import AgencyGroupsAdmin    from "./pages/admin/AgencyGroupsAdmin";
import ImagesAdmin          from "./pages/admin/ImagesAdmin";
import EsimAdmin            from "./pages/admin/EsimAdmin";
import AgencyLayout         from "./pages/agency/AgencyLayout";
import AgencyDashboard      from "./pages/agency/AgencyDashboard";
import NewApplication       from "./pages/agency/NewApplication";
import AgencyApplications   from "./pages/agency/AgencyApplications";
import AgencyPayments       from "./pages/agency/AgencyPayments";
import AgencyPricing        from "./pages/agency/AgencyPricing";
import AgencyProfile        from "./pages/agency/AgencyProfile";
import ClientLayout         from "./pages/client/ClientLayout";
import ClientDashboard      from "./pages/client/ClientDashboard";
import ClientApplications   from "./pages/client/ClientApplications";
import ClientVisaPayments       from "./pages/client/ClientVisaPayments.tsx";
import ClientNotifications  from "./pages/client/ClientNotifications";
import ClientProfile        from "./pages/client/ClientProfile";
import ClientEsim           from "./pages/client/ClientEsim";
import ClientFlights        from "./pages/client/ClientFlights";
import RouteTopLoader       from "@/components/RouteTopLoader.tsx";
import { FlightProvider }   from "@/context/FlightContext.tsx";
import FlightConfirmation   from "@/pages/flights/FlightConfirmation.tsx";
import FlightBook           from "@/pages/flights/AggregatedFlightBooking.tsx";
import FlightMyBookings     from "@/pages/flights/FlightMyBookings.tsx";
import FlightBookingDetail  from "@/pages/flights/FlightBookingDetail.tsx";
import FlightBookingsAdmin  from "@/pages/admin/flilghtAdmin.tsx";
import SatimResult          from "./pages/Satim/SatimResult.tsx";
import ReceiptPDF           from "@/pages/Satim/ReceiptPDF.tsx";
import PayApplication       from "@/pages/Satim/PayApplication.tsx";
import EsimStore            from './pages/esim/EsimStore';
import EsimCheckout         from './pages/esim/EsimCheckout';
import EsimStatus           from './pages/esim/EsimStatus';
//import HotelBooking         from './pages/hotels/HotelBooking';
import RateHawkBooking      from './pages/hotels/RateHawkBooking';
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
import HotelsApiTest from "@/pages/admin/hotels/HotelsApiTest.tsx";
import ContactPage from "@/pages/ContactPage.tsx";
import ContactMessagesAdmin from "@/pages/admin/ContactMessagesAdmin.tsx";
import AboutPage from "@/pages/AboutPage.tsx";
import HotelBookings from "@/pages/admin/hotels/HotelBookings.tsx";
import LegalInfoPage from "@/pages/LegalInfoPage.tsx";
import CancellationPolicyPage from "@/pages/CancellationPolicyPage.tsx";
import HotelResults from "@/pages/hotels/HotelResults.tsx";
import HotelDetail from "@/pages/hotels/HotelDetail.tsx";
import HotelCheckout from "./pages/hotels/HotelCheckout.tsx";



const queryClient = new QueryClient();


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
              <BrowserRouter>
                <ScrollToTop />
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
                    <Route path="hotels/test" element={<HotelsApiTest />} />
                    <Route path="hotels/bookings" element={<HotelBookings />} />
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
                    <Route path="contact-messages" element={<ContactMessagesAdmin />} />
                  </Route>

                  {/* Agency routes */}
                  <Route path="/agency" element={<AgencyLayout />}>
                    <Route index element={<AgencyDashboard />} />
                    <Route path="new-application" element={<NewApplication />} />
                    <Route path="applications"    element={<AgencyApplications />} />
                    <Route path="payments"        element={<AgencyPayments />} />
                    <Route path="pricing"         element={<AgencyPricing />} />
                    <Route path="profile"         element={<AgencyProfile />} />
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
                  <Route path="*" element={
                    <div className="flex flex-col min-h-screen min-h-screen-safe">
                      <Navbar />
                      <main className="flex-1">
                        <Routes>
                          <Route path="/" element={<HomePage />} />
                          <Route path="/home" element={<HomePage />} />
                          <Route path="/visa"      element={<Visa />} />
                          <Route path="/flights" element={<FlightPage />} />
                          <Route path="/esim"            element={<div className="pt-navbar"><EsimStore /></div>}    />
                          <Route path="/esim/checkout"   element={<div className="pt-navbar"><EsimCheckout /></div>} />
                          <Route path="/esim/status/:id" element={<div className="pt-navbar"><EsimStatus /></div>}  />

                          <Route path="/hotels"          element={<div className="pt-navbar"><HotelPage /></div>} />
                          <Route path="hotels/results" element={<HotelResults />} />
                          <Route path="hotels/:hotelId" element={<HotelDetail />} />
                          <Route path="hotels/checkout" element={<HotelCheckout />} />
                          <Route path="/hotels/ratehawk" element={<div className="pt-navbar"><RateHawkBooking /></div>} />
                          <Route path="/destinations"    element={<div className="pt-navbar"><Destinations /></div>} />
                          <Route path="/visa-free"       element={<div className="pt-navbar"><VisaFree /></div>} />
                          <Route path="/login"           element={<div className="pt-navbar"><Login /></div>} />
                          <Route path="/forgot-password"   element={<div className="pt-navbar"><ForgotPassword /></div>} />
                          <Route path="/verify-reset-otp"  element={<div className="pt-navbar"><VerifyResetOtp /></div>} />
                          <Route path="/reset-password"    element={<div className="pt-navbar"><ResetPasswordForm /></div>} />
                          <Route path="/satim/result"    element={<SatimResult />} />
                          <Route path="/receipt/:applicationId"     element={<ReceiptPDF />} />
                          <Route path="/client/pay/:applicationId"  element={<PayApplication />} />
                          <Route path="/apply"           element={<div className="pt-navbar"><Apply /></div>} />
                          <Route path="/apply/:slug"     element={<div className="pt-navbar"><ApplyVisa /></div>} />
                          <Route path="/assistance"      element={<div className="pt-navbar"><AssistancePage /></div>} />
                          <Route path="/cancellation"    element={<div className="pt-navbar"><CancellationPolicyPage /></div>} />
                          <Route path="/contact"         element={<div className="pt-navbar"><ContactPage /></div>} />
                          <Route path="/about"           element={<div className="pt-navbar"><AboutPage /></div>} />
                          <Route path="/legal-info"      element={<div className="pt-navbar"><LegalInfoPage /></div>} />
                          <Route path="*"                element={<div className="pt-navbar"><NotFound /></div>} />
                          <Route element={<FlightProvider><Outlet /></FlightProvider>}>
                            <Route path="/flights/v2" element={<AggregatedFlightResults />} />
                            <Route path="/flights/booking" element={<AggregatedFlightBooking />} />
                            <Route element={<ProtectedRoute><Outlet /></ProtectedRoute>}>
                              <Route path="/flights/book" element={<FlightBook />} />
                              <Route path="/flights/confirmation" element={<FlightConfirmation />} />
                              <Route path="/flights/my-bookings" element={<FlightMyBookings />} />
                              <Route path="/flights/booking/:ref" element={<FlightBookingDetail />} />
                            </Route>
                          </Route>
                        </Routes>
                      </main>
                      <Footer />
                    </div>
                  } />

                </Routes>
              </BrowserRouter>

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
