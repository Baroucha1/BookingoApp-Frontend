import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

/** "2026-10-08T07:15:00+03:00" → "07:15" (airport local time, no timezone conversion) */
export function timeFromIso(iso?: string | null): string {
    const m = iso?.match(/T(\d{2}):(\d{2})/);
    return m ? `${m[1]}:${m[2]}` : '';
}

/** Number of days between departure and arrival calendar dates (for the "+1" badge) */
export function dayOffset(depIso?: string | null, arrIso?: string | null): number {
    const d = depIso?.slice(0, 10);
    const a = arrIso?.slice(0, 10);
    if (!d || !a) return 0;
    const diff = (Date.parse(a) - Date.parse(d)) / 86_400_000; // both date-only → same UTC basis
    return Number.isFinite(diff) ? Math.round(diff) : 0;
}

/** "2026-10-08T07:15:00+03:00" → "jeudi 8 oct. · 07:15" */
export function formatFlightDateTime(iso?: string | null): string {
    const m = iso?.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return '';
    const day = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return `${format(day, 'EEEE d MMM', { locale: fr })} · ${timeFromIso(iso)}`;
}