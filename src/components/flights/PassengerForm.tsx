// src/components/flights/PassengerForm.tsx
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, CheckCircle2, XCircle, Upload, FileText, X, ScanLine } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PassengerFormData } from '@/context/FlightContext';
import { useLanguage } from '@/i18n/LanguageContext';
import SmartDateField from '@/components/flights/SmartDateField';



interface Props {
    index: number;
    data: PassengerFormData;
    travelDate: string;
    showContactFields?: boolean;
    errors?: Record<string, string>;
    onChange: (data: PassengerFormData) => void;
    onScanPassport?: () => void;
    requiresPassportUpload?: boolean;
    passportFile?: File | null;
    onPassportFileChange?: (file: File | null) => void;
    requireDocument?: boolean;
}

const inputCls = 'w-full h-11 px-3 rounded-lg bg-blue-50/40 border border-blue-200 text-[#0B0F2E] placeholder:text-slate-300 focus:outline-none focus:border-[#0865FE] focus:ring-1 focus:ring-[#0865FE]/30 text-sm transition';
const selectCls = `${inputCls} appearance-none`;
const PAX_LABELS = { ADT: 'Adulte', CHD: 'Enfant', INF: 'Bébé' };

const TITLE_TO_GENDER: Record<string, 'M' | 'F'> = {
    MR: 'M',
    MS: 'F',
    MRS: 'F',
};

const ALGERIAN_PHONE_RE = /^(\+213|0)[567]\d{8}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FieldProps {
    label: string;
    name: string;
    errors: Record<string, string>;
    children: React.ReactNode;
}
function Field({ label, name, errors, children }: FieldProps) {
    return (
        <label className="block">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 mb-1 block font-medium">{label}</span>
            {children}
            {errors[name] && <span className="text-red-500 text-xs mt-1 block">{errors[name]}</span>}
        </label>
    );
}

/** Small live-validation input with a status icon (checkmark / cross once the user has typed something) */
function LiveField({ label, name, value, onChange, errors, isValid, placeholder, type = 'text' }: {
    label: string; name: string; value: string; onChange: (v: string) => void;
    errors: Record<string, string>; isValid: (v: string) => boolean; placeholder?: string; type?: string;
}) {
    const touched = value.trim().length > 0;
    const valid = touched && isValid(value);
    const invalid = touched && !valid;

    return (
        <label className="block">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 mb-1 block font-medium">{label}</span>
            <div className="relative">
                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className={cn(inputCls, 'pr-9', invalid && 'border-red-300', valid && 'border-emerald-300')}
                />
                {touched && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2">
                        {valid
                            ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            : <XCircle className="w-4 h-4 text-red-400" />}
                    </span>
                )}
            </div>
            {errors[name] && <span className="text-red-500 text-xs mt-1 block">{errors[name]}</span>}
            {invalid && !errors[name] && (
                <span className="text-amber-600 text-xs mt-1 block">
                    {name === 'tel' ? 'Format attendu : 0XXXXXXXXX ou +213XXXXXXXXX' : 'Adresse email invalide'}
                </span>
            )}
        </label>
    );
}

