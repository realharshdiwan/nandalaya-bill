import type { CapacitorConfig } from '@capacitor/cli';

const isDev = process.env.CAPACITOR_DEV === 'true';
const serverUrl = process.env.CAPACITOR_SERVER_URL;

const config: CapacitorConfig = {
  appId: 'com.nandalaya.bill',
  appName: 'Nandalaya',
  webDir: 'out',
  ...(serverUrl
    ? {
        server: {
          url: serverUrl,
          ...(isDev ? { cleartext: true } : { androidScheme: 'https' }),
        },
      }
    : {}),
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
  android: {
    backgroundColor: '#002F1A',
  },
};

export default config;
