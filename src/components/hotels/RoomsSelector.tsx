import { useState } from 'react';
import { Plus, Minus, Users, X } from 'lucide-react';
import type { RateHawkRoomGuests } from '@/service/ratehawk.service';

interface RoomsSelectorProps {
    rooms: RateHawkRoomGuests[];
    onChange: (rooms: RateHawkRoomGuests[]) => void;
}

export default function RoomsSelector({ rooms, onChange }: RoomsSelectorProps) {
    const [open, setOpen] = useState(false);

    const totalAdults = rooms.reduce((sum, r) => sum + r.adults, 0);
    const totalChildren = rooms.reduce((sum, r) => sum + r.childrenAges.length, 0);

    function updateRoom(index: number, patch: Partial<RateHawkRoomGuests>) {
        const next = [...rooms];
        next[index] = { ...next[index], ...patch };
        onChange(next);
    }

    function addRoom() {
        if (rooms.length >= 9) return; // ETG max: 9 rooms per request
        onChange([...rooms, { adults: 1, childrenAges: [] }]);
    }

    function removeRoom(index: number) {
        if (rooms.length <= 1) return;
        onChange(rooms.filter((_, i) => i !== index));
    }

    function addChild(index: number) {
        const room = rooms[index];
        if (room.childrenAges.length >= 5) return; // ETG max: 6 guests per room total
        updateRoom(index, { childrenAges: [...room.childrenAges, 5] });
    }

    function removeChild(index: number, childIndex: number) {
        const room = rooms[index];
        updateRoom(index, { childrenAges: room.childrenAges.filter((_, i) => i !== childIndex) });
    }

    function updateChildAge(index: number, childIndex: number, age: number) {
        const room = rooms[index];
        const ages = [...room.childrenAges];
        ages[childIndex] = age;
        updateRoom(index, { childrenAges: ages });
    }

    return (
        <div className="relative">
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Chambres et voyageurs</label>
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none transition text-left relative"
            >
                <Users size={18} className="absolute left-3 text-blue-500" />
                <span className="text-gray-800">
          {rooms.length} chambre{rooms.length > 1 ? 's' : ''} · {totalAdults} adulte{totalAdults > 1 ? 's' : ''}
                    {totalChildren > 0 ? ` · ${totalChildren} enfant${totalChildren > 1 ? 's' : ''}` : ''}
        </span>
            </button>

            {open && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                    <div className="absolute z-20 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-lg p-4 space-y-4 max-h-96 overflow-y-auto">
                        {rooms.map((room, index) => (
                            <div key={index} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="font-medium text-sm text-gray-800">Chambre {index + 1}</span>
                                    {rooms.length > 1 && (
                                        <button onClick={() => removeRoom(index)} className="text-red-500 hover:text-red-700 transition">
                                            <X size={16} />
                                        </button>
                                    )}
                                </div>

                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-gray-600">Adultes</span>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => updateRoom(index, { adults: Math.max(1, room.adults - 1) })}
                                            className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition"
                                        >
                                            <Minus size={13} />
                                        </button>
                                        <span className="w-5 text-center text-sm font-medium">{room.adults}</span>
                                        <button
                                            onClick={() => updateRoom(index, { adults: Math.min(6, room.adults + 1) })}
                                            className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition"
                                        >
                                            <Plus size={13} />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Enfants</span>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => room.childrenAges.length > 0 && removeChild(index, room.childrenAges.length - 1)}
                                            className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition"
                                        >
                                            <Minus size={13} />
                                        </button>
                                        <span className="w-5 text-center text-sm font-medium">{room.childrenAges.length}</span>
                                        <button
                                            onClick={() => addChild(index)}
                                            className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition"
                                        >
                                            <Plus size={13} />
                                        </button>
                                    </div>
                                </div>

                                {room.childrenAges.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {room.childrenAges.map((age, ci) => (
                                            <div key={ci} className="flex items-center gap-1 bg-gray-50 rounded-lg px-2 py-1">
                                                <span className="text-xs text-gray-500">Âge</span>
                                                <select
                                                    value={age}
                                                    onChange={(e) => updateChildAge(index, ci, Number(e.target.value))}
                                                    className="text-xs bg-transparent outline-none"
                                                >
                                                    {Array.from({ length: 18 }).map((_, a) => (
                                                        <option key={a} value={a}>{a}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}

                        <button
                            onClick={addRoom}
                            disabled={rooms.length >= 9}
                            className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium disabled:opacity-40 transition"
                        >
                            + Ajouter une chambre
                        </button>

                        <button
                            onClick={() => setOpen(false)}
                            className="w-full bg-blue-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-blue-700 transition"
                        >
                            Valider
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}