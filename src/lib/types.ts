// =============================================================================
// ENUMS
// =============================================================================

export type UserRole         = 'ADMIN' | 'AGENCY' | 'CLIENT';
export type EntryType        = 'SINGLE_ENTRY' | 'MULTIPLE_ENTRY';
export type VisaCategory     = 'E_VISA_TOURISM' | 'CLASSIC_VISA' | 'EXTENSION_VISA';
export type ApplicationStatus = 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type PaymentStatus    = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
export type PaymentMethod    = 'STRIPE' | 'SATIM' | 'BANK_TRANSFER' | 'CASH';
export type RefundStatus     = 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'PROCESSED';
export type DiscountType     = 'PERCENTAGE' | 'FIXED_AMOUNT';
export type ImageType        = 'FLAG' | 'HERO' | 'GALLERY' | 'THUMBNAIL';

// =============================================================================
// IMAGE
// =============================================================================

export interface Image {
    id:        string;
    url:       string;
    imageType: ImageType;
    isMain:    boolean;
    sortOrder: number;
    altTextAr: string | null;
    altTextFr: string | null;
    altTextEn: string | null;
    countryId: string | null;
    createdAt: string;
    updatedAt: string;
}

// =============================================================================
// DOCUMENT SYSTEM
// =============================================================================

export interface DocumentType {
    id:            string;
    key:           string;
    labelAr:       string;
    labelFr:       string;
    labelEn:       string;
    descriptionAr: string | null;
    descriptionFr: string | null;
    descriptionEn: string | null;
    createdAt:     string;
    updatedAt:     string;
}

export interface VisaTypeDocumentRequirement {
    id:            string;
    isRequired:    boolean;
    allowsUpload:  boolean;
    notesAr:       string | null;
    notesFr:       string | null;
    notesEn:       string | null;
    visaTypeId:    string;
    documentTypeId: string;
    documentType:  DocumentType;
    createdAt:     string;
    updatedAt:     string;
}

// =============================================================================
// COUNTRY
// =============================================================================

export interface Country {
    id:               string;
    code:             string;
    isActive:         boolean;
    nameAr:           string;
    nameFr:           string;
    nameEn:           string;
    descriptionAr:    string | null;
    descriptionFr:    string | null;
    descriptionEn:    string | null;
    pointFortsAr:     string | null;
    pointFortsFr:     string | null;
    pointFortsEn:     string | null;
    lieuxAVisiterAr:  string | null;
    lieuxAVisiterFr:  string | null;
    lieuxAVisiterEn:  string | null;
    conseilsVoyageAr: string | null;
    conseilsVoyageFr: string | null;
    conseilsVoyageEn: string | null;
    images:           Image[];
    visaTypes:        VisaType[];
    createdAt:        string;
    updatedAt:        string;
}

// =============================================================================
// VISA TYPE
// =============================================================================

export interface VisaType {
    id:              string;
    nameAr:          string;
    nameFr:          string;
    nameEn:          string;
    descriptionAr:   string | null;
    descriptionFr:   string | null;
    descriptionEn:   string | null;
    category:        VisaCategory;
    entryType:       EntryType;
    duration:        number;
    price:           number;
    currency:        string;
    processingDelay: number;
    isActive:        boolean;
    conditionsAr:    string | null;
    conditionsFr:    string | null;
    conditionsEn:    string | null;
    countryId:       string;
    country:         Country;
    documentRequirements: VisaTypeDocumentRequirement[];
    createdAt:       string;
    updatedAt:       string;
}

// =============================================================================
// COUNTRY GROUP (computed — not a DB model, built in the API layer)
// =============================================================================

export interface CountryGroup {
    code:            string;
    nameFr:          string;
    nameEn:          string;
    nameAr:          string;
    country:         Country;
    flag_url:        string | null;
    hero_url:        string | null;
    thumb_url:       string | null;
    min_price:       number;
    currency:        string;
    min_stay:        number;
    processing_days: number;
    visa_count:      number;
    visaTypes:       VisaType[];
}

