<template>
    <div class="loading-spinner" :class="{ overlay: isOverlay }">
      <ion-spinner name="crescent"></ion-spinner>
      <ion-text v-if="message" color="medium" class="message">
        {{ message }}
      </ion-text>
    </div>
  </template>
  
  <script setup lang="ts">
  import { IonSpinner, IonText } from '@ionic/vue';
  
  defineProps<{
    message?: string;
    isOverlay?: boolean;
  }>();
  </script>
  
  <style scoped>
  .loading-spinner {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }
  
  .loading-spinner.overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--ion-background-color);
    opacity: 0.9;
    z-index: 1000;
  }
  
  .message {
    margin-top: 10px;
    text-align: center;
  }
  
  ion-spinner {
    width: 48px;
    height: 48px;
    --color: var(--ion-color-primary);
  }
  </style> 