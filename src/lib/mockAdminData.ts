// Frontend-only mock data for admin pages (Phase 2 + 3).
// No backend persistence — state is rebuilt from these seeds on reload.
// Replace with API calls when wiring the real backend.

export type DocumentTypeMock = {
  id: string;
  key: string;
  labelFr: string;
  labelEn: string;
  labelAr: string;
  description: string;
};

export type PromoCodeMock = {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  value: number;
  currency: string;
  applicableTo: 'agency' | 'client' | 'all';
  maxUses: number;
  usedCount: number;
  expiresAt: string; // ISO
  isActive: boolean;
  visaTypeIds: string[]; // empty = all
};

export type PaymentMethod = 'STRIPE' | 'SATIM' | 'CASH' | 'PAYPAL' | 'BANK_TRANSFER';
export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed';

export type PaymentMock = {
  id: string;
  reference: string;
  applicantName: string; // legacy display
  amount: number;
  currency: string; // 'DZD' triggers SATIM details, otherwise Stripe
  method: PaymentMethod;
  status: PaymentStatus;
  date: string; // createdAt ISO
  paidAt?: string | null;
  visaCountry: string;
  // Owner relations (one of)
  clientId?: string | null;
  agencyId?: string | null;
  // Linked application (loose mock id, may exist in DB or in mock list)
  applicationId?: string | null;
  // Currency-specific
  satimOrderId?: string | null;
  stripePaymentIntentId?: string | null;
  receiptUrl?: string | null;
  // Promo
  promoCodeId?: string | null;
  discountApplied?: number;
};

export type AppStatus = 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';

export type PassengerMock = {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  birthPlace: string;
  nationality: string;
  passportNumber: string;
  passportIssueDate: string;
  passportExpiryDate: string;
  email: string;
  valid: boolean;
  documents: AppDocumentMock[];
};

export type AppDocumentMock = {
  id: string;
  key: string;
  label: string;
  filename: string;
  previewUrl?: string;
  verified: boolean;
};

export type ApplicationDetailMock = {
  applicationId: string;
  passengers: PassengerMock[];
};

// Users / Agencies / Clients
export type UserRole = 'ADMIN' | 'AGENCY' | 'CLIENT';

export type AdminUserMock = {
  id: string;
  email: string;
  phone?: string;
  role: 'ADMIN';
  password: string; // fake
  isActive: boolean;
  createdAt: string;
};

export type AgencyMock = {
  id: string;
  userId: string; // links back to original client/user
  companyName: string;
  taxId?: string;
  email: string;
  phone?: string;
  role: 'AGENCY';
  isActive: boolean;
  isVerified: boolean;
  groupId: string | null;
  createdAt: string;
};

export type ClientMock = {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: 'CLIENT';
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
};

export type AgencyGroupMock = {
  id: string;
  name: string;
  description?: string;
  agencies: string[]; // agency ids
};

export type PromoUsageMock = {
  id: string;
  promoCodeId: string;
  userType: 'client' | 'agency';
  userId: string; // refers to client or agency
  paymentId: string;
  discountApplied: number;
  currency: string;
  date: string;
};

// ---------- SEEDS ----------

export const seedDocumentTypes: DocumentTypeMock[] = [
  { id: 'dt-1', key: 'passport', labelFr: 'Passeport', labelEn: 'Passport', labelAr: 'جواز السفر', description: 'Passeport en cours de validité (min. 6 mois)' },
  { id: 'dt-2', key: 'photo', labelFr: 'Photo d\'identité', labelEn: 'ID Photo', labelAr: 'صورة شخصية', description: 'Format 35x45mm, fond blanc' },
  { id: 'dt-3', key: 'hotel', labelFr: 'Réservation d\'hôtel', labelEn: 'Hotel booking', labelAr: 'حجز الفندق', description: 'Confirmation d\'hébergement pour la durée du séjour' },
  { id: 'dt-4', key: 'flight', labelFr: 'Billet d\'avion', labelEn: 'Flight ticket', labelAr: 'تذكرة الطيران', description: 'Réservation aller-retour' },
  { id: 'dt-5', key: 'bank_statement', labelFr: 'Relevé bancaire', labelEn: 'Bank statement', labelAr: 'كشف حساب بنكي', description: '3 derniers mois' },
];

export const seedAdmins: AdminUserMock[] = [
  { id: 'adm-1', email: 'admin@visago.com', phone: '+213 555 010 001', role: 'ADMIN', password: '••••••••', isActive: true, createdAt: '2025-09-01T09:00:00Z' },
  { id: 'adm-2', email: 'support@visago.com', phone: '+213 555 010 002', role: 'ADMIN', password: '••••••••', isActive: true, createdAt: '2025-12-10T14:30:00Z' },
];

