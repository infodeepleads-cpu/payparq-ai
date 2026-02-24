import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.payparq.citymanager',
  appName: 'City Manager',
  webDir: 'out',
  server: {
    url: 'https://city-manager-xi.vercel.app',
    cleartext: true
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      overlaysWebView: true
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true
    }
  }
};

export default config;
