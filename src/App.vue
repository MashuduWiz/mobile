<template>
  <ion-app>
    <ion-router-outlet />
  </ion-app>
</template>

<script setup lang="ts">
import { IonApp, IonRouterOutlet } from '@ionic/vue';
import { onMounted } from 'vue';
import { App } from '@capacitor/app';
import { scanbotService } from './services/scanbotService';
import { refreshAuthState } from './services/auth';

onMounted(async () => {
  try {
    // Initialize the scanbot service globally
    const isReady = await scanbotService.initialize();
    console.log('Scanbot SDK initialized globally:', isReady);
    
    // Set up app state change listeners for authentication
    App.addListener('appStateChange', ({ isActive }) => {
      console.log('App state changed. isActive:', isActive);
      if (isActive) {
        // App became active - refresh authentication state
        console.log('App became active, refreshing auth state...');
        refreshAuthState();
      }
    });
    
    // Set up resume listener
    App.addListener('resume', () => {
      console.log('App resumed, refreshing auth state...');
      refreshAuthState();
    });
    
  } catch (err) {
    console.error('Failed to initialize app services:', err);
  }
});
</script>

<style>
/* Global styles */
:root {
  --ion-color-primary: #3880ff;
  --ion-color-primary-rgb: 56, 128, 255;
  --ion-color-primary-contrast: #ffffff;
  --ion-color-primary-contrast-rgb: 255, 255, 255;
  --ion-color-primary-shade: #3171e0;
  --ion-color-primary-tint: #4c8dff;
}

/* Add any global styles here */
</style>