export const seedAgencies: AgencyMock[] = [
  { id: 'agn-1', userId: 'usr-agn-1', companyName: 'Voyages El Djazair', taxId: 'NIF-001234567', email: 'contact@eldjazair.dz', phone: '+213 21 555 100', role: 'AGENCY', isActive: true, isVerified: true, groupId: 'grp-1', createdAt: '2025-08-15T10:00:00Z' },
  { id: 'agn-2', userId: 'usr-agn-2', companyName: 'Sahara Tours', taxId: 'NIF-007654321', email: 'info@saharatours.dz', phone: '+213 21 555 200', role: 'AGENCY', isActive: true, isVerified: true, groupId: 'grp-2', createdAt: '2025-10-22T11:30:00Z' },
  { id: 'agn-3', userId: 'usr-agn-3', companyName: 'Atlas Travel', taxId: '', email: 'hello@atlastravel.dz', phone: '+213 21 555 300', role: 'AGENCY', isActive: true, isVerified: false, groupId: null, createdAt: '2026-02-12T16:45:00Z' },
  { id: 'agn-4', userId: 'usr-agn-4', companyName: 'Mediterranée Voyages', taxId: 'NIF-005566778', email: 'med@medvoyages.dz', phone: '+213 21 555 400', role: 'AGENCY', isActive: true, isVerified: true, groupId: 'grp-1', createdAt: '2026-01-04T08:20:00Z' },
];

export const seedClients: ClientMock[] = [
  { id: 'cli-1', fullName: 'Karim Bensalem', email: 'karim.b@gmail.com', phone: '+213 661 111 111', role: 'CLIENT', isActive: true, isVerified: true, createdAt: '2026-01-12T10:00:00Z' },
  { id: 'cli-2', fullName: 'Amel Hadji', email: 'amel.h@gmail.com', phone: '+213 661 222 222', role: 'CLIENT', isActive: true, isVerified: true, createdAt: '2026-02-03T14:20:00Z' },
  { id: 'cli-3', fullName: 'Yacine Mansouri', email: 'yacine.m@yahoo.fr', phone: '+213 661 333 333', role: 'CLIENT', isActive: true, isVerified: false, createdAt: '2026-03-15T09:45:00Z' },
  { id: 'cli-4', fullName: 'Salima Nait', email: 'salima.n@outlook.com', phone: '+213 661 444 444', role: 'CLIENT', isActive: true, isVerified: true, createdAt: '2026-03-28T17:10:00Z' },
  { id: 'cli-5', fullName: 'Mehdi Cherif', email: 'mehdi.c@gmail.com', phone: '+213 661 555 555', role: 'CLIENT', isActive: true, isVerified: false, createdAt: '2026-04-02T11:55:00Z' },
];

export const seedAgencyGroups: AgencyGroupMock[] = [
  { id: 'grp-1', name: 'Premium', description: 'Tarifs préférentiels — partenaires VIP', agencies: ['agn-1', 'agn-4'] },
  { id: 'grp-2', name: 'Group A', description: 'Agences standard', agencies: ['agn-2'] },
  { id: 'grp-3', name: 'Group B', description: 'Nouveaux partenaires', agencies: [] },
];

// Mock applications referenced from payments (when no real DB row exists)
export type MockApplicationLite = {
  id: string;
  country: string;
  visaType: string;
  numberOfPeople: number;
  status: AppStatus;
};

export const mockApplicationsLite: Record<string, MockApplicationLite> = {
  'app-1001': { id: 'app-1001', country: 'Turquie', visaType: 'Tourisme — 30 jours', numberOfPeople: 2, status: 'APPROVED' },
  'app-1002': { id: 'app-1002', country: 'Égypte', visaType: 'Tourisme — Single entry', numberOfPeople: 1, status: 'PENDING' },
  'app-1003': { id: 'app-1003', country: 'Indonésie', visaType: 'visa on Arrival', numberOfPeople: 4, status: 'UNDER_REVIEW' },
  'app-1004': { id: 'app-1004', country: 'Jordanie', visaType: 'Tourisme', numberOfPeople: 1, status: 'REJECTED' },
  'app-1005': { id: 'app-1005', country: 'Turquie', visaType: 'Business — Multi entry', numberOfPeople: 3, status: 'PENDING' },
};

