// src/pages/admin/hotels/HotelBookings.tsx
import { useEffect, useState } from 'react';
import { Loader2, X, Code2, Copy, Check, MapPin, Calendar, Users, Globe2, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { listBookings, type BookingListItem, cancelHotelBooking } from '@/service/hotels/hotels.service';
import { Button } from '@/components/ui/button';

const formatDateTime = (iso: string | null) =>
    iso ? new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const formatDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const policyLineLabel = (p: { from: string; type: string; value: number }, currency: string | null) => {
    const amount = p.type === 'Percentage' ? `${p.value}%` : p.type === 'Amount' ? `${p.value} ${currency ?? ''}` : `${p.value} night(s)`;
    return `From ${formatDate(p.from)}: ${amount}`;
};

const statusStyles: Record<string, string> = {
    CONFIRMED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
    PENDING_VERIFICATION: 'bg-amber-50 text-amber-700 border-amber-200',
    ON_REQUEST: 'bg-blue-50 text-blue-700 border-blue-200',
    CANCELLED: 'bg-slate-100 text-slate-500 border-slate-200',
    Cancelled: 'bg-slate-100 text-slate-500 border-slate-200',
    REJECTED: 'bg-red-50 text-red-700 border-red-200',
};

const StatusBadge = ({ status, requestStatus }: { status: string; requestStatus: string | null }) => (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusStyles[status] ?? 'bg-slate-50 text-slate-600 border-slate-200'}`}>
        {status}{requestStatus ? ` · ${requestStatus}` : ''}
    </span>
);

const HotelBookings = () => {
    const [bookings, setBookings] = useState<BookingListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [cancellingRef, setCancellingRef] = useState<string | null>(null);
    const [selected, setSelected] = useState<BookingListItem | null>(null);
    const [showJson, setShowJson] = useState(false);
    const [copied, setCopied] = useState(false);
    const [search, setSearch] = useState('');

    const handleCancel = async (bookingReference: string) => {
        if (!confirm(`Cancel booking ${bookingReference}?`)) return;
        setCancellingRef(bookingReference);
        try {
            const result = await cancelHotelBooking('TRAVELLANDA', bookingReference);
            toast.success(`Status: ${result.status}${result.requestStatus ? ` (${result.requestStatus})` : ''}`);
            setBookings((prev) => prev.map((b) =>
                b.bookingReference === bookingReference ? { ...b, status: result.status, requestStatus: result.requestStatus } : b
            ));
            setSelected((prev) => prev && prev.bookingReference === bookingReference
                ? { ...prev, status: result.status, requestStatus: result.requestStatus }
                : prev);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Cancellation failed');
        } finally {
            setCancellingRef(null);
        }
    };

    const load = async () => {
        setLoading(true);
        try {
            const end = new Date();
            const start = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
            setBookings(await listBookings('TRAVELLANDA', {
                bookingDateStart: start.toISOString().slice(0, 10),
                bookingDateEnd: end.toISOString().slice(0, 10),
            }));
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to load bookings');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const handleCopyJson = () => {
        if (!selected) return;
        navigator.clipboard.writeText(JSON.stringify(selected, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    const filtered = bookings.filter((b) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return b.bookingReference?.toLowerCase().includes(q)
            || b.hotelName?.toLowerCase().includes(q)
            || b.leaderName?.toLowerCase().includes(q)
            || b.yourReference?.toLowerCase().includes(q);
    });

    if (loading) return (
        <div className="flex items-center gap-2 text-slate-400 py-16 justify-center">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading bookings...
        </div>
    );

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Hotel Bookings</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Travellanda · last 90 days</p>
                </div>
                <div className="flex items-center gap-2">
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search reference, hotel, guest..."
                        className="h-9 px-3 text-sm border border-slate-200 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                    />
                    <Button variant="outline" size="sm" onClick={load} className="h-9">Refresh</Button>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                    <thead>
                    <tr className="border-b border-slate-100 text-left bg-slate-50/60">
                        <th className="px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">Reference</th>
                        <th className="px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">Hotel</th>
                        <th className="px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">Dates</th>
                        <th className="px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">Guest</th>
                        <th className="px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">Nationality</th>
                        <th className="px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">Status</th>
                        <th className="px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">Price</th>
                        <th className="px-4 py-3"></th>
                    </tr>
                    </thead>
                    <tbody>
                    {filtered.map((b) => (
                        <tr
                            key={b.bookingReference}
                            onClick={() => setSelected(b)}
                            className="border-b border-slate-50 hover:bg-blue-50/40 cursor-pointer transition-colors"
                        >
                            <td className="px-4 py-3 font-mono text-xs text-slate-700">{b.bookingReference}</td>
                            <td className="px-4 py-3 text-slate-800">{b.hotelName ?? '—'}</td>
                            <td className="px-4 py-3 text-xs text-slate-500">{formatDate(b.checkInDate)} → {formatDate(b.checkOutDate)}</td>
                            <td className="px-4 py-3 text-slate-700">{b.leaderName}</td>
                            <td className="px-4 py-3 text-slate-600">{b.nationality ?? '—'}</td>
                            <td className="px-4 py-3"><StatusBadge status={b.status} requestStatus={b.requestStatus} /></td>
                            <td className="px-4 py-3 font-semibold text-slate-800">{b.totalPrice != null ? `${b.totalPrice} ${b.currency ?? ''}` : '—'}</td>
                            <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                {b.status !== 'Cancelled' && b.status !== 'CANCELLED' && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-xs text-red-600 border-red-200 hover:bg-red-50"
                                        disabled={cancellingRef === b.bookingReference}
                                        onClick={() => handleCancel(b.bookingReference)}
                                    >
                                        {cancellingRef === b.bookingReference ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Cancel'}
                                    </Button>
                                )}
                            </td>
                        </tr>
                    ))}
                    {filtered.length === 0 && (
                        <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-400">No bookings found</td></tr>
                    )}
                    </tbody>
                </table>
            </div>

            {/* Detail panel */}
            {selected && (
                <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm px-4 py-8 overflow-y-auto" onClick={() => { setSelected(null); setShowJson(false); }}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
                            <div>
                                <div className="text-xs text-slate-400 font-medium uppercase tracking-wide">Booking reference</div>
                                <h2 className="text-lg font-bold font-mono text-slate-900">{selected.bookingReference}</h2>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowJson((v) => !v)}
                                    className={`h-8 px-3 rounded-lg text-xs font-medium flex items-center gap-1.5 border transition-colors ${showJson ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                                >
                                    <Code2 className="w-3.5 h-3.5" /> {showJson ? 'Hide JSON' : 'View JSON'}
                                </button>
                                <button onClick={() => { setSelected(null); setShowJson(false); }} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {showJson ? (
                            <div className="relative">
                                <button
                                    onClick={handleCopyJson}
                                    className="absolute top-3 right-3 h-7 px-2.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1.5 transition-colors"
                                >
                                    {copied ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                                </button>
                                <pre className="bg-slate-950 text-slate-100 text-xs p-6 pt-12 max-h-[70vh] overflow-auto leading-relaxed">
{JSON.stringify(selected, null, 2)}
                                </pre>
                            </div>
                        ) : (
                            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                                <StatusBadge status={selected.status} requestStatus={selected.requestStatus} />

                                <div className="grid grid-cols-2 gap-4">
                                    <InfoBlock icon={MapPin} label="Hotel" value={selected.hotelName ?? '—'} />
                                    <InfoBlock icon={Calendar} label="Dates" value={`${formatDate(selected.checkInDate)} → ${formatDate(selected.checkOutDate)}`} />
                                    <InfoBlock icon={Users} label="Guest" value={selected.leaderName} />
                                    <InfoBlock icon={Globe2} label="Nationality" value={selected.nationality ?? '—'} />
                                    <InfoBlock icon={CreditCard} label="Total price" value={selected.totalPrice != null ? `${selected.totalPrice} ${selected.currency ?? ''}` : '—'} />
                                    <InfoBlock icon={CreditCard} label="Payment status" value={selected.paymentStatus ?? '—'} />
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-sm">
                                    <Row label="Internal reference" value={selected.yourReference} />
                                    <Row label="Booked on" value={formatDateTime(selected.bookingTime)} />
                                    <Row label="Cancellation deadline" value={formatDate(selected.cancellationDeadline)} />
                                </div>

                                {/* Replace the old Rooms InfoBlock/section with this */}
                                <div className="pt-4 border-t border-slate-100">
                                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Rooms & guests</div>
                                    <div className="space-y-2">
                                        {selected.rooms.length > 0 ? selected.rooms.map((r, i) => {
                                            // rooms[] and guests[] aren't directly keyed to each other by index
                                            // reliably once there's more than one room — group guests by
                                            // position instead, since travellandaRaw doesn't carry roomId per
                                            // room entry the way HotelGuest does. Safer: show all guests for
                                            // this booking grouped by their actual roomId.
                                            return (
                                                <div key={i} className="bg-slate-50 rounded-lg px-3 py-2.5">
                                                    <div className="flex items-center justify-between text-sm mb-1.5">
                                                        <span className="font-medium text-slate-700">{r.roomName}</span>
                                                        <span className="text-xs text-slate-500">{r.numAdults} adult{r.numAdults > 1 ? 's' : ''}{r.numChildren > 0 ? `, ${r.numChildren} child${r.numChildren > 1 ? 'ren' : ''}` : ''}</span>
                                                    </div>
                                                </div>
                                            );
                                        }) : <div className="text-sm text-slate-400">—</div>}
                                    </div>

                                    {selected.guests.length > 0 && (
                                        <div className="mt-3 space-y-1.5">
                                            {Object.entries(
                                                selected.guests.reduce<Record<string, typeof selected.guests>>((acc, g) => {
                                                    (acc[g.roomId] ??= []).push(g);
                                                    return acc;
                                                }, {})
                                            ).map(([roomId, guests]) => (
                                                <div key={roomId} className="bg-white border border-slate-100 rounded-lg px-3 py-2">
                                                    <div className="text-[11px] text-slate-400 font-mono mb-1">Room {roomId}</div>
                                                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                                                        {guests.map((g, i) => (
                                                            <div key={i} className="text-sm text-slate-700 flex items-center gap-1.5">
                                                                {g.isChild && <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">Child</span>}
                                                                {g.title ? `${g.title}. ` : ''}{g.firstName} {g.lastName}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {selected.policyLines.length > 0 && (
                                    <div className="pt-4 border-t border-slate-100">
                                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Cancellation policy</div>
                                        <ul className="space-y-1">
                                            {selected.policyLines.map((p, i) => (
                                                <li key={i} className="text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2">{policyLineLabel(p, selected.currency)}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {selected.restrictions.length > 0 && (
                                    <div className="pt-4 border-t border-slate-100">
                                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Restrictions</div>
                                        <ul className="space-y-1">
                                            {selected.restrictions.map((r, i) => (
                                                <li key={i} className="text-sm text-slate-600">{r}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {selected.alerts.length > 0 && (
                                    <div className="pt-4 border-t border-slate-100">
                                        <div className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-2">Alerts</div>
                                        <ul className="space-y-1">
                                            {selected.alerts.map((a, i) => (
                                                <li key={i} className="text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2">{a}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {selected.status !== 'Cancelled' && selected.status !== 'CANCELLED' && (
                                    <Button
                                        variant="destructive"
                                        className="w-full mt-2"
                                        disabled={cancellingRef === selected.bookingReference}
                                        onClick={() => handleCancel(selected.bookingReference)}
                                    >
                                        {cancellingRef === selected.bookingReference ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Cancel this booking'}
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const InfoBlock = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
    <div className="flex items-start gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
            <Icon className="w-4 h-4 text-blue-500" />
        </div>
        <div>
            <div className="text-xs text-slate-400">{label}</div>
            <div className="text-sm font-medium text-slate-800">{value}</div>
        </div>
    </div>
);

const Row = ({ label, value }: { label: string; value: string }) => (
    <div>
        <div className="text-xs text-slate-400">{label}</div>
        <div className="text-sm font-medium text-slate-800 mt-0.5">{value}</div>
    </div>
);

export default HotelBookings;