export default function PassengerForm({
                                          index, data, travelDate, showContactFields, errors = {}, onChange,
                                          onScanPassport,
                                          requiresPassportUpload, passportFile, onPassportFileChange,
                                          requireDocument,
                                      }: Props) {
    const [open, setOpen] = useState(index === 0);
                                        const { t } = useLanguage();

    const u = (patch: Partial<PassengerFormData>) => onChange({ ...data, ...patch });

    useEffect(() => {
        const derived = TITLE_TO_GENDER[data.passengerTitle];
        if (derived && data.sexe !== derived) {
            u({ sexe: derived as any });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data.passengerTitle]);

    const handleTitleChange = (title: string) => {
        const derivedGender = TITLE_TO_GENDER[title];
        u({ passengerTitle: title as any, ...(derivedGender ? { sexe: derivedGender as any } : {}) });
    };

    const now = new Date();
    const birthMaxISO = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;


    return (
        <div className="rounded-2xl bg-white border-2 border-[#0865FE]/20 shadow-sm overflow-hidden">
            <button
                type="button"
                onClick={() => setOpen((s) => !s)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-blue-50/50 transition"
            >
                <div>
                    <div className="text-[#0B0F2E] font-semibold">
                        Passager {index + 1}
                        <span className="text-slate-400 text-sm font-normal ml-2">({PAX_LABELS[data.paxType]})</span>
                    </div>
                    {!open && data.firstName && (
                        <div className="text-xs text-slate-400 mt-0.5">{data.passengerTitle} {data.firstName} {data.lastName}</div>
                    )}
                </div>
                <ChevronDown className={cn('w-5 h-5 text-[#0865FE] transition-transform', open && 'rotate-180')} />
            </button>

            {open && (
                <div className="p-4 pt-2 grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-blue-100">
                    {onScanPassport && (
                        <div className="md:col-span-2">
                            <Button type="button" variant="outline" size="sm" onClick={onScanPassport} className="gap-2">
                                <ScanLine className="h-4 w-4" />
                                {t('applyScanPassport')}
                            </Button>
                        </div>
                    )}
                    <Field label="Titre" name="passengerTitle" errors={errors}>
                        <select
                            value={data.passengerTitle}
                            onChange={(e) => handleTitleChange(e.target.value)}
                            className={cn(selectCls, errors.passengerTitle && 'border-red-300')}
                        >
                            <option value="">—</option>
                            <option value="MR">MR</option>
                            <option value="MS">MS</option>
                            <option value="MRS">MRS</option>
                        </select>
                    </Field>

                    <Field label="Prénom" name="firstName" errors={errors}>
                        <input
                            value={data.firstName}
                            onChange={(e) => u({ firstName: e.target.value })}
                            className={cn(inputCls, errors.firstName && 'border-red-300')}
                        />
                    </Field>
                    <Field label="Nom" name="lastName" errors={errors}>
                        <input
                            value={data.lastName}
                            onChange={(e) => u({ lastName: e.target.value })}
                            className={cn(inputCls, errors.lastName && 'border-red-300')}
                        />
                    </Field>

                    <Field label="Date de naissance" name="birthday" errors={errors}>
                        <SmartDateField
                            value={data.birthday}
                            onChange={(iso) => u({ birthday: iso })}
                            maxDate={birthMaxISO}
                            yearRange={[now.getFullYear() - 100, now.getFullYear()]}
                            error={!!errors.birthday}
                        />
                    </Field>

                    {(requireDocument ?? true) && (
                        <>
                            <Field label="Type de document" name="typeDoc" errors={errors}>
                                <select
                                    value={data.typeDoc}
                                    onChange={(e) => u({ typeDoc: e.target.value as any })}
                                    className={cn(selectCls, errors.typeDoc && 'border-red-300')}
                                >
*                                    <option value="">—</option>
                                    <option value="P">Passeport</option>
                                    <option value="N">Carte nationale</option>
                                    <option value="R">Résident</option>
                                </select>
                            </Field>
                            <Field label="Numéro de passeport" name="passportNumber" errors={errors}>
                                <input
                                    value={data.passportNumber}
                                    onChange={(e) => u({ passportNumber: e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase() })}
                                    maxLength={15}
                                    className={cn(inputCls, errors.passportNumber && 'border-red-300')}                                />
                            </Field>

                            <Field label="Date d'expiration" name="expiryDate" errors={errors}>
                                <SmartDateField
                                    value={data.expiryDate}
                                    onChange={(iso) => u({ expiryDate: iso })}
                                    minDate={travelDate}
                                    yearRange={[now.getFullYear(), now.getFullYear() + 15]}
                                    error={!!errors.expiryDate}
                                />
                            </Field>
                        </>
                    )}

                    <Field label="Nationalité" name="nationality" errors={errors}>
                        <input
                            value={data.nationality}
                            onChange={(e) => u({ nationality: e.target.value })}
                            className={cn(inputCls, errors.nationality && 'border-red-300')}
                        />
                    </Field>

                    {showContactFields && (
                        <>
                            <LiveField
                                label="Email" name="mail" value={data.mail ?? ''}
                                onChange={(v) => u({ mail: v })} errors={errors} isValid={(v) => EMAIL_RE.test(v)}
                                placeholder="exemple@mail.com" type="email"
                            />
                            <LiveField
                                label="Téléphone" name="tel" value={data.tel ?? ''}
                                onChange={(v) => u({ tel: v })} errors={errors} isValid={(v) => ALGERIAN_PHONE_RE.test(v)}
                                placeholder="0X XX XX XX XX ou +213..."
                            />
                        </>
                    )}

                    {requiresPassportUpload && (
                        <div className="md:col-span-2">
                            <span className="text-[11px] uppercase tracking-wider text-slate-400 mb-1 block font-medium">
                                Copie du passeport (PDF ou image)
                            </span>
                            {passportFile ? (
                                <div className="flex items-center justify-between h-11 px-3 rounded-lg bg-emerald-50 border border-emerald-200 text-sm">
                                    <span className="flex items-center gap-2 text-emerald-700 truncate">
                                        <FileText className="w-4 h-4 shrink-0" />
                                        <span className="truncate">{passportFile.name}</span>
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => onPassportFileChange?.(null)}
                                        className="text-emerald-600 hover:text-emerald-800 shrink-0"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <label className="flex items-center justify-center gap-2 h-11 px-3 rounded-lg bg-blue-50/40 border border-dashed border-blue-300 text-sm text-slate-500 cursor-pointer hover:border-[#0865FE] hover:text-[#0865FE] transition">
                                    <Upload className="w-4 h-4" />
                                    Ajouter le fichier
                                    <input
                                        type="file"
                                        accept="application/pdf,image/*"
                                        className="hidden"
                                        onChange={(e) => onPassportFileChange?.(e.target.files?.[0] ?? null)}
                                    />
                                </label>
                            )}
                            <span className="text-[11px] text-amber-600 mt-1 block">
                                Requis pour ce vol au départ d'une destination hors Algérie.
                            </span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}