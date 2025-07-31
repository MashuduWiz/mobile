<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/login"></ion-back-button>
        </ion-buttons>
        <ion-title>Reset Password</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="forgot-password-container">
        <ion-card>
          <ion-card-header>
            <ion-card-title>Forgot Password</ion-card-title>
            <ion-card-subtitle>Enter your email to reset your password</ion-card-subtitle>
          </ion-card-header>

          <ion-card-content>
            <form @submit.prevent="handleResetPassword">
              <div v-if="error" class="error-alert">
                <ion-icon :icon="warningOutline"></ion-icon>
                {{ error }}
              </div>
              <div v-if="success" class="success-alert">
                <ion-icon :icon="checkmarkCircleOutline"></ion-icon>
                {{ success }}
              </div>

              <ion-item>
                <ion-label position="floating">Email</ion-label>
                <ion-input
                  type="email"
                  v-model="email"
                  required
                  placeholder="Enter your email"
                  :disabled="isLoading"
                ></ion-input>
              </ion-item>

              <ion-button
                expand="block"
                type="submit"
                class="ion-margin-top"
                :disabled="isLoading || !email"
              >
                <ion-spinner v-if="isLoading" name="crescent"></ion-spinner>
                <span v-else>{{ isLoading ? 'Sending...' : 'Reset Password' }}</span>
              </ion-button>
            </form>

            <div class="ion-text-center ion-margin-top">
              <ion-text color="medium">
                Remember your password? 
                <ion-button fill="clear" router-link="/login">Sign in</ion-button>
              </ion-text>
            </div>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonText,
  IonIcon,
  IonSpinner,
  IonButtons,
  IonBackButton,
} from '@ionic/vue';
import {
  warningOutline,
  checkmarkCircleOutline,
} from 'ionicons/icons';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase/config';

const email = ref('');
const error = ref<string | null>(null);
const success = ref<string | null>(null);
const isLoading = ref(false);

const handleResetPassword = async () => {
  try {
    error.value = null;
    success.value = null;
    isLoading.value = true;

    await sendPasswordResetEmail(auth, email.value);
    success.value = 'Password reset email sent. Please check your inbox.';
    email.value = '';
  } catch (err: unknown) {
    console.error('Password reset error:', err);
    error.value = err instanceof Error ? err.message : 'Failed to send reset email';
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.forgot-password-container {
  max-width: 400px;
  margin: 2rem auto;
  padding: 0 1rem;
}

ion-card {
  margin: 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

ion-card-header {
  text-align: center;
}

ion-card-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

ion-card-subtitle {
  color: var(--ion-color-medium);
}

.error-alert,
.success-alert {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.error-alert {
  background: var(--ion-color-danger-tint);
  color: var(--ion-color-danger);
}

.success-alert {
  background: var(--ion-color-success-tint);
  color: var(--ion-color-success);
}

ion-item {
  --padding-start: 0;
  --inner-padding-end: 0;
}

ion-button {
  margin-top: 1.5rem;
}

ion-spinner {
  margin-right: 0.5rem;
}
</style> 