import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.loay94an.smartwallet',
  appName: 'المحفظة الذكية',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
    backgroundColor: '#0a0a1a',
  },
};

export default config;
