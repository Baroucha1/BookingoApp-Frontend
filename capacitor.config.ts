import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bookingo.thedoctordeveloper',
  appName: 'BookinGO',
  webDir: 'dist',
  backgroundColor: '#011b54',
  server: {
    // Cast direct de votre lien de production pour des mises à jour web instantanées
    url: process.env.CAPACITOR_SERVER_URL || 'https://app.bookingo.net',
    cleartext: false,
    androidScheme: 'https',
    allowNavigation: [
      'bookingo.net',
      '*.bookingo.net',
      'satim.dz',
      '*.satim.dz',
      'test.satim.dz',
      'accounts.google.com',
      '*.google.com',
    ],
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: '#011b54',
      androidSplashResourceName: 'splash',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