export const seedPayments: PaymentMock[] = [
  { id: 'pay-1', reference: 'PAY-001245', applicantName: 'Karim Bensalem', amount: 120, currency: 'EUR', method: 'STRIPE', status: 'paid', date: '2026-04-22T10:32:00Z', paidAt: '2026-04-22T10:33:11Z', visaCountry: 'Turquie', clientId: 'cli-1', applicationId: 'app-1001', stripePaymentIntentId: 'pi_3Pq8a2Hxk9Zl', receiptUrl: 'https://stripe.com/receipts/mock_001245', promoCodeId: 'pc-1', discountApplied: 30 },
  { id: 'pay-2', reference: 'PAY-001246', applicantName: 'Amel Hadji', amount: 85, currency: 'EUR', method: 'PAYPAL', status: 'pending', date: '2026-04-23T14:11:00Z', paidAt: null, visaCountry: 'Égypte', clientId: 'cli-2', applicationId: 'app-1002', stripePaymentIntentId: 'pi_3Pq9b1Hxk9Zm', receiptUrl: null },
  { id: 'pay-3', reference: 'PAY-001247', applicantName: 'Sahara Tours', amount: 18000, currency: 'DZD', method: 'SATIM', status: 'paid', date: '2026-04-21T08:45:00Z', paidAt: '2026-04-21T08:46:30Z', visaCountry: 'Indonésie', agencyId: 'agn-2', applicationId: 'app-1003', satimOrderId: 'SATIM-7819-2026', promoCodeId: 'pc-2', discountApplied: 1000 },
  { id: 'pay-4', reference: 'PAY-001248', applicantName: 'Salima Nait', amount: 95, currency: 'EUR', method: 'STRIPE', status: 'refunded', date: '2026-04-19T16:20:00Z', paidAt: '2026-04-19T16:21:00Z', visaCountry: 'Jordanie', clientId: 'cli-4', applicationId: 'app-1004', stripePaymentIntentId: 'pi_3Po5c8Hxk9Zn', receiptUrl: 'https://stripe.com/receipts/mock_001248' },
  { id: 'pay-5', reference: 'PAY-001249', applicantName: 'Mehdi Cherif', amount: 150, currency: 'EUR', method: 'STRIPE', status: 'failed', date: '2026-04-24T09:08:00Z', paidAt: null, visaCountry: 'Turquie', clientId: 'cli-5', applicationId: 'app-1005', stripePaymentIntentId: 'pi_3Pr1d5Hxk9Zo', receiptUrl: null },
  { id: 'pay-6', reference: 'PAY-001250', applicantName: 'Voyages El Djazair', amount: 25500, currency: 'DZD', method: 'SATIM', status: 'paid', date: '2026-04-24T15:00:00Z', paidAt: '2026-04-24T15:02:14Z', visaCountry: 'Turquie', agencyId: 'agn-1', applicationId: 'app-1005', satimOrderId: 'SATIM-7820-2026' },
];

export const seedPromoCodes: PromoCodeMock[] = [
  { id: 'pc-1', code: 'SUMMER25', discountType: 'percentage', value: 25, currency: 'EUR', applicableTo: 'all', maxUses: 100, usedCount: 12, expiresAt: '2026-09-30T00:00:00Z', isActive: true, visaTypeIds: [] },
  { id: 'pc-2', code: 'AGENCY10', discountType: 'fixed', value: 10, currency: 'EUR', applicableTo: 'agency', maxUses: 500, usedCount: 87, expiresAt: '2026-12-31T00:00:00Z', isActive: true, visaTypeIds: [] },
  { id: 'pc-3', code: 'WELCOME5', discountType: 'percentage', value: 5, currency: 'EUR', applicableTo: 'client', maxUses: 1000, usedCount: 245, expiresAt: '2026-06-01T00:00:00Z', isActive: false, visaTypeIds: [] },
];

export const seedPromoUsages: PromoUsageMock[] = [
  { id: 'pu-1', promoCodeId: 'pc-1', userType: 'client', userId: 'cli-1', paymentId: 'pay-1', discountApplied: 30, currency: 'EUR', date: '2026-04-22T10:32:00Z' },
  { id: 'pu-2', promoCodeId: 'pc-2', userType: 'agency', userId: 'agn-2', paymentId: 'pay-3', discountApplied: 1000, currency: 'DZD', date: '2026-04-21T08:45:00Z' },
  { id: 'pu-3', promoCodeId: 'pc-1', userType: 'client', userId: 'cli-2', paymentId: 'pay-2', discountApplied: 21, currency: 'EUR', date: '2026-04-23T14:11:00Z' },
  { id: 'pu-4', promoCodeId: 'pc-2', userType: 'agency', userId: 'agn-1', paymentId: 'pay-6', discountApplied: 1500, currency: 'DZD', date: '2026-04-24T15:00:00Z' },
];

