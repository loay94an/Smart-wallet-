import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.loay94an.smartwallet',
  appName: 'المحفظة المالية الذكية',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: '#0a0a1a',
      showSpinner: false,
    },
    StatusBar: {
      backgroundColor: '#0a0a1a',
      style: 'LIGHT',
      overlaysWebView: false,
    },
  },
  android: {
    allowMixedContent: false,
    backgroundColor: '#0a0a1a',
  },
};

export default config;
