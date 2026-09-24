import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gastosfacturacion.app',
  appName: 'Gastos Facturación',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