// Mock detail per application (keyed loosely; falls back to default if not found).
const passengerDocs = (pid: string): AppDocumentMock[] => [
  { id: `${pid}-d1`, key: 'passport', label: 'Passeport', filename: `passeport_${pid}.pdf`, previewUrl: 'https://images.unsplash.com/photo-1569949381669-ecf31ae8e613?w=600', verified: true },
  { id: `${pid}-d2`, key: 'photo', label: 'Photo d\'identité', filename: `photo_${pid}.jpg`, previewUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=600', verified: false },
  { id: `${pid}-d3`, key: 'hotel', label: 'Réservation d\'hôtel', filename: `hotel_${pid}.pdf`, previewUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600', verified: false },
];

export const mockApplicationDetail = (applicationId: string): ApplicationDetailMock => ({
  applicationId,
  passengers: [
    {
      id: `${applicationId}-p1`,
      firstName: 'Karim', lastName: 'Bensalem',
      birthDate: '1990-03-15', birthPlace: 'Alger, Algérie',
      nationality: 'Algérienne',
      passportNumber: 'A1234567', passportIssueDate: '2022-01-10', passportExpiryDate: '2032-01-09',
      email: 'karim.b@gmail.com', valid: true,
      documents: passengerDocs(`${applicationId}-p1`),
    },
    {
      id: `${applicationId}-p2`,
      firstName: 'Lina', lastName: 'Bensalem',
      birthDate: '1992-07-22', birthPlace: 'Oran, Algérie',
      nationality: 'Algérienne',
      passportNumber: 'A1234568', passportIssueDate: '2021-05-04', passportExpiryDate: '2031-05-03',
      email: 'lina.b@gmail.com', valid: false,
      documents: passengerDocs(`${applicationId}-p2`),
    },
  ],
});

export const APP_STATUS_LABEL: Record<AppStatus, string> = {
  PENDING: 'En attente',
  UNDER_REVIEW: 'En cours',
  APPROVED: 'Approuvée',
  REJECTED: 'Rejetée',
};

export const APP_STATUS_COLOR: Record<AppStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  UNDER_REVIEW: 'bg-blue-100 text-blue-800 border-blue-300',
  APPROVED: 'bg-green-100 text-green-800 border-green-300',
  REJECTED: 'bg-red-100 text-red-800 border-red-300',
};

// Map legacy DB statuses to new UI statuses.
export const mapDbStatusToUi = (s: string): AppStatus => {
  switch (s) {
    case 'pending': return 'PENDING';
    case 'processing': return 'UNDER_REVIEW';
    case 'approved': return 'APPROVED';
    case 'rejected': return 'REJECTED';
    default: return 'PENDING';
  }
};

export const mapUiStatusToDb = (s: AppStatus): string => {
  switch (s) {
    case 'PENDING': return 'pending';
    case 'UNDER_REVIEW': return 'processing';
    case 'APPROVED': return 'approved';
    case 'REJECTED': return 'rejected';
  }
};

// Lookup helpers
export const findClient = (id?: string | null) => seedClients.find(c => c.id === id) || null;
export const findAgency = (id?: string | null) => seedAgencies.find(a => a.id === id) || null;
export const findPromo = (id?: string | null) => seedPromoCodes.find(p => p.id === id) || null;
export const findGroup = (id?: string | null) => seedAgencyGroups.find(g => g.id === id) || null;

// Mock current admin user (for navbar)
export const currentAdminUser = {
  email: 'admin@visago.com',
  role: 'ADMIN' as const,
};

// ============================================================
// AGENCY (B2B) MOCK DATA — Phase 6
// ============================================================

export type AgencyVisaTypeMock = {
  id: string;
  countryId: string;
  countryName: string;
  countryCode: string;
  flagEmoji: string;
  visaTypeName: string;
  durationDays: number;
  processingTime: string;
  basePrice: number;
  currency: string;
  description: string;
  requiredDocuments: string[]; // doc keys
};

export type AgencyApplicationMock = {
  id: string;
  reference: string;
  countryName: string;
  visaTypeName: string;
  visaTypeId: string;
  numberOfPeople: number;
  status: AppStatus;
  email: string;
  phone: string;
  startDate: string;
  totalPrice: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
  passengers: PassengerMock[];
  timeline: { status: AppStatus; date: string; note?: string }[];
};

export type AgencyPaymentMock = {
  id: string;
  reference: string;
  applicationId: string;
  applicationRef: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  date: string;
  paidAt?: string | null;
  satimOrderId?: string | null;
  stripePaymentIntentId?: string | null;
};

// Currently logged-in agency (mock)
export const currentAgency = {
  id: 'agn-1',
  userId: 'usr-agn-1',
  companyName: 'Voyages El Djazair',
  email: 'contact@eldjazair.dz',
  phone: '+213 21 555 100',
  taxId: 'NIF-001234567',
  groupId: 'grp-1',
  isVerified: true,
  isActive: true,
  role: 'AGENCY' as const,
  createdAt: '2025-08-15T10:00:00Z',
};

// Mock visa catalog (used by agency portal — independent of admin Supabase data)
export const agencyVisaCatalog: AgencyVisaTypeMock[] = [
  { id: 'vt-tr-1', countryId: 'c-tr', countryName: 'Turquie', countryCode: 'TR', flagEmoji: '🇹🇷',
    visaTypeName: 'Tourisme — 30 jours', durationDays: 30, processingTime: '3-5 jours', basePrice: 120, currency: 'EUR',
    description: 'e-visa touristique simple entrée', requiredDocuments: ['passport', 'photo', 'hotel'] },
  { id: 'vt-tr-2', countryId: 'c-tr', countryName: 'Turquie', countryCode: 'TR', flagEmoji: '🇹🇷',
    visaTypeName: 'Business — Multi entrée', durationDays: 90, processingTime: '5-7 jours', basePrice: 220, currency: 'EUR',
    description: 'visa affaires entrées multiples', requiredDocuments: ['passport', 'photo', 'bank_statement'] },
  { id: 'vt-eg-1', countryId: 'c-eg', countryName: 'Égypte', countryCode: 'EG', flagEmoji: '🇪🇬',
    visaTypeName: 'Tourisme — Single entrée', durationDays: 30, processingTime: '4-6 jours', basePrice: 85, currency: 'EUR',
    description: 'e-visa touriste', requiredDocuments: ['passport', 'photo', 'hotel', 'flight'] },
  { id: 'vt-id-1', countryId: 'c-id', countryName: 'Indonésie', countryCode: 'ID', flagEmoji: '🇮🇩',
    visaTypeName: 'visa on Arrival', durationDays: 30, processingTime: '2-3 jours', basePrice: 95, currency: 'EUR',
    description: 'VOA prépayé', requiredDocuments: ['passport', 'flight'] },
  { id: 'vt-jo-1', countryId: 'c-jo', countryName: 'Jordanie', countryCode: 'JO', flagEmoji: '🇯🇴',
    visaTypeName: 'Tourisme', durationDays: 30, processingTime: '5-8 jours', basePrice: 75, currency: 'EUR',
    description: 'visa touristique', requiredDocuments: ['passport', 'photo', 'hotel'] },
  { id: 'vt-tn-1', countryId: 'c-tn', countryName: 'Tunisie', countryCode: 'TN', flagEmoji: '🇹🇳',
    visaTypeName: 'Tourisme — Court séjour', durationDays: 15, processingTime: '2-4 jours', basePrice: 18000, currency: 'DZD',
    description: 'visa touristique court séjour', requiredDocuments: ['passport', 'photo'] },
  { id: 'vt-ae-1', countryId: 'c-ae', countryName: 'Émirats Arabes Unis', countryCode: 'AE', flagEmoji: '🇦🇪',
    visaTypeName: 'Tourisme — 60 jours', durationDays: 60, processingTime: '3-5 jours', basePrice: 180, currency: 'EUR',
    description: 'visa touristique long', requiredDocuments: ['passport', 'photo', 'hotel', 'flight', 'bank_statement'] },
];

// Group prices = discounts per agency group on specific visa types
// Map: groupId -> visaTypeId -> price
export const agencyGroupPrices: Record<string, Record<string, number>> = {
  'grp-1': { // Premium — best discounts
    'vt-tr-1': 95,
    'vt-tr-2': 180,
    'vt-eg-1': 70,
    'vt-id-1': 78,
    'vt-jo-1': 60,
    'vt-tn-1': 14000,
    'vt-ae-1': 150,
  },
  'grp-2': { // Group A — moderate
    'vt-tr-1': 110,
    'vt-eg-1': 78,
    'vt-id-1': 88,
    'vt-tn-1': 16500,
  },
  'grp-3': { // Group B — minimal
    'vt-tr-1': 115,
  },
};

export const getAgencyPrice = (visaTypeId: string, groupId: string | null) => {
  const visa = agencyVisaCatalog.find(v => v.id === visaTypeId);
  if (!visa) return { price: 0, base: 0, isDiscounted: false, currency: 'EUR' };
  if (groupId && agencyGroupPrices[groupId]?.[visaTypeId] != null) {
    return {
      price: agencyGroupPrices[groupId][visaTypeId],
      base: visa.basePrice,
      isDiscounted: agencyGroupPrices[groupId][visaTypeId] < visa.basePrice,
      currency: visa.currency,
    };
  }
  return { price: visa.basePrice, base: visa.basePrice, isDiscounted: false, currency: visa.currency };
};

const mkPassenger = (id: string, fn: string, ln: string, pp: string): PassengerMock => ({
  id, firstName: fn, lastName: ln,
  birthDate: '1988-04-12', birthPlace: 'Alger, Algérie', nationality: 'Algérienne',
  passportNumber: pp, passportIssueDate: '2021-06-15', passportExpiryDate: '2031-06-14',
  email: `${fn.toLowerCase()}.${ln.toLowerCase()}@example.com`, valid: true,
  documents: [
    { id: `${id}-d1`, key: 'passport', label: 'Passeport', filename: `passeport_${id}.pdf`, previewUrl: 'https://images.unsplash.com/photo-1569949381669-ecf31ae8e613?w=600', verified: true },
    { id: `${id}-d2`, key: 'photo', label: "Photo d'identité", filename: `photo_${id}.jpg`, previewUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=600', verified: true },
  ],
});

export const seedAgencyApplications: AgencyApplicationMock[] = [
  {
    id: 'agapp-1', reference: 'VAG-202604-001',
    countryName: 'Turquie', visaTypeName: 'Tourisme — 30 jours', visaTypeId: 'vt-tr-1',
    numberOfPeople: 2, status: 'APPROVED',
    email: 'client1@gmail.com', phone: '+213 661 11 22 33', startDate: '2026-05-15',
    totalPrice: 190, currency: 'EUR',
    createdAt: '2026-04-20T09:30:00Z', updatedAt: '2026-04-22T14:00:00Z',
    passengers: [mkPassenger('agapp-1-p1', 'Karim', 'Bensalem', 'A1234567'), mkPassenger('agapp-1-p2', 'Lina', 'Bensalem', 'A1234568')],
    timeline: [
      { status: 'PENDING', date: '2026-04-20T09:30:00Z', note: 'Demande créée' },
      { status: 'UNDER_REVIEW', date: '2026-04-21T10:00:00Z', note: 'Documents en cours de vérification' },
      { status: 'APPROVED', date: '2026-04-22T14:00:00Z', note: 'visa approuvé' },
    ],
  },
  {
    id: 'agapp-2', reference: 'VAG-202604-002',
    countryName: 'Égypte', visaTypeName: 'Tourisme — Single entrée', visaTypeId: 'vt-eg-1',
    numberOfPeople: 1, status: 'PENDING',
    email: 'client2@gmail.com', phone: '+213 661 22 33 44', startDate: '2026-06-01',
    totalPrice: 70, currency: 'EUR',
    createdAt: '2026-04-23T11:00:00Z', updatedAt: '2026-04-23T11:00:00Z',
    passengers: [mkPassenger('agapp-2-p1', 'Amel', 'Hadji', 'A2345678')],
    timeline: [{ status: 'PENDING', date: '2026-04-23T11:00:00Z', note: 'Demande créée' }],
  },
  {
    id: 'agapp-3', reference: 'VAG-202604-003',
    countryName: 'Indonésie', visaTypeName: 'visa on Arrival', visaTypeId: 'vt-id-1',
    numberOfPeople: 4, status: 'UNDER_REVIEW',
    email: 'client3@gmail.com', phone: '+213 661 33 44 55', startDate: '2026-05-28',
    totalPrice: 312, currency: 'EUR',
    createdAt: '2026-04-21T08:45:00Z', updatedAt: '2026-04-22T16:00:00Z',
    passengers: [
      mkPassenger('agapp-3-p1', 'Yacine', 'Mansouri', 'A3456789'),
      mkPassenger('agapp-3-p2', 'Sara', 'Mansouri', 'A3456790'),
      mkPassenger('agapp-3-p3', 'Adam', 'Mansouri', 'A3456791'),
      mkPassenger('agapp-3-p4', 'Nour', 'Mansouri', 'A3456792'),
    ],
    timeline: [
      { status: 'PENDING', date: '2026-04-21T08:45:00Z' },
      { status: 'UNDER_REVIEW', date: '2026-04-22T16:00:00Z', note: 'Vérification en cours' },
    ],
  },
  {
    id: 'agapp-4', reference: 'VAG-202604-004',
    countryName: 'Jordanie', visaTypeName: 'Tourisme', visaTypeId: 'vt-jo-1',
    numberOfPeople: 1, status: 'REJECTED',
    email: 'client4@gmail.com', phone: '+213 661 44 55 66', startDate: '2026-05-10',
    totalPrice: 60, currency: 'EUR',
    createdAt: '2026-04-19T14:20:00Z', updatedAt: '2026-04-20T10:00:00Z',
    passengers: [mkPassenger('agapp-4-p1', 'Salima', 'Nait', 'A4567890')],
    timeline: [
      { status: 'PENDING', date: '2026-04-19T14:20:00Z' },
      { status: 'UNDER_REVIEW', date: '2026-04-19T17:00:00Z' },
      { status: 'REJECTED', date: '2026-04-20T10:00:00Z', note: 'Documents non conformes' },
    ],
  },
  {
    id: 'agapp-5', reference: 'VAG-202604-005',
    countryName: 'Turquie', visaTypeName: 'Business — Multi entrée', visaTypeId: 'vt-tr-2',
    numberOfPeople: 3, status: 'PENDING',
    email: 'client5@gmail.com', phone: '+213 661 55 66 77', startDate: '2026-07-01',
    totalPrice: 540, currency: 'EUR',
    createdAt: '2026-04-24T09:08:00Z', updatedAt: '2026-04-24T09:08:00Z',
    passengers: [
      mkPassenger('agapp-5-p1', 'Mehdi', 'Cherif', 'A5678901'),
      mkPassenger('agapp-5-p2', 'Rania', 'Cherif', 'A5678902'),
      mkPassenger('agapp-5-p3', 'Omar', 'Cherif', 'A5678903'),
    ],
    timeline: [{ status: 'PENDING', date: '2026-04-24T09:08:00Z', note: 'Demande créée' }],
  },
];

export const seedAgencyPayments: AgencyPaymentMock[] = [
  { id: 'agp-1', reference: 'PAY-AG-001', applicationId: 'agapp-1', applicationRef: 'VAG-202604-001', amount: 190, currency: 'EUR', method: 'STRIPE', status: 'paid', date: '2026-04-20T09:35:00Z', paidAt: '2026-04-20T09:36:00Z', stripePaymentIntentId: 'pi_3Pq8a2Hxk9Zl' },
  { id: 'agp-2', reference: 'PAY-AG-002', applicationId: 'agapp-2', applicationRef: 'VAG-202604-002', amount: 70, currency: 'EUR', method: 'STRIPE', status: 'pending', date: '2026-04-23T11:05:00Z', paidAt: null, stripePaymentIntentId: 'pi_3Pq9b1Hxk9Zm' },
  { id: 'agp-3', reference: 'PAY-AG-003', applicationId: 'agapp-3', applicationRef: 'VAG-202604-003', amount: 25500, currency: 'DZD', method: 'SATIM', status: 'paid', date: '2026-04-21T08:50:00Z', paidAt: '2026-04-21T08:52:00Z', satimOrderId: 'SATIM-7820-2026' },
  { id: 'agp-4', reference: 'PAY-AG-004', applicationId: 'agapp-4', applicationRef: 'VAG-202604-004', amount: 60, currency: 'EUR', method: 'STRIPE', status: 'refunded', date: '2026-04-19T14:25:00Z', paidAt: '2026-04-19T14:26:00Z', stripePaymentIntentId: 'pi_3Po5c8Hxk9Zn' },
  { id: 'agp-5', reference: 'PAY-AG-005', applicationId: 'agapp-5', applicationRef: 'VAG-202604-005', amount: 540, currency: 'EUR', method: 'STRIPE', status: 'pending', date: '2026-04-24T09:10:00Z', paidAt: null, stripePaymentIntentId: 'pi_3Pr1d5Hxk9Zo' },
];

// ============================================================
// CLIENT (B2C) MOCK DATA — Phase 7
// Reuses agencyVisaCatalog as the public visa catalog
// ============================================================

export type ClientApplicationMock = {
  id: string;
  reference: string;
  countryName: string;
  flagEmoji: string;
  visaTypeName: string;
  visaTypeId: string;
  numberOfPeople: number;
  status: AppStatus;
  email: string;
  phone: string;
  startDate: string;
  totalPrice: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
  passengers: PassengerMock[];
  timeline: { status: AppStatus; date: string; note?: string }[];
};

export type ClientPaymentMock = {
  id: string;
  reference: string;
  applicationId: string;
  applicationRef: string;
  countryName: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  date: string;
  paidAt?: string | null;
};

export type ClientNotificationMock = {
  id: string;
  type: 'application' | 'payment' | 'document' | 'info';
  title: string;
  message: string;
  date: string;
  read: boolean;
  applicationId?: string;
};

// Currently logged-in client (mock)
export const currentClient = {
  id: 'cli-1',
  fullName: 'Karim Bensalem',
  email: 'karim.b@gmail.com',
  phone: '+213 661 111 111',
  role: 'CLIENT' as const,
  isVerified: true,
  createdAt: '2026-01-12T10:00:00Z',
  avatarInitials: 'KB',
};

// Public visa catalog (B2C) — pricing in DZD (Algerian Dinar)
// Mock conversion rate applied: ~150 DZD per EUR
export const clientVisaCatalog: AgencyVisaTypeMock[] = agencyVisaCatalog.map(v => ({
  ...v,
  basePrice: v.currency === 'DZD' ? v.basePrice : Math.round(v.basePrice * 150 / 500) * 500, // round to nearest 500 DZD
  currency: 'DZD',
}));

const mkClientPassenger = (id: string, fn: string, ln: string, pp: string): PassengerMock => ({
  id, firstName: fn, lastName: ln,
  birthDate: '1990-03-15', birthPlace: 'Alger, Algérie', nationality: 'Algérienne',
  passportNumber: pp, passportIssueDate: '2022-01-10', passportExpiryDate: '2032-01-09',
  email: `${fn.toLowerCase()}.${ln.toLowerCase()}@gmail.com`, valid: true,
  documents: [
    { id: `${id}-d1`, key: 'passport', label: 'Passeport', filename: `passeport_${id}.pdf`, previewUrl: 'https://images.unsplash.com/photo-1569949381669-ecf31ae8e613?w=600', verified: true },
    { id: `${id}-d2`, key: 'photo', label: "Photo d'identité", filename: `photo_${id}.jpg`, previewUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=600', verified: true },
  ],
});

export const seedClientApplications: ClientApplicationMock[] = [
  {
    id: 'clapp-1', reference: 'VCL-202604-001',
    countryName: 'Turquie', flagEmoji: '🇹🇷',
    visaTypeName: 'Tourisme — 30 jours', visaTypeId: 'vt-tr-1',
    numberOfPeople: 2, status: 'APPROVED',
    email: 'karim.b@gmail.com', phone: '+213 661 111 111', startDate: '2026-05-15',
    totalPrice: 36000, currency: 'DZD',
    createdAt: '2026-04-15T09:30:00Z', updatedAt: '2026-04-19T14:00:00Z',
    passengers: [
      mkClientPassenger('clapp-1-p1', 'Karim', 'Bensalem', 'A1234567'),
      mkClientPassenger('clapp-1-p2', 'Lina', 'Bensalem', 'A1234568'),
    ],
    timeline: [
      { status: 'PENDING', date: '2026-04-15T09:30:00Z', note: 'Demande créée' },
      { status: 'UNDER_REVIEW', date: '2026-04-16T10:00:00Z', note: 'Documents en cours de vérification' },
      { status: 'APPROVED', date: '2026-04-19T14:00:00Z', note: 'visa approuvé — e-visa envoyé par email' },
    ],
  },
  {
    id: 'clapp-2', reference: 'VCL-202604-002',
    countryName: 'Égypte', flagEmoji: '🇪🇬',
    visaTypeName: 'Tourisme — Single entrée', visaTypeId: 'vt-eg-1',
    numberOfPeople: 1, status: 'UNDER_REVIEW',
    email: 'karim.b@gmail.com', phone: '+213 661 111 111', startDate: '2026-06-10',
    totalPrice: 12500, currency: 'DZD',
    createdAt: '2026-04-22T11:00:00Z', updatedAt: '2026-04-23T10:00:00Z',
    passengers: [mkClientPassenger('clapp-2-p1', 'Karim', 'Bensalem', 'A1234567')],
    timeline: [
      { status: 'PENDING', date: '2026-04-22T11:00:00Z', note: 'Demande créée' },
      { status: 'UNDER_REVIEW', date: '2026-04-23T10:00:00Z', note: 'En cours de traitement' },
    ],
  },
  {
    id: 'clapp-3', reference: 'VCL-202604-003',
    countryName: 'Émirats Arabes Unis', flagEmoji: '🇦🇪',
    visaTypeName: 'Tourisme — 60 jours', visaTypeId: 'vt-ae-1',
    numberOfPeople: 1, status: 'PENDING',
    email: 'karim.b@gmail.com', phone: '+213 661 111 111', startDate: '2026-07-20',
    totalPrice: 27000, currency: 'DZD',
    createdAt: '2026-04-24T15:30:00Z', updatedAt: '2026-04-24T15:30:00Z',
    passengers: [mkClientPassenger('clapp-3-p1', 'Karim', 'Bensalem', 'A1234567')],
    timeline: [{ status: 'PENDING', date: '2026-04-24T15:30:00Z', note: 'Demande créée — en attente de paiement' }],
  },
];

export const seedClientPayments: ClientPaymentMock[] = [
  { id: 'clp-1', reference: 'PAY-CL-001', applicationId: 'clapp-1', applicationRef: 'VCL-202604-001', countryName: 'Turquie', amount: 36000, currency: 'DZD', method: 'SATIM', status: 'paid', date: '2026-04-15T09:35:00Z', paidAt: '2026-04-15T09:36:30Z' },
  { id: 'clp-2', reference: 'PAY-CL-002', applicationId: 'clapp-2', applicationRef: 'VCL-202604-002', countryName: 'Égypte', amount: 12500, currency: 'DZD', method: 'SATIM', status: 'paid', date: '2026-04-22T11:05:00Z', paidAt: '2026-04-22T11:06:00Z' },
  { id: 'clp-3', reference: 'PAY-CL-003', applicationId: 'clapp-3', applicationRef: 'VCL-202604-003', countryName: 'Émirats Arabes Unis', amount: 27000, currency: 'DZD', method: 'SATIM', status: 'pending', date: '2026-04-24T15:30:00Z', paidAt: null },
];

export const seedClientNotifications: ClientNotificationMock[] = [
  { id: 'noti-1', type: 'application', title: 'visa approuvé 🎉', message: 'Votre demande de visa pour la Turquie a été approuvée. Le e-visa a été envoyé à votre email.', date: '2026-04-19T14:00:00Z', read: false, applicationId: 'clapp-1' },
  { id: 'noti-2', type: 'document', title: 'Documents vérifiés', message: 'Vos documents pour la demande VCL-202604-002 (Égypte) ont été vérifiés avec succès.', date: '2026-04-23T10:30:00Z', read: false, applicationId: 'clapp-2' },
  { id: 'noti-3', type: 'application', title: 'Demande en cours d\'examen', message: 'Votre demande pour l\'Égypte est maintenant en cours d\'examen par nos agents.', date: '2026-04-23T10:00:00Z', read: true, applicationId: 'clapp-2' },
  { id: 'noti-4', type: 'payment', title: 'Paiement reçu', message: 'Nous avons bien reçu votre paiement de 12 500 DZD pour la demande VCL-202604-002.', date: '2026-04-22T11:06:00Z', read: true, applicationId: 'clapp-2' },
  { id: 'noti-5', type: 'info', title: 'Bienvenue sur Visago', message: 'Merci de nous faire confiance pour vos demandes de visa. Notre équipe est disponible 7j/7.', date: '2026-01-12T10:05:00Z', read: true },
];

// Helpers for client portal
export const getClientApplication = (id: string) => seedClientApplications.find(a => a.id === id);
export const getClientPaymentByApp = (appId: string) => seedClientPayments.find(p => p.applicationId === appId);
