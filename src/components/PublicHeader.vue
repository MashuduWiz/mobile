<template>
  <ion-header translucent>
    <ion-toolbar>
      <div class="header-container">
        <div class="logo-container">
          <router-link to="/" class="logo">
            <ion-icon :icon="cubeOutline" class="logo-icon"></ion-icon>
            <span class="logo-text">IMS</span>
          </router-link>
        </div>
        
        <div class="auth-buttons">
          <ion-button router-direction="forward" :router-link="'/login'" fill="outline" size="small" class="login-btn">
            <ion-icon :icon="logIn" slot="start"></ion-icon>
            <span>Login</span>
          </ion-button>
        </div>
      </div>
    </ion-toolbar>
  </ion-header>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { IonHeader, IonToolbar, IonButton, IonIcon } from '@ionic/vue';
import { logIn, cubeOutline } from 'ionicons/icons';

export default defineComponent({
  name: 'PublicHeader',
  components: {
    IonHeader,
    IonToolbar,
    IonButton,
    IonIcon
  },
  setup() {
    return {
      logIn,
      cubeOutline,
      logoExists: false
    };
  }
});
</script>

<style scoped>
ion-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
}

ion-toolbar {
  --background: white;
  --border-color: transparent;
  --border-width: 0;
  --padding-top: 0;
  --padding-bottom: 0;
  --padding-start: 0;
  --padding-end: 0;
}

.header-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1rem;
  height: 60px;
  max-width: 1200px;
  margin: 0 auto;
}

.logo-container {
  display: flex;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  text-decoration: none;
}

.logo-text {
  font-size: 1.5rem;
  font-weight: 700;
  color: #FF4B2B;
}

.auth-buttons {
  display: flex;
  gap: 0.8rem;
}

ion-button.login-btn {
  --color: #FF4B2B;
  --border-color: #FF4B2B;
  --background: transparent;
}

/* For very small screens */
@media (max-width: 480px) {
  ion-button span {
    display: none;
  }
  
  ion-button ion-icon {
    font-size: 1.2rem;
  }
}

/* For medium screens */
@media (min-width: 481px) and (max-width: 768px) {
  ion-button {
    font-size: 0.8rem;
  }
}

.logo-icon {
  font-size: 1.8rem;
  color: #FF4B2B;
  margin-right: 0.3rem;
}
</style> 