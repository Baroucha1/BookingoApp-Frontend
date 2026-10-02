import React, { useEffect, useRef, useState } from 'react';
import { SplashScreen } from '@capacitor/splash-screen';
import { Capacitor } from '@capacitor/core';

interface VideoSplashScreenProps {
  onFinish?: () => void;
}

export default function VideoSplashScreen({ onFinish }: VideoSplashScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [fadingOut, setFadingOut] = useState(false);
  const [visible, setVisible] = useState(() => {
    // Ne jouer qu'au démarrage à froid de la session
    const alreadyShown = sessionStorage.getItem('bookingo_splash_done');
    return !alreadyShown;
  });

  const finish = () => {
    if (fadingOut) return;
    setFadingOut(true);
    sessionStorage.setItem('bookingo_splash_done', 'true');
    setTimeout(() => {
      setVisible(false);
      onFinish?.();
    }, 400);
  };

  useEffect(() => {
    if (!visible) {
      onFinish?.();
      return;
    }

    // Masquer immédiatement le splash statique de l'OS (Capacitor)
    if (Capacitor.isNativePlatform()) {
      SplashScreen.hide({ fadeOutDuration: 150 }).catch(() => {});
    }

    const v = videoRef.current;
    let exactTimer: NodeJS.Timeout | null = null;

    if (v) {
      // Configuration DOM stricte pour forcer l'autoplay sans interaction sur mobile et web
      v.muted = true;
      v.defaultMuted = true;
      v.playsInline = true;
      v.setAttribute('playsinline', 'true');
      v.setAttribute('webkit-playsinline', 'true');

      v.play().catch((err) => {
        console.warn('[VideoSplashScreen] Autoplay bloqué ou reporté:', err);
      });

      if (v.duration && !isNaN(v.duration) && v.duration > 0) {
        exactTimer = setTimeout(finish, (v.duration + 0.05) * 1000);
      }
    }

    const fallbackTimer = setTimeout(() => {
      finish();
    }, 15000);

    return () => {
      if (exactTimer) clearTimeout(exactTimer);
      clearTimeout(fallbackTimer);
    };
  }, [visible]);

  // Détection en continu : passe dès que la vidéo atteint sa fin
  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.duration && v.duration > 0 && v.currentTime >= v.duration - 0.1) {
      finish();
    }
  };

  const handleLoadedMetadata = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.duration && !isNaN(v.duration) && v.duration > 0) {
      setTimeout(finish, (v.duration + 0.05) * 1000);
    }
  };

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999999] flex items-center justify-center overflow-hidden transition-opacity duration-400 ease-out select-none pointer-events-none ${
        fadingOut ? 'opacity-0' : 'opacity-100'
      }`}
      style={{
        backgroundColor: '#ffffff',
      }}
    >
      <video
        ref={videoRef}
        src="/splash.mp4"
        autoPlay
        muted
        playsInline
        webkit-playsinline="true"
        preload="auto"
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onEnded={finish}
        onPause={() => {
          const v = videoRef.current;
          if (v && v.duration && v.currentTime >= v.duration - 0.5) {
            finish();
          }
        }}
        onError={() => {
          console.warn('[VideoSplashScreen] Erreur de lecture vidéo, fermeture du splash.');
          finish();
        }}
        className="w-full h-full object-contain pointer-events-none"
      />
    </div>
  );
}
