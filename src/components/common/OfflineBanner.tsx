import { useEffect, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { hapticError, hapticSuccess } from '@/lib/haptics';

export default function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
  const [showRestored, setShowRestored] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowRestored(true);
      hapticSuccess();
      const timer = setTimeout(() => setShowRestored(false), 3000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowRestored(false);
      hapticError();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showRestored) return null;

  return (
    <div
      className="fixed inset-x-0 z-[9999] pointer-events-none flex justify-center px-4 transition-all duration-300 animate-in slide-in-from-top-4"
      style={{
        top: 'calc(env(safe-area-inset-top, 0px) + 0.6rem)',
      }}
    >
      {!isOnline ? (
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-600/95 text-white shadow-2xl backdrop-blur-md border border-white/20 text-xs font-bold pointer-events-auto animate-pulse">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Pas de connexion Internet</span>
        </div>
      ) : showRestored ? (
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-600/95 text-white shadow-2xl backdrop-blur-md border border-white/20 text-xs font-bold pointer-events-auto">
          <Wifi className="w-3.5 h-3.5" />
          <span>Connexion rétablie</span>
        </div>
      ) : null}
    </div>
  );
}