// =============================================================================
// USER & AUTH
// =============================================================================

export interface AuthUser {
    id:    string;
    email: string;
    phone: string | null;
    role:  UserRole;
}

// =============================================================================
// AGENCY GROUP & PRICING
// =============================================================================

export interface AgencyGroup {
    id:        string;
    name:      string;
    createdAt: string;
    updatedAt: string;
}

export interface AgencyGroupVisaPrice {
    id:        string;
    price:     number;
    currency:  string;
    groupId:   string;
    group:     AgencyGroup;
    visaTypeId: string;
    visaType:  VisaType;
}

// =============================================================================
// PASSENGER & DOCUMENTS
// =============================================================================

export interface PassengerDocument {
    id:           string;
    fileUrl:      string;
    originalName: string;
    isVerified:   boolean;
    verifiedAt:   string | null;
    passengerId:  string;
    requirementId: string;
    requirement:  VisaTypeDocumentRequirement;
    createdAt:    string;
    updatedAt:    string;
}

export interface Passenger {
    id:                 string;
    firstName:          string;
    lastName:           string;
    birthDate:          string;
    birthPlace:         string;
    nationality:        string | null;
    passportNumber:     string;
    passportIssueDate:  string;
    passportExpiryDate: string;
    email:              string | null;
    applicationId?:      string;
    documents:          PassengerDocument[];
    createdAt:          string;
    updatedAt:          string;
}

// =============================================================================
// VISA APPLICATION
// =============================================================================

export interface OfficeSummary {
    id:     string;
    name:   string;
    wilaya: string;
}

export interface VisaApplication {
    id:            string;
    email:         string;
    phone:         string;
    startDate:     string;
    numberOfPeople: number;
    status:        ApplicationStatus;
    visaTypeId:    string;
    visaType:      VisaType;
    clientId:      string | null;
    agencyId:      string | null;
    officeId:      string | null;
    office:        OfficeSummary | null;
    passengers:    Passenger[];
    payment:       Payment | null;
    createdAt:     string;
    updatedAt:     string;
}

// =============================================================================
// PAYMENT
// =============================================================================

export interface Payment {
    id:                    string;
    amount:                number;
    currency:              string;
    method:                PaymentMethod;
    status:                PaymentStatus;
    satimOrderId:          string | null;
    receiptNumber:         number | null;
    receiptRef:            string | null;
    satimApprovalCode:     string | null;
    satimIdentifiant:      string | null;
    satimOrderNumber:      string | null;
    stripePaymentIntentId: string | null;
    stripeClientSecret:    string | null;
    stripeReceiptUrl:      string | null;
    satimOrderId:          string | null;
    refundReason:          string | null;
    refundRequestedAt:     string | null;
    refundStatus:          RefundStatus | null;
    refundedAt:            string | null;
    refundAmount:          number | null;
    paidAt:                string | null;
    visaApplicationId:     string;
    clientId:              string | null;
    agencyId:              string | null;
    createdAt:             string;
    updatedAt:             string;
}

// =============================================================================
// SERVICE INPUT TYPES
// =============================================================================

export interface PassengerInput {
    applicationId?:     string;  // optional — assigned by backend during transaction
    firstName:          string;
    lastName:           string;
    birthDate:          string;
    birthPlace?:        string;
    nationality?:       string | null;
    passportNumber:     string;
    passportIssueDate:  string;
    passportExpiryDate: string;
    email?:             string | null;
}

export interface DocumentInput {
    requirementId: string;
    fileUrl:       string;
    originalName:  string;
}

export interface PassengerWithDocuments extends PassengerInput {
    documents: DocumentInput[];
}

export interface ApplicationInput {
    visaTypeId:      string;
    email:           string;
    phone:           string;
    startDate:       string;
    numberOfPeople?: number;
    clientId?:       string | null;
    agencyId?:       string | null;
    passengers:      PassengerWithDocuments[];
}


