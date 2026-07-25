import type { CapacitorConfig } from '@capacitor/cli';

const isDev = process.env.CAPACITOR_DEV === 'true';
const vercelUrl = process.env.VERCEL_URL || 'nandalaya-bill.vercel.app';
const serverUrl = isDev
  ? process.env.CAPACITOR_DEV_URL || 'http://192.168.1.100:3000'
  : `https://${vercelUrl}`;

const config: CapacitorConfig = {
  appId: 'com.nandalaya.bill',
  appName: 'Nandalaya',
  webDir: 'out',
  server: {
    url: serverUrl,
    ...(isDev ? { cleartext: true } : { androidScheme: 'https' }),
  },
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
