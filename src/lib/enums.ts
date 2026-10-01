export const EntryType = {
    SINGLE_ENTRY:   'SINGLE_ENTRY',
    MULTIPLE_ENTRY: 'MULTIPLE_ENTRY',
} as const;

export const VisaCategory = {
    E_VISA_TOURISM: 'E_VISA_TOURISM',
    CLASSIC_VISA:   'CLASSIC_VISA',
    EXTENSION_VISA: 'EXTENSION_VISA',
} as const;

export const ApplicationStatus = {
    PENDING:      'PENDING',
    UNDER_REVIEW: 'UNDER_REVIEW',
    APPROVED:     'APPROVED',
    REJECTED:     'REJECTED',
    CANCELLED:    'CANCELLED',
} as const;

export const PaymentStatus = {
    PENDING:  'PENDING',
    PAID:     'PAID',
    FAILED:   'FAILED',
    REFUNDED: 'REFUNDED',
} as const;

export const DiscountType = {
    PERCENTAGE:   'PERCENTAGE',
    FIXED_AMOUNT: 'FIXED_AMOUNT',
} as const;

// derive union types from the objects so you get full TS safety
export type EntryType        = typeof EntryType[keyof typeof EntryType];
export type VisaCategory     = typeof VisaCategory[keyof typeof VisaCategory];
export type ApplicationStatus = typeof ApplicationStatus[keyof typeof ApplicationStatus];
export type PaymentStatus    = typeof PaymentStatus[keyof typeof PaymentStatus];
export type DiscountType     = typeof DiscountType[keyof typeof DiscountType];