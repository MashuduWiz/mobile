<template>
  <ion-page>
    <PublicHeader />
    <ion-content>
      <div class="login-container">
        <!-- Welcome Section (Visible on tablets and larger) -->
        <div class="welcome-section">
          <div class="image-slider">
            <div class="slide" v-for="(image, index) in backgroundImages" :key="index"
                 :class="{ active: currentSlide === index }"
                 :style="{ backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.75), rgba(0, 0, 0, 0.75)), url(${image})` }">
              <div class="welcome-content animate-in">
                <div class="logo-container">
                  <ion-icon :icon="cubeOutline" class="welcome-logo"></ion-icon>
                </div>
                <h2>Welcome Back to IMS!</h2>
                <p>
                  Access your inventory management dashboard to track, manage, and optimize your business operations. Stay in control of your stock with real-time updates and powerful analytics.
                </p>
                <div class="features-grid">
                  <div class="feature-item">
                    <ion-icon :icon="analytics"></ion-icon>
                    <span>Real-time Analytics</span>
                  </div>
                  <div class="feature-item">
                    <ion-icon :icon="shield"></ion-icon>
                    <span>Secure Access</span>
                  </div>
                  <div class="feature-item">
                    <ion-icon :icon="sync"></ion-icon>
                    <span>Auto Sync</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Login Form Section -->
        <div class="login-form-section">
          <div class="login-card animate-in">
            <form @submit.prevent="handleLogin" class="login-form">
              <h1>Welcome Back!</h1>
              <p class="subtitle">Please login to your account</p>
              
              <ion-item v-if="error" class="error-alert">
                <ion-icon :icon="alertCircle" slot="start"></ion-icon>
                <ion-label>{{ error }}</ion-label>
              </ion-item>
              
              <ion-item v-if="$route.query.message" class="success-alert">
                <ion-icon :icon="checkmarkCircle" slot="start"></ion-icon>
                <ion-label>{{ $route.query.message }}</ion-label>
              </ion-item>
              
              <div class="form-group">
                <ion-label position="stacked">Email</ion-label>
                <ion-item class="custom-input">
                  <ion-icon :icon="mail" slot="start"></ion-icon>
                  <ion-input 
                    type="email" 
                    v-model="email" 
                    placeholder="Enter your email" 
                    required
                    :disabled="isLoading"
                    @ionFocus="handleInputFocus"
                    @ionBlur="handleInputBlur"
                  ></ion-input>
                </ion-item>
              </div>
              
              <div class="form-group">
                <ion-label position="stacked">Password</ion-label>
                <ion-item class="custom-input">
                  <ion-icon :icon="lockClosed" slot="start"></ion-icon>
                  <ion-input 
                    :type="showPassword ? 'text' : 'password'"
                    v-model="password" 
                    placeholder="Enter your password" 
                    required
                    :disabled="isLoading"
                    @ionFocus="handleInputFocus"
                    @ionBlur="handleInputBlur"
                  ></ion-input>
                  <ion-button 
                    fill="clear" 
                    slot="end"
                    class="password-toggle"
                    @click="togglePassword"
                  >
                    <ion-icon :icon="showPassword ? eyeOff : eye" slot="icon-only"></ion-icon>
                  </ion-button>
                </ion-item>
              </div>

              <div class="links">
                <router-link to="/forgot-password">Forgot Password?</router-link>
              </div>

              <ion-button 
                expand="block"
                type="submit" 
                :disabled="isLoading"
                class="primary-button"
              >
                <span>{{ isLoading ? 'Logging in...' : 'Sign In' }}</span>
                <ion-icon :icon="arrowForward" slot="end"></ion-icon>
              </ion-button>
              

            </form>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { 
  IonPage, 
  IonContent, 
  IonItem, 
  IonLabel, 
  IonInput, 
  IonButton, 
  IonIcon
} from '@ionic/vue';
import { RouterLink } from 'vue-router';
import { 
  mailOutline as mail, 
  lockClosedOutline as lockClosed, 
  eyeOutline as eye, 
  eyeOffOutline as eyeOff,
  alertCircleOutline as alertCircle,
  checkmarkCircleOutline as checkmarkCircle,
  arrowForward,
  analyticsOutline as analytics,
  shieldCheckmarkOutline as shield,
  syncOutline as sync,
  cubeOutline
} from 'ionicons/icons';
import PublicHeader from '@/components/PublicHeader.vue';
import { getDatabase, ref as dbRef, get } from 'firebase/database';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { validateEmployeeCredentials } from '@/services/permissions';

export default defineComponent({
  name: 'LoginView',
  components: {
    IonPage,
    IonContent,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonIcon,
    RouterLink,
    PublicHeader
  },
  setup() {
    const router = useRouter();
    const route = useRoute();
    
    const email = ref('');
    const password = ref('');
    const error = ref<string | null>(null);
    const isLoading = ref(false);
    const showPassword = ref(false);
    const currentSlide = ref(0);
    let slideshowInterval: number | null = null;
    
    // Background images for the slideshow
    const backgroundImages = [
      'src/images/system.jpg',
      'src/images/inventory.jpg',
      'src/images/management.jpg'
    ];
    
    const startSlideshow = () => {
      slideshowInterval = window.setInterval(() => {
        currentSlide.value = (currentSlide.value + 1) % backgroundImages.length;
      }, 5000);
    };
    
    const togglePassword = () => {
      showPassword.value = !showPassword.value;
    };

    // Keyboard handling functions
    const handleInputFocus = () => {
      // Add a small delay to ensure the keyboard is fully shown
      setTimeout(() => {
        const activeInput = document.querySelector('ion-input:focus-within');
        if (activeInput) {
          activeInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
    };

    const handleInputBlur = () => {
      // Optional: Reset scroll position when keyboard is dismissed
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    };
    
    const handleLogin = async () => {
      try {
        error.value = null;
        isLoading.value = true;
        const auth = getAuth();
        const db = getDatabase();

        try {
          // First try Firebase Authentication (for managers/admins)
          const userCredential = await signInWithEmailAndPassword(auth, email.value, password.value);
          
          // Check user table for manager/admin
          const userRef = dbRef(db, `user/${userCredential.user.uid}`);
          const userSnapshot = await get(userRef);

          if (userSnapshot.exists()) {
            // Handle manager/admin login
            const userData = userSnapshot.val();
            localStorage.setItem('isAuthenticated', 'true');
            localStorage.setItem('currentUser', JSON.stringify({
              uid: userCredential.user.uid,
              email: userData.email,
              firstName: userData.firstName,
              lastName: userData.lastName,
              company: userData.company,
              companyId: userData.company,
              role: userData.role || 'USER',
              permissions: userData.permissions || [],
              isVerified: userData.isVerified || false
            }));
            router.push('/dashboard');
            return;
          }
        } catch (firebaseError) {
          console.error('Firebase auth error:', firebaseError);
        }

        // If Firebase auth fails or user not found, try employee login
        const { success, error: empError } = await validateEmployeeCredentials(email.value, password.value, db);

        if (success) {
          // Employee login successful - validateEmployeeCredentials already sets localStorage
          router.push('/dashboard');
        } else {
          throw new Error(empError || 'Invalid email or password');
        }
      } catch (err: any) {
        console.error('Login error:', err);
        error.value = err.message || 'Failed to login. Please check your credentials.';
      } finally {
        isLoading.value = false;
      }
    };
    
    onMounted(() => {
      startSlideshow();
    });
    
    onUnmounted(() => {
      if (slideshowInterval) {
        clearInterval(slideshowInterval);
      }
    });
    
    return {
      email,
      password,
      error,
      isLoading,
      showPassword,
      currentSlide,
      backgroundImages,
      handleLogin,
      togglePassword,
      handleInputFocus,
      handleInputBlur,
      route,
      // Icons
      mail,
      lockClosed,
      eye,
      eyeOff,
      alertCircle,
      checkmarkCircle,
      arrowForward,
      analytics,
      shield,
      sync,
      cubeOutline
    };
  }
});
</script>

<style scoped>
.login-container {
  min-height: 100%;
  display: grid;
  grid-template-columns: 1fr;
  background: #f6f5f7;
}

/* Welcome Section */
.welcome-section {
  display: none; /* Hidden on mobile by default */
  position: relative;
  overflow: hidden;
  height: 100%;
}

.image-slider {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.slide {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  opacity: 0;
  transition: opacity 1s ease-in-out;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
}

.slide.active {
  opacity: 1;
}

.welcome-content {
  max-width: 600px;
  text-align: center;
  color: black;
}

.welcome-content h2 {
  font-size: 2.2rem;
  margin-bottom: 1.2rem;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.welcome-content p {
  font-size: 1.1rem;
  line-height: 1.6;
  margin-bottom: 2rem;
  color: rgba(255, 255, 255, 0.9);
}

.logo-container {
  margin-bottom: 2rem;
  display: flex;
  justify-content: center;
}

.welcome-logo {
  font-size: 5rem;
  color: #FF4B2B;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  padding: 1rem;
  box-shadow: 0 0 30px rgba(255, 255, 255, 0.3);
  animation: pulse 2s infinite;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.2rem;
  margin-top: 1.5rem;
}

.feature-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.feature-item:active {
  transform: translateY(-3px);
  background: rgba(255, 255, 255, 0.2);
}

.feature-item ion-icon {
  font-size: 1.5rem;
  color: #FF4B2B;
  transition: transform 0.3s ease;
}

.feature-item:active ion-icon {
  transform: scale(1.2);
}

/* Form Section */
.login-form-section {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem 1.5rem;
  background: white;
  /* Mobile keyboard handling */
  min-height: 100vh;
  padding-bottom: 60px;
}

.login-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.08);
  padding: 2rem 1.5rem;
  width: 100%;
  max-width: 450px;
}

.login-form h1 {
  font-size: 2rem;
  color: #333;
  margin-bottom: 0.8rem;
  text-align: center;
  font-weight: 600;
}

.subtitle {
  font-size: 1rem;
  color: #666;
  text-align: center;
  margin-bottom: 2rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

ion-label {
  color: #333;
  font-weight: 500;
  font-size: 1rem;
  margin-bottom: 0.5rem;
}

.custom-input {
  --background: transparent;
  --border-color: black;
  --border-width: 2px;
  --border-radius: 12px;
  --padding-start: 1rem;
  --padding-end: 1rem;
  --padding-top: 0.5rem;
  --padding-bottom: 0.5rem;
  margin-top: 0.5rem;
  --color: black;
  --min-height: 48px;
  display: flex;
  align-items: center;
}

.custom-input ion-input {
  --color: black;
  --padding-start: 8px;
  --padding-end: 8px;
  margin: 0;
}

.custom-input ion-icon {
  margin-right: 8px;
  font-size: 20px;
  color: #666;
}

.custom-input.ion-valid {
  --border-color: #FF4B2B;
  --box-shadow: 0 0 0 4px rgba(255, 75, 43, 0.1);
}

.password-toggle {
  cursor: pointer;
  color: #666;
  transition: color 0.3s ease;
}

.password-toggle:active {
  color: #FF4B2B;
}

.primary-button {
  --background: #FF4B2B;
  --background-activated: #ff3517;
  --color: white;
  --border-radius: 12px;
  --box-shadow: none;
  font-weight: 600;
  margin-top: 1rem;
  height: 48px;
}

.primary-button:active {
  --box-shadow: 0 5px 15px rgba(255, 75, 43, 0.2);
  transform: translateY(-2px);
}

.links {
  text-align: right;
  margin: 1.2rem 0;
}

router-link {
  color: #FF4B2B;
  text-decoration: none;
  font-weight: 500;
  font-size: 0.95rem;
}

.signup-prompt {
  text-align: center;
  margin-top: 1.5rem;
  color: #666;
  font-size: 0.95rem;
}

.link {
  color: #FF4B2B;
  font-weight: 600;
  margin-left: 0.3rem;
}

.error-alert, .success-alert {
  margin-bottom: 1.5rem;
  border-radius: 12px;
  --min-height: auto;
  --padding-top: 0.8rem;
  --padding-bottom: 0.8rem;
}

.error-alert {
  --background: #ffebee;
  --color: #c62828;
  --border-color: rgba(198, 40, 40, 0.2);
  --border-width: 1px;
  --border-style: solid;
}

.success-alert {
  --background: #e8f5e9;
  --color: #2e7d32;
  --border-color: rgba(46, 125, 50, 0.2);
  --border-width: 1px;
  --border-style: solid;
}

/* Animations */
@keyframes pulse {
  0% { transform: scale(1); box-shadow: 0 0 20px rgba(255, 255, 255, 0.2); }
  50% { transform: scale(1.05); box-shadow: 0 0 30px rgba(255, 255, 255, 0.4); }
  100% { transform: scale(1); box-shadow: 0 0 20px rgba(255, 255, 255, 0.2); }
}

.animate-in {
  animation: fadeInUp 0.6s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Tablet and larger screens */
@media (min-width: 768px) {
  .login-container {
    grid-template-columns: 1.2fr 1fr;
  }
  
  .welcome-section {
    display: block;
  }
  
  .login-card {
    padding: 2.5rem;
  }
  
  .login-form h1 {
    font-size: 2.2rem;
  }
  
  .subtitle {
    font-size: 1.1rem;
  }
}

/* Large screens */
@media (min-width: 1200px) {
  .welcome-content h2 {
    font-size: 2.5rem;
  }
  
  .welcome-content p {
    font-size: 1.2rem;
  }
  
  .login-card {
    padding: 3rem;
  }
}
</style>