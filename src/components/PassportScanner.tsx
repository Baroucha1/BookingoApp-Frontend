import { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Camera,
  Upload,
  Loader2,
  ScanLine,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/i18n/LanguageContext';

/* =========================================================
   DEBUG
   When true, the console prints a blob: link to an image of
   the passport with the OCR zones drawn on it. Open it to
   check that the red boxes cover the right fields.
   Set to false in production.
========================================================= */

const DEBUG_ZONES = true;

/* =========================================================
   TYPES
========================================================= */

export type MrzResult = {
  firstName: string;
  lastName: string;
  birthDate: string;
  birthPlace: string;
  nationality: string;
  passportNumber: string;
  passportIssueDate: string;
  passportExpiryDate: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResult: (data: MrzResult) => void;
};

type Rect = { x: number; y: number; w: number; h: number };

/* Position of the MRZ first line, in original image pixels. */
type MrzAnchor = { left: number; top: number; width: number };

type ZoneName = 'lastName' | 'firstName' | 'birthPlace' | 'issueDate';

type ZoneSpec = {
  name: ZoneName;
  labels: string[];
  /*
   * rel  : relative to the MRZ. Origin = top-left of MRZ line 1,
   *        unit = MRZ width (for both x and y).
   * page : fallback, relative to the whole image (0..1).
   */
  rel: Rect;
  page: Rect;
};

/* =========================================================
   CONSTANTS
========================================================= */

const NATIONALITY_MAP: Record<string, string> = {
  DZA: 'Algérienne',
  FRA: 'Française',
  MAR: 'Marocaine',
  TUN: 'Tunisienne',
  USA: 'Américaine',
  GBR: 'Britannique',
  DEU: 'Allemande',
  ESP: 'Espagnole',
  ITA: 'Italienne',
  CAN: 'Canadienne',
  TUR: 'Turque',
  EGY: 'Égyptienne',
  SAU: 'Saoudienne',
  ARE: 'Émiratie',
  CHN: 'Chinoise',
  JPN: 'Japonaise',
  IND: 'Indienne',
  RUS: 'Russe',
  BRA: 'Brésilienne',
  MEX: 'Mexicaine',
  PRT: 'Portugaise',
  NLD: 'Néerlandaise',
  BEL: 'Belge',
  CHE: 'Suisse',
  SEN: 'Sénégalaise',
  NGA: 'Nigériane',
  ZAF: 'Sud-Africaine',
};

const NAME_LABELS = ['NOM', 'SURNAME', 'LAST NAME', 'FAMILY NAME', 'NOM DE FAMILLE'];

const FIRST_NAME_LABELS = [
  'PRENOM',
  'PRENOMS',
  'PRENOM(S)',
  'GIVEN NAME',
  'GIVEN NAMES',
  'GIVEN NAME(S)',
  'FIRST NAME',
];

const BIRTHPLACE_LABELS = [
  'LIEU DE NAISSANCE',
  'LIEU NAISSANCE',
  'PLACE OF BIRTH',
  'BIRTH PLACE',
];

const BIRTHDATE_LABELS = [
  'DATE DE NAISSANCE',
  'DATE NAISSANCE',
  'DATE OF BIRTH',
  'BIRTH DATE',
];

const ISSUE_LABELS = [
  'DATE DE DELIVRANCE',
  'DATE DELIVRANCE',
  'DATE OF ISSUE',
  'DATE OF ISSUANCE',
  'ISSUE DATE',
];

const EXPIRY_LABELS = [
  'DATE D EXPIRATION',
  'DATE DE EXPIRATION',
  'DATE EXPIRATION',
  'DATE OF EXPIRY',
  'DATE OF EXPIRATION',
  'EXPIRY DATE',
];

const PASSPORT_NUMBER_LABELS = [
  'NUMERO DU PASSEPORT',
  'NUMERO PASSEPORT',
  'N° PASSEPORT',
  'NO PASSEPORT',
  'PASSPORT NUMBER',
  'PASSPORT NO',
  'PASSPORT N',
];

const OTHER_LABELS = [
  'NATIONALITE',
  'NATIONALITY',
  'SEXE',
  'SEX',
  'AUTORITE',
  'AUTHORITY',
  'TYPE',
  'CODE',
  'PAYS',
  'COUNTRY',
  'SIGNATURE',
  'PASSEPORT',
  'PASSPORT',
  'PERSONAL NO',
  'N PERSONNEL',
  'REPUBLIQUE ALGERIENNE DEMOCRATIQUE ET POPULAIRE',
  'PEOPLE S DEMOCRATIC REPUBLIC OF ALGERIA',
  'DZA',
  'ALGERIENNE',
  'NAMES',
];

/*
 * Zones calibrated on the Algerian biometric passport data page.
 * Each zone covers the field's label AND its value (generous boxes
 * tolerate small framing errors; label words are removed afterwards).
 */
const ZONES: ZoneSpec[] = [
  {
    name: 'lastName',
    labels: NAME_LABELS,
    rel: { x: 0.29, y: -0.505, w: 0.37, h: 0.095 },
    page: { x: 0.3, y: 0.14, w: 0.33, h: 0.12 },
  },
  {
    name: 'firstName',
    labels: FIRST_NAME_LABELS,
    rel: { x: 0.29, y: -0.415, w: 0.37, h: 0.1 },
    page: { x: 0.3, y: 0.245, w: 0.33, h: 0.12 },
  },
  {
    name: 'birthPlace',
    labels: BIRTHPLACE_LABELS,
    rel: { x: 0.29, y: -0.255, w: 0.37, h: 0.1 },
    page: { x: 0.3, y: 0.44, w: 0.33, h: 0.12 },
  },
  {
    name: 'issueDate',
    labels: ISSUE_LABELS,
    rel: { x: 0.65, y: -0.285, w: 0.38, h: 0.075 },
    page: { x: 0.62, y: 0.4, w: 0.36, h: 0.09 },
  },
];

const MRZ_RATIOS = [0.2, 0.25, 0.3, 0.35];

const MAX_OCR_SIDE = 3500;

const ARABIC_REGEX =
  /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]+/g;

