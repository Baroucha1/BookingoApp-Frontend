// Catalog of document requirements that can be attached to a visa type.
// Stored in visa_types.requirements as: [{ key: string, uploadable: boolean }]

export type DocumentRequirement = { key: string; uploadable: boolean };

export const DOCUMENT_CATALOG: { key: string; defaultUploadable: boolean; label: { fr: string; en: string; ar: string } }[] = [
  { key: 'passport', defaultUploadable: true, label: { fr: 'Passeport', en: 'Passport', ar: 'جواز السفر' } },
  { key: 'photo', defaultUploadable: false, label: { fr: 'Photo d\'identité', en: 'ID Photo', ar: 'صورة شخصية' } },
  { key: 'hotel', defaultUploadable: false, label: { fr: 'Réservation d\'hôtel', en: 'Hotel booking', ar: 'حجز الفندق' } },
  { key: 'flight', defaultUploadable: false, label: { fr: 'Billet d\'avion', en: 'Flight ticket', ar: 'تذكرة الطيران' } },
  { key: 'bank_statement', defaultUploadable: false, label: { fr: 'Relevé bancaire', en: 'Bank statement', ar: 'كشف حساب بنكي' } },
  { key: 'invitation', defaultUploadable: false, label: { fr: 'Lettre d\'invitation', en: 'Invitation letter', ar: 'رسالة دعوة' } },
  { key: 'travel_insurance', defaultUploadable: false, label: { fr: 'Assurance voyage', en: 'Travel insurance', ar: 'تأمين السفر' } },
  { key: 'employment', defaultUploadable: false, label: { fr: 'Justificatif d\'emploi', en: 'Employment proof', ar: 'إثبات العمل' } },
];

export const DEFAULT_REQUIREMENTS: DocumentRequirement[] = [
  { key: 'passport', uploadable: true },
  { key: 'photo', uploadable: false },
  { key: 'hotel', uploadable: false },
  { key: 'flight', uploadable: false },
];

export const getDocLabel = (key: string, lang: 'fr' | 'en' | 'ar'): string => {
  const doc = DOCUMENT_CATALOG.find(d => d.key === key);
  return doc ? doc.label[lang] : key;
};

export const parseRequirements = (raw: unknown): DocumentRequirement[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((r): r is DocumentRequirement =>
      !!r && typeof r === 'object' && typeof (r as DocumentRequirement).key === 'string'
    )
    .map(r => ({ key: r.key, uploadable: !!r.uploadable }));
};
