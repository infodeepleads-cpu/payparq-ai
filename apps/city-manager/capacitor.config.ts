import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.payparq.citymanager',
  appName: 'City Manager',
  webDir: 'out',
  server: {
    url: 'https://city-manager-xi.vercel.app',
    cleartext: true
  }
};

export default config;