/* =========================================================
   NORMALIZATION
========================================================= */

function removeAccents(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function normalizeLabel(value: string): string {
  return removeAccents(value)
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanText(value: unknown): string {
  if (!value) return '';
  return String(value).replace(/\s+/g, ' ').trim();
}

function cleanName(value: unknown): string {
  if (!value) return '';
  return removeAccents(String(value))
    .toUpperCase()
    .replace(/[^A-Z\s'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/*
 * Person names: drops OCR noise tokens (single letters,
 * tokens without vowels, "LLLL"-style repeats).
 */
function cleanPersonName(value: unknown): string {
  return cleanName(value)
    .split(' ')
    .filter(
      token =>
        token.length >= 2 && /[AEIOUY]/.test(token) && !/(.)\1{2,}/.test(token)
    )
    .join(' ');
}

function cleanBirthPlace(value: unknown): string {
  if (!value) return '';
  return removeAccents(String(value))
    .toUpperCase()
    .replace(/[^A-Z\s'().-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isPlausibleText(value: string): boolean {
  if (!value) return false;
  const letters = value.replace(/[^A-Z]/g, '');
  return letters.length >= 2 && /[AEIOUY]/.test(letters) && !/(.)\1{2,}/.test(letters);
}

/* =========================================================
   LABEL VOCABULARY (fuzzy, tolerant to 1 OCR error)
========================================================= */

const LABEL_WORDS = new Set(
  [
    ...NAME_LABELS,
    ...FIRST_NAME_LABELS,
    ...BIRTHPLACE_LABELS,
    ...BIRTHDATE_LABELS,
    ...ISSUE_LABELS,
    ...EXPIRY_LABELS,
    ...PASSPORT_NUMBER_LABELS,
    ...OTHER_LABELS,
  ].flatMap(label => normalizeLabel(label).split(' ').filter(Boolean))
);

const LONG_LABEL_WORDS = [...LABEL_WORDS].filter(word => word.length >= 4);

function editDistance(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 1) return 2;

  const row = Array.from({ length: b.length + 1 }, (_, i) => i);

  for (let i = 1; i <= a.length; i++) {
    let diagonal = row[0];
    row[0] = i;

    for (let j = 1; j <= b.length; j++) {
      const previous = row[j];
      row[j] = Math.min(
        row[j] + 1,
        row[j - 1] + 1,
        diagonal + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
      diagonal = previous;
    }
  }

  return row[b.length];
}

function tokensMatch(token: string, labelToken: string): boolean {
  if (token === labelToken) return true;
  return token.length >= 4 && labelToken.length >= 4 && editDistance(token, labelToken) <= 1;
}

function isLabelToken(token: string): boolean {
  if (LABEL_WORDS.has(token)) return true;
  return token.length >= 4 && LONG_LABEL_WORDS.some(word => editDistance(token, word) <= 1);
}

function isProbablyLabel(value: string): boolean {
  const tokens = normalizeLabel(value).split(' ').filter(Boolean);
  return tokens.length > 0 && tokens.every(isLabelToken);
}

function stripLabelWords(value: string): string {
  return normalizeLabel(value)
    .split(' ')
    .filter(token => token && !isLabelToken(token))
    .join(' ');
}

function looksLikeLatinValue(value: string): boolean {
  if (!value) return false;
  if (/[\u0600-\u06FF]/.test(value)) return false;

  const compact = value.replace(/\s/g, '');
  if (!compact) return false;

  const letters = compact.replace(/[^A-Za-zÀ-ÿ'-]/g, '');

  return letters.length >= 2 && letters.length / compact.length >= 0.8;
}

function isAcceptableValue(value: string): boolean {
  return value.length >= 2 && looksLikeLatinValue(value) && !isProbablyLabel(value);
}

/* =========================================================
   DATE PARSING
========================================================= */

const MONTHS: Record<string, string> = {
  JAN: '01',
  JANV: '01',
  JANVIER: '01',
  JANUARY: '01',
  FEB: '02',
  FEV: '02',
  FEVR: '02',
  FEVRIER: '02',
  FEBRUARY: '02',
  MAR: '03',
  MARS: '03',
  MARCH: '03',
  APR: '04',
  AVR: '04',
  AVRIL: '04',
  APRIL: '04',
  MAY: '05',
  MAI: '05',
  JUN: '06',
  JUIN: '06',
  JUNE: '06',
  JUL: '07',
  JUIL: '07',
  JUILLET: '07',
  JULY: '07',
  AUG: '08',
  AOUT: '08',
  AUGUST: '08',
  SEP: '09',
  SEPT: '09',
  SEPTEMBRE: '09',
  SEPTEMBER: '09',
  OCT: '10',
  OCTOBRE: '10',
  OCTOBER: '10',
  NOV: '11',
  NOVEMBRE: '11',
  NOVEMBER: '11',
  DEC: '12',
  DECEMBRE: '12',
  DECEMBER: '12',
};

const MONTH_PATTERN = Object.keys(MONTHS)
  .sort((a, b) => b.length - a.length)
  .join('|');

const DATE_SEP = '(?:\\s*[./-]\\s*|\\s+)';

const NUMERIC_DATE_SOURCE = `\\b\\d{1,2}${DATE_SEP}\\d{1,2}${DATE_SEP}\\d{4}\\b`;

const TEXT_DATE_SOURCE = `\\b\\d{1,2}\\s*(?:${MONTH_PATTERN})\\s*\\d{4}\\b`;

const ANY_DATE_SOURCE = `(?:${NUMERIC_DATE_SOURCE})|(?:${TEXT_DATE_SOURCE})`;

function validDateParts(year: number, month: number, day: number): boolean {
  if (year < 1900 || year > 2200 || month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }

  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function toIso(year: number, month: number, day: number): string {
  if (!validDateParts(year, month, day)) return '';
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function normalizeDateText(value: string): string {
  return removeAccents(value)
    .toUpperCase()
    .replace(/,/g, ' ')
    .replace(/([A-Z])\./g, '$1 ')
    .replace(/([A-Z]+)\s*\/\s*[A-Z]+/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

/* Fixes O→0, I/l→1, S→5, B→8 inside numeric tokens ("2O21" → "2021"). */
function fixDateOcr(value: string): string {
  return value.replace(/\b[0-9OoIl|SB]{2,4}\b/g, token =>
    /\d/.test(token)
      ? token
          .replace(/[Oo]/g, '0')
          .replace(/[Il|]/g, '1')
          .replace(/S/g, '5')
          .replace(/B/g, '8')
      : token
  );
}

function visualDateToIso(value: string): string {
  if (!value) return '';

  const text = normalizeDateText(value);

  let match = text.match(
    new RegExp(`^(\\d{1,2})${DATE_SEP}(\\d{1,2})${DATE_SEP}(\\d{4})$`)
  );

  if (match) {
    return toIso(Number(match[3]), Number(match[2]), Number(match[1]));
  }

  match = text.match(/^(\d{4})\s*[./-]\s*(\d{1,2})\s*[./-]\s*(\d{1,2})$/);

  if (match) {
    return toIso(Number(match[1]), Number(match[2]), Number(match[3]));
  }

  match = text.match(/^(\d{1,2})\s*([A-Z]+)\s*(\d{4})$/);

  if (match) {
    const month = Number(MONTHS[match[2]]);
    if (month) return toIso(Number(match[3]), month, Number(match[1]));
  }

  return '';
}

function extractDates(text: string): string[] {
  if (!text) return [];

  const normalized = normalizeDateText(fixDateOcr(text));
  const matches = normalized.match(new RegExp(ANY_DATE_SOURCE, 'g')) || [];
  const results: string[] = [];

  for (const value of matches) {
    const iso = visualDateToIso(value);
    if (iso && !results.includes(iso)) results.push(iso);
  }

  return results;
}

function removeDates(text: string): string {
  return normalizeDateText(text)
    .replace(new RegExp(ANY_DATE_SOURCE, 'g'), ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function mrzDateToIso(value: string, isExpiry = false): string {
  if (!value || !/^\d{6}$/.test(value)) return '';

  const yy = Number(value.substring(0, 2));
  const month = Number(value.substring(2, 4));
  const day = Number(value.substring(4, 6));
  const currentYY = new Date().getFullYear() % 100;

  const year = isExpiry ? 2000 + yy : yy > currentYY ? 1900 + yy : 2000 + yy;

  return toIso(year, month, day);
}

/* =========================================================
   PASSPORT NUMBER
========================================================= */

function cleanPassportNumber(value: unknown): string {
  if (!value) return '';
  return String(value)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .trim();
}

/* =========================================================
   MRZ
========================================================= */

function normalizeMrzText(raw: string): string {
  return raw.toUpperCase().replace(/[«‹›]/g, '<').replace(/\r/g, '\n');
}

function extractTd3Mrz(raw: string): string[] | null {
  const lines = normalizeMrzText(raw)
    .split('\n')
    .map(line => line.replace(/[^A-Z0-9<]/g, '').trim())
    .filter(line => line.length >= 35);

  for (let i = 0; i < lines.length - 1; i++) {
    let line1 = lines[i];
    let line2 = lines[i + 1];

    const pIndex = line1.indexOf('P<');
    if (pIndex < 0) continue;

    line1 = line1.substring(pIndex);
    if (line1.length < 40 || line2.length < 40) continue;

    line1 = line1.substring(0, 44);
    line2 = line2.substring(0, 44);

    if (line1.length === 44 && line2.length === 44) return [line1, line2];
  }

  const joined = lines.join('');
  const pIndex = joined.indexOf('P<');

  if (pIndex >= 0 && joined.length - pIndex >= 88) {
    const candidate = joined.substring(pIndex);
    const line1 = candidate.substring(0, 44);
    const line2 = candidate.substring(44, 88);

    if (line1.length === 44 && line2.length === 44) return [line1, line2];
  }

  return null;
}

/*
 * Robust TD3 name parser.
 *
 * Tesseract often reads the "<" filler as K, L, C or E:
 *   P<DZABOUFAIN<K<MOHAMED<ALI<<LLLLLLLLLLLLLL
 *
 * 1. Trailing filler runs (<<<<, LLLL, KKKK...) are removed.
 * 2. "<K<", "<L<"... are restored to the "<<" separator.
 * 3. If the separator is still missing, the surname read from
 *    the visual zone is used to decide where to split.
 */
function parseMrzName(line1: string, visualLastNameHint = '') {
  if (!line1 || line1.length < 10) {
    return { lastName: '', firstName: '', confident: false };
  }

  let field = line1
    .substring(5, 44)
    .toUpperCase()
    .replace(/0/g, 'O')
    .replace(/1/g, 'I')
    .replace(/5/g, 'S')
    .replace(/8/g, 'B')
    .replace(/[^A-Z<]/g, '<');

  let previous = '';

  while (previous !== field) {
    previous = field;
    field = field.replace(/<+$/, '').replace(/(.)\1{2,}$/, '');
  }

  field = field.replace(/<[KLCE]</g, '<<').replace(/^<+/, '');

  const toName = (value: string) => cleanPersonName(value.replace(/</g, ' '));

  const separator = field.indexOf('<<');

  if (separator >= 0) {
    const lastName = toName(field.substring(0, separator));
    const firstName = toName(field.substring(separator + 2));

    if (lastName && firstName) {
      return { lastName, firstName, confident: true };
    }
  }

  const tokens = toName(field).split(' ').filter(Boolean);

  const hintCount = cleanPersonName(visualLastNameHint).split(' ').filter(Boolean).length;

  if (hintCount > 0 && hintCount < tokens.length) {
    return {
      lastName: tokens.slice(0, hintCount).join(' '),
      firstName: tokens.slice(hintCount).join(' '),
      confident: false,
    };
  }

  return { lastName: tokens.join(' '), firstName: '', confident: false };
}

function parseMrzFields(parsed: any) {
  const fields = parsed?.fields || {};
  const nationalityCode = String(fields.nationality || '').toUpperCase().trim();

  return {
    passportNumber: cleanPassportNumber(fields.documentNumber),
    nationality: NATIONALITY_MAP[nationalityCode] || nationalityCode,
    birthDate: mrzDateToIso(String(fields.birthDate || ''), false),
    expiryDate: mrzDateToIso(String(fields.expirationDate || ''), true),
  };
}

/*
 * MRZ is preferred. The visual value wins only when it is the
 * MRZ value plus extra letters (MRZ lost a trailing letter or
 * truncated a long name).
 */
function chooseName(mrzValue: string, visualValue: string): string {
  const mrz = isPlausibleText(mrzValue) ? mrzValue : '';
  const visual = isPlausibleText(visualValue) ? visualValue : '';

  if (mrz && visual && visual.length > mrz.length && visual.startsWith(mrz)) {
    return visual;
  }

  return mrz || visual;
}

/* =========================================================
   OCR DATA HELPERS
========================================================= */

type OcrLineBox = {
  text: string;
  bbox: { x0: number; y0: number; x1: number; y1: number };
};

/* Works with tesseract.js v5 (data.lines) and v6 (data.blocks). */
function getLineBoxes(data: any): OcrLineBox[] {
  if (Array.isArray(data?.lines) && data.lines.length) return data.lines;

  const result: OcrLineBox[] = [];

  for (const block of data?.blocks ?? []) {
    for (const paragraph of block?.paragraphs ?? []) {
      for (const line of paragraph?.lines ?? []) {
        result.push(line);
      }
    }
  }

  return result;
}

function findMrzAnchor(
  data: any,
  crop: Rect,
  scale: number,
  imageWidth: number,
  imageHeight: number
): MrzAnchor | null {
  const boxes = getLineBoxes(data)
    .map(line => ({
      text: String(line.text || '')
        .toUpperCase()
        .replace(/[^A-Z0-9<]/g, ''),
      bbox: line.bbox,
    }))
    .filter(line => line.bbox && line.text.length >= 30);

  const index = boxes.findIndex(line => line.text.includes('P<'));
  if (index < 0) return null;

  const line1 = boxes[index];
  const line2 = boxes[index + 1];

  const x0 = Math.min(line1.bbox.x0, line2?.bbox.x0 ?? Infinity);
  const x1 = Math.max(line1.bbox.x1, line2?.bbox.x1 ?? -Infinity);

  const anchor: MrzAnchor = {
    left: crop.x + x0 / scale,
    top: crop.y + line1.bbox.y0 / scale,
    width: (x1 - x0) / scale,
  };

  const plausible =
    anchor.width >= imageWidth * 0.5 &&
    anchor.width <= imageWidth * 1.02 &&
    anchor.top >= imageHeight * 0.4;

  return plausible ? anchor : null;
}

function getOcrLines(text: string): string[] {
  return text
    .replace(/\r/g, '\n')
    .split('\n')
    .map(line =>
      line
        .replace(ARABIC_REGEX, ' ')
        .replace(/[|]/g, 'I')
        .replace(/\s+/g, ' ')
        .trim()
    )
    .filter(line => line.length > 0);
}

/* =========================================================
   IMAGE
========================================================= */

async function renderRegion(
  bitmap: ImageBitmap,
  rect: Rect,
  scale = 2,
  preprocess = true
): Promise<{ blob: Blob; scale: number; rect: Rect }> {
  const x = Math.min(bitmap.width - 1, Math.max(0, Math.round(rect.x)));
  const y = Math.min(bitmap.height - 1, Math.max(0, Math.round(rect.y)));
  const w = Math.max(1, Math.min(bitmap.width - x, Math.round(rect.w)));
  const h = Math.max(1, Math.min(bitmap.height - y, Math.round(rect.h)));

  const effectiveScale = Math.min(scale, MAX_OCR_SIDE / Math.max(w, h));

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(w * effectiveScale));
  canvas.height = Math.max(1, Math.round(h * effectiveScale));

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas indisponible.');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, x, y, w, h, 0, 0, canvas.width, canvas.height);

  if (preprocess) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = imageData.data;

    for (let i = 0; i < d.length; i += 4) {
      const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      const contrasted = Math.max(0, Math.min(255, (gray - 128) * 1.35 + 128));
      d[i] = d[i + 1] = d[i + 2] = contrasted;
    }

    ctx.putImageData(imageData, 0, 0);
  }

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      result => (result ? resolve(result) : reject(new Error('Impossible de créer la zone OCR.'))),
      'image/png'
    );
  });

  return { blob, scale: effectiveScale, rect: { x, y, w, h } };
}

function zoneRect(zone: ZoneSpec, anchor: MrzAnchor | null, width: number, height: number): Rect {
  if (anchor) {
    return {
      x: anchor.left + zone.rel.x * anchor.width,
      y: anchor.top + zone.rel.y * anchor.width,
      w: zone.rel.w * anchor.width,
      h: zone.rel.h * anchor.width,
    };
  }

  return {
    x: zone.page.x * width,
    y: zone.page.y * height,
    w: zone.page.w * width,
    h: zone.page.h * height,
  };
}

async function createDebugImage(
  bitmap: ImageBitmap,
  zones: { name: string; rect: Rect }[],
  anchor: MrzAnchor | null
): Promise<string> {
  const ratio = Math.min(1, 1400 / bitmap.width);

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * ratio);
  canvas.height = Math.round(bitmap.height * ratio);

  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  ctx.lineWidth = 3;
  ctx.font = 'bold 16px sans-serif';

  if (anchor) {
    ctx.strokeStyle = '#2563eb';
    ctx.strokeRect(
      anchor.left * ratio,
      anchor.top * ratio,
      anchor.width * ratio,
      anchor.width * 0.1 * ratio
    );
  }

  ctx.strokeStyle = '#dc2626';
  ctx.fillStyle = '#dc2626';

  for (const zone of zones) {
    ctx.strokeRect(zone.rect.x * ratio, zone.rect.y * ratio, zone.rect.w * ratio, zone.rect.h * ratio);
    ctx.fillText(zone.name, zone.rect.x * ratio + 4, zone.rect.y * ratio + 16);
  }

  return new Promise(resolve => {
    canvas.toBlob(blob => resolve(blob ? URL.createObjectURL(blob) : ''), 'image/png');
  });
}

/* =========================================================
   LABEL / VALUE EXTRACTION
========================================================= */

function findTokenSequence(tokens: string[], sequence: string[]): number {
  for (let start = 0; start <= tokens.length - sequence.length; start++) {
    let matches = true;

    for (let k = 0; k < sequence.length; k++) {
      if (!tokensMatch(tokens[start + k], sequence[k])) {
        matches = false;
        break;
      }
    }

    if (matches) return start;
  }

  return -1;
}

function findValueAfterLabel(lines: string[], labels: string[], maxNextLines = 3): string {
  const sequences = labels
    .map(label => normalizeLabel(label).split(' ').filter(Boolean))
    .filter(sequence => sequence.length > 0);

  for (let i = 0; i < lines.length; i++) {
    const tokens = normalizeLabel(lines[i]).split(' ').filter(Boolean);

    for (const sequence of sequences) {
      const start = findTokenSequence(tokens, sequence);
      if (start < 0) continue;

      const after = stripLabelWords(removeDates(tokens.slice(start + sequence.length).join(' ')));

      if (isAcceptableValue(after)) return after;

      for (let j = i + 1; j <= Math.min(i + maxNextLines, lines.length - 1); j++) {
        const candidateLine = cleanText(lines[j]);
        if (!candidateLine) continue;
        if (isProbablyLabel(candidateLine)) break;

        const candidate = stripLabelWords(removeDates(candidateLine));
        if (isAcceptableValue(candidate)) return candidate;
      }
    }
  }

  return '';
}

function findDateNearLabel(lines: string[], labels: string[]): string {
  const normalizedLabels = labels.map(normalizeLabel);

  for (let i = 0; i < lines.length; i++) {
    const normalized = normalizeLabel(lines[i]);
    if (!normalizedLabels.some(label => normalized.includes(label))) continue;

    const sameLine = extractDates(lines[i]);
    if (sameLine.length) return sameLine[0];

    for (let j = i + 1; j <= Math.min(i + 4, lines.length - 1); j++) {
      const dates = extractDates(lines[j]);
      if (dates.length) return dates[0];
    }
  }

  return '';
}

/* Value of one zone (the zone contains the label + the value). */
function extractZoneValue(zone: ZoneSpec, text: string): string {
  const lines = getOcrLines(text);

  if (zone.name === 'issueDate') {
    for (const line of lines) {
      const dates = extractDates(line);
      if (dates.length) return dates[0];
    }
    return '';
  }

  let value = findValueAfterLabel(lines, zone.labels, 2);

  if (!value) {
    for (const line of lines) {
      if (isProbablyLabel(line)) continue;

      const candidate = stripLabelWords(removeDates(line));

      if (isAcceptableValue(candidate)) {
        value = candidate;
        break;
      }
    }
  }

  const cleaned = zone.name === 'birthPlace' ? cleanBirthPlace(value) : cleanPersonName(value);

  return isPlausibleText(cleaned) ? cleaned : '';
}

/* Whole-page fallback (used only when a zone returns nothing). */
function parseVisualText(text: string) {
  const lines = getOcrLines(text);

  const allDates: string[] = [];
  for (const line of lines) {
    for (const date of extractDates(line)) {
      if (!allDates.includes(date)) allDates.push(date);
    }
  }

  const lastName = cleanPersonName(findValueAfterLabel(lines, NAME_LABELS, 3));
  const firstName = cleanPersonName(findValueAfterLabel(lines, FIRST_NAME_LABELS, 3));
  const birthPlace = cleanBirthPlace(findValueAfterLabel(lines, BIRTHPLACE_LABELS, 3));

  return {
    lastName: isPlausibleText(lastName) ? lastName : '',
    firstName: isPlausibleText(firstName) ? firstName : '',
    birthPlace: isPlausibleText(birthPlace) ? birthPlace : '',
    issueDate: findDateNearLabel(lines, ISSUE_LABELS),
    allDates,
  };
}

function pickIssueDate(
  allDates: string[],
  labeled: string,
  birthDate: string,
  expiryDate: string
): string {
  const candidates = allDates.filter(
    date =>
      date !== birthDate &&
      date !== expiryDate &&
      (!birthDate || date > birthDate) &&
      (!expiryDate || date < expiryDate)
  );

  if (labeled && candidates.includes(labeled)) return labeled;
  if (!candidates.length) return '';
  if (!expiryDate) return candidates[0];

  const target = new Date(expiryDate);
  target.setFullYear(target.getFullYear() - 10);

  return [...candidates].sort(
    (a, b) =>
      Math.abs(new Date(a).getTime() - target.getTime()) -
      Math.abs(new Date(b).getTime() - target.getTime())
  )[0];
}

/* =========================================================
   COMPONENT
========================================================= */

const PassportScanner = ({ open, onOpenChange, onResult }: Props) => {
  const { toast } = useToast();
  const { t } = useLanguage();

  const [tab, setTab] = useState<'upload' | 'camera'>('upload');
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  /* =======================================================
     CAMERA
  ======================================================= */

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const startCamera = async () => {
    setError(null);

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(t('scannerCameraUnsupported'));
      }

      stopCamera();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      console.error(err);
      setError(t('scannerCameraAccessError'));
    }
  };

  useEffect(() => {
    if (!open) {
      stopCamera();
      return;
    }

    if (tab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [open, tab]);

  useEffect(() => {
    if (!open) {
      stopCamera();
      setScanning(false);
      setProgress(0);
      setError(null);

      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  }, [open]);

  /* =======================================================
     CAMERA CAPTURE
  ======================================================= */

  const captureFromCamera = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video.videoWidth || !video.videoHeight) {
      setError(t('scannerCameraNotReady'));
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      blob => {
        if (blob) processImage(blob);
      },
      'image/jpeg',
      0.98
    );
  };

  /* =======================================================
     FILE
  ======================================================= */

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError(t('scannerSelectImage'));
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);

    setPreviewUrl(URL.createObjectURL(file));
    processImage(file);
  };

  /* =======================================================
     MAIN OCR
  ======================================================= */

  const processImage = async (input: Blob | File) => {
    if (scanning) return;

    setScanning(true);
    setError(null);
    setProgress(1);

    let bitmap: ImageBitmap | null = null;
    let mrzWorker: any = null;
    let visualWorker: any = null;

    try {
      const tesseractModule: any = await import('tesseract.js');
      const Tesseract = tesseractModule.default ?? tesseractModule;

      const mrzModule: any = await import('mrz');
      const parseMrz = mrzModule.parse ?? mrzModule.default?.parse;

      if (typeof parseMrz !== 'function') {
        throw new Error('Module MRZ indisponible.');
      }

      bitmap = await createImageBitmap(input);

      const imageWidth = bitmap.width;
      const imageHeight = bitmap.height;

      /* =================================================
         1. MRZ (also gives the anchor for the zones)
      ================================================= */

      setProgress(5);

      mrzWorker = await Tesseract.createWorker('eng');

      await mrzWorker.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<',
        tessedit_pageseg_mode: '6',
        preserve_interword_spaces: '1',
      });

      let bestMrz: { lines: string[]; parsed: any; score: number } | null = null;
      let anchor: MrzAnchor | null = null;

      for (let i = 0; i < MRZ_RATIOS.length; i++) {
        const ratio = MRZ_RATIOS[i];

        setProgress(Math.round(8 + (i / MRZ_RATIOS.length) * 30));

        const crop = await renderRegion(
          bitmap,
          { x: 0, y: imageHeight * (1 - ratio), w: imageWidth, h: imageHeight * ratio },
          2.8,
          true
        );

        const { data } = await mrzWorker.recognize(crop.blob, {}, { text: true, blocks: true });

        console.log(`MRZ OCR ${i + 1}:`, data?.text);

        const lines = extractTd3Mrz(data?.text || '');
        if (!lines) continue;

        if (!anchor) {
          anchor = findMrzAnchor(data, crop.rect, crop.scale, imageWidth, imageHeight);
        }

        try {
          const parsed = parseMrz(lines, { autocorrect: true });

          const validFields = parsed.details?.filter((field: any) => field.valid).length || 0;
          const score = (parsed.valid ? 10000 : 0) + validFields;

          console.log('MRZ PARSED:', parsed);

          if (!bestMrz || score > bestMrz.score) {
            bestMrz = { lines, parsed, score };
          }

          if (parsed.valid && anchor) break;
        } catch (err) {
          console.warn('MRZ parse failed:', err);
        }
      }

      await mrzWorker.terminate();
      mrzWorker = null;

      if (!bestMrz) {
        throw new Error(
          'Impossible de détecter correctement le MRZ. Assurez-vous que les deux lignes MRZ sont entièrement visibles.'
        );
      }

      console.log('MRZ ANCHOR:', anchor ?? 'not found, using page-relative zones');

      const mrzData = parseMrzFields(bestMrz.parsed);

      /* =================================================
         2. FIELD ZONES
      ================================================= */

      setProgress(42);

      visualWorker = await Tesseract.createWorker('fra+eng+ara');

      const zones = ZONES.map(zone => ({
        zone,
        rect: zoneRect(zone, anchor, imageWidth, imageHeight),
      }));

      if (DEBUG_ZONES) {
        const debugUrl = await createDebugImage(
          bitmap,
          zones.map(z => ({ name: z.zone.name, rect: z.rect })),
          anchor
        );
        console.log('ZONES DEBUG IMAGE (open in a new tab):', debugUrl);
      }

      const zoneValues: Partial<Record<ZoneName, string>> = {};
      const zoneDates: string[] = [];

      for (let i = 0; i < zones.length; i++) {
        const { zone, rect } = zones[i];

        setProgress(Math.round(48 + (i / zones.length) * 36));

        try {
          const scale = Math.min(5, Math.max(2, 1400 / Math.max(rect.w, 1)));
          const crop = await renderRegion(bitmap, rect, scale, true);

          for (const psm of ['6', '11']) {
            await visualWorker.setParameters({
              tessedit_pageseg_mode: psm,
              preserve_interword_spaces: '1',
            });

            const { data } = await visualWorker.recognize(crop.blob);
            const text = data?.text || '';

            console.log(`ZONE ${zone.name} PSM ${psm}:`, text);

            for (const line of getOcrLines(text)) {
              for (const date of extractDates(line)) {
                if (!zoneDates.includes(date)) zoneDates.push(date);
              }
            }

            const value = extractZoneValue(zone, text);

            if (value) {
              zoneValues[zone.name] = value;
              break;
            }
          }
        } catch (err) {
          console.warn(`Zone ${zone.name} failed:`, err);
        }
      }

      console.log('ZONE VALUES:', zoneValues);

      /* =================================================
         3. WHOLE-PAGE FALLBACK
      ================================================= */

      setProgress(88);

      const pageCrop = await renderRegion(
        bitmap,
        {
          x: 0,
          y: 0,
          w: imageWidth,
          h: anchor ? anchor.top : imageHeight * 0.75,
        },
        2,
        true
      );

      await visualWorker.setParameters({
        tessedit_pageseg_mode: '11',
        preserve_interword_spaces: '1',
      });

      const { data: pageData } = await visualWorker.recognize(pageCrop.blob);
      const pageFields = parseVisualText(pageData?.text || '');

      console.log('PAGE FALLBACK:', pageFields);

      await visualWorker.terminate();
      visualWorker = null;

      /* =================================================
         4. MERGE
      ================================================= */

      const visualLastName = zoneValues.lastName || pageFields.lastName;
      const visualFirstName = zoneValues.firstName || pageFields.firstName;

      const mrzName = parseMrzName(bestMrz.lines[0], visualLastName);

      console.log('MRZ NAME:', mrzName, 'VISUAL NAME:', {
        visualLastName,
        visualFirstName,
      });

      const lastName = chooseName(mrzName.lastName, visualLastName);
      const firstName = chooseName(mrzName.firstName, visualFirstName);

      const birthDate = mrzData.birthDate;
      const passportExpiryDate = mrzData.expiryDate;

      const allDates = [...zoneDates];
      for (const date of pageFields.allDates) {
        if (!allDates.includes(date)) allDates.push(date);
      }

      const passportIssueDate = pickIssueDate(
        allDates,
        zoneValues.issueDate || pageFields.issueDate,
        birthDate,
        passportExpiryDate
      );

      const data: MrzResult = {
        lastName,
        firstName,
        birthDate,
        birthPlace: zoneValues.birthPlace || pageFields.birthPlace,
        nationality: mrzData.nationality || 'Algérienne',
        passportNumber: mrzData.passportNumber,
        passportIssueDate,
        passportExpiryDate,
      };

      console.log('FINAL ALGERIAN PASSPORT', data);

      /* =================================================
         VALIDATION
      ================================================= */

      const missing: string[] = [];

      if (!data.lastName) missing.push(t('scannerFieldLastName'));
      if (!data.firstName) missing.push(t('scannerFieldFirstName'));
      if (!data.birthPlace) missing.push(t('scannerFieldBirthPlace'));
      if (!data.birthDate) missing.push(t('scannerFieldBirthDate'));
      if (!data.passportNumber) missing.push(t('scannerFieldPassportNumber'));
      if (!data.passportIssueDate) missing.push(t('scannerFieldIssueDate'));
      if (!data.passportExpiryDate) missing.push(t('scannerFieldExpiryDate'));

      if (missing.length >= 3) {
        throw new Error(t('scannerInsufficientData'));
      }

      onResult(data);

      if (bestMrz.parsed.valid && missing.length === 0) {
        toast({
          title: t('scannerSuccessTitle'),
          description: t('scannerSuccessDescription'),
        });
      } else {
        toast({
          title: t('scannerIncompleteTitle'),
          description: missing.length
            ? t('scannerMissingFields').replace('{fields}', missing.join(', '))
            : t('scannerReviewExtracted'),
        });
      }

      setProgress(100);
      onOpenChange(false);
    } catch (err: any) {
      console.error('PASSPORT SCANNER ERROR:', err);
      setError(t('scannerScanError'));
    } finally {
      try {
        await mrzWorker?.terminate();
      } catch {
        /* ignore */
      }

      try {
        await visualWorker?.terminate();
      } catch {
        /* ignore */
      }

      bitmap?.close();

      setScanning(false);
      setTimeout(() => setProgress(0), 300);
    }
  };

  /* =======================================================
     UI
  ======================================================= */

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanLine className="w-5 h-5 text-primary" />
            {t('scannerTitle')}
          </DialogTitle>

          <DialogDescription>
            {t('scannerDescription')}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={value => setTab(value as 'upload' | 'camera')}>
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="upload">
              <Upload className="w-4 h-4 mr-2" />
              {t('scannerUpload')}
            </TabsTrigger>

            <TabsTrigger value="camera">
              <Camera className="w-4 h-4 mr-2" />
              {t('scannerCamera')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-3 pt-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={scanning}
              className="w-full border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors disabled:opacity-50"
            >
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt={t('scannerPassportAlt')}
                  className="max-h-72 mx-auto rounded-lg object-contain"
                />
              ) : (
                <>
                  <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm font-medium">{t('scannerUploadIdentityPage')}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('scannerPageVisible')}
                  </p>
                </>
              )}
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              className="hidden"
              onChange={event => {
                const file = event.target.files?.[0];
                if (file) handleFile(file);
                event.target.value = '';
              }}
            />
          </TabsContent>

          <TabsContent value="camera" className="space-y-3 pt-3">
            <div className="relative bg-black rounded-xl overflow-hidden aspect-video">
              <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />

              <div className="absolute inset-4 border-2 border-primary/80 rounded-lg pointer-events-none">
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-widest text-primary bg-background/80 px-2 py-1 rounded whitespace-nowrap">
                  {t('scannerFullPage')}
                </div>
              </div>
            </div>

            <Button onClick={captureFromCamera} disabled={scanning} className="w-full">
              {scanning ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('scannerAnalyzing')}
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4 mr-2" />
                  {t('scannerCapture')}
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>

        {scanning && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('scannerAnalyzingPassport')}
              </span>
              <span>{progress}%</span>
            </div>

            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{t('scannerFailed')}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription className="text-xs">
            {t('scannerReview')}
          </AlertDescription>
        </Alert>

        <canvas ref={canvasRef} className="hidden" />
      </DialogContent>
    </Dialog>
  );
};

export default PassportScanner;