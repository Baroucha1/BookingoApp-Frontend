/*
import { useState, useEffect, type ReactNode } from 'react';

const GATE_KEY = 'site_unlocked';
const PASSWORD = 'blida9';

interface ComingSoonGateProps {
    children: ReactNode;
}

const ComingSoonGate = ({ children }: ComingSoonGateProps) => {
    const [unlocked, setUnlocked] = useState(false);
    const [checked,  setChecked]  = useState(false);
    const [input,    setInput]    = useState('');
    const [error,    setError]    = useState(false);

    useEffect(() => {
        const stored = sessionStorage.getItem(GATE_KEY);
        if (stored === 'true') setUnlocked(true);
        setChecked(true);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input === PASSWORD) {
            sessionStorage.setItem(GATE_KEY, 'true');
            setUnlocked(true);
            setError(false);
        } else {
            setError(true);
        }
    };

    // Avoid a flash of the gate before we've checked sessionStorage
    if (!checked) return null;

    if (unlocked) return <>{children}</>;

    return (
        <div className="fixed inset-0 z-[9999] bg-gray-950 flex items-center justify-center px-4">
            {/!* Password entry — small, top-left *!/}
            <form
    onSubmit={handleSubmit}
    className="absolute top-4 left-4 flex items-center gap-2"
    >
    <input
        type="password"
    value={input}
    onChange={(e) => { setInput(e.target.value); setError(false); }}
    placeholder="Mot de passe"
    className={`w-32 px-2 py-1 text-xs rounded-md bg-gray-800 text-gray-200 border ${
        error ? 'border-red-500' : 'border-gray-700'
    } focus:outline-none focus:ring-1 focus:ring-gray-500`}
    />
    <button
    type="submit"
    className="text-xs px-2 py-1 rounded-md bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700"
        >
        OK
        </button>
        </form>

    {/!* Main "coming soon" message *!/}
    <div className="text-center">
    <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
        Bientôt disponible
    </h1>
    <p className="text-gray-400 text-sm sm:text-base">
        Notre site est en cours de préparation. Revenez bientôt !
    </p>
    </div>
    </div>
);
};

export default ComingSoonGate;*/
