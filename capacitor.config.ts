import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mobileinventory.app',
  appName: 'Mobile Inventory',
  webDir: 'dist',
  plugins: {
    Camera: {
      permissions: ['camera']
    }
  }
};

export default config;
