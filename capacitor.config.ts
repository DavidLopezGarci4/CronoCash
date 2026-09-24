import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gastosfacturacion.app',
  appName: 'CronoCash',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
