<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/dashboard"></ion-back-button>
        </ion-buttons>
        <ion-title>Recent Deliveries</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="recent-deliveries-container">
        <!-- Loading State -->
        <div v-if="loading" class="loading-state">
          <ion-spinner name="crescent"></ion-spinner>
          <p>Loading recent deliveries...</p>
        </div>

        <!-- Content when loaded -->
        <div v-else>
          <!-- Today's Deliveries -->
          <div class="delivery-section">
            <div class="section-header">
              <h2 class="section-title">
                <ion-icon :icon="todayOutline" class="section-icon"></ion-icon>
                Today's Deliveries
              </h2>
              <ion-badge color="primary">{{ todayDeliveries.length }}</ion-badge>
            </div>
            
            <div v-if="todayDeliveries.length === 0" class="empty-state">
              <ion-icon :icon="checkmarkCircleOutline" class="empty-icon"></ion-icon>
              <p>No deliveries completed today</p>
            </div>
            
            <ion-list v-else>
              <ion-item v-for="delivery in todayDeliveries" :key="delivery.id" class="delivery-item">
                <ion-label @click="viewDeliveryDetails(delivery)">
                  <h3>{{ delivery.waybill_number }}</h3>
                  <p class="recipient">{{ delivery.recipient_name }}</p>
                  <p class="address">{{ delivery.house_number }} {{ delivery.street_name }}, {{ delivery.suburb }}</p>
                  <p class="completion-time">
                    <ion-icon :icon="timeOutline" class="time-icon"></ion-icon>
                    Completed at {{ formatTime(delivery.completed_at) }}
                  </p>
                </ion-label>
                <ion-buttons slot="end">
                  <ion-button @click="viewDeliveryDetails(delivery)" fill="clear">
                    <ion-icon :icon="eyeOutline" slot="icon-only"></ion-icon>
                  </ion-button>
                </ion-buttons>
              </ion-item>
            </ion-list>
          </div>

          <!-- Yesterday's Deliveries -->
          <div class="delivery-section">
            <div class="section-header">
              <h2 class="section-title">
                <ion-icon :icon="calendarOutline" class="section-icon"></ion-icon>
                Yesterday's Deliveries
              </h2>
              <ion-badge color="secondary">{{ yesterdayDeliveries.length }}</ion-badge>
            </div>
            
            <div v-if="yesterdayDeliveries.length === 0" class="empty-state">
              <ion-icon :icon="calendarOutline" class="empty-icon"></ion-icon>
              <p>No deliveries completed yesterday</p>
            </div>
            
            <ion-list v-else>
              <ion-item v-for="delivery in yesterdayDeliveries" :key="delivery.id" class="delivery-item">
                <ion-label @click="viewDeliveryDetails(delivery)">
                  <h3>{{ delivery.waybill_number }}</h3>
                  <p class="recipient">{{ delivery.recipient_name }}</p>
                  <p class="address">{{ delivery.house_number }} {{ delivery.street_name }}, {{ delivery.suburb }}</p>
                  <p class="completion-time">
                    <ion-icon :icon="timeOutline" class="time-icon"></ion-icon>
                    Completed at {{ formatTime(delivery.completed_at) }}
                  </p>
                </ion-label>
                <ion-buttons slot="end">
                  <ion-button @click="viewDeliveryDetails(delivery)" fill="clear">
                    <ion-icon :icon="eyeOutline" slot="icon-only"></ion-icon>
                  </ion-button>
                </ion-buttons>
              </ion-item>
            </ion-list>
          </div>

          <!-- This Week's Summary -->
          <div class="summary-section">
            <ion-card>
              <ion-card-header>
                <ion-card-title>This Week's Summary</ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <div class="summary-grid">
                  <div class="summary-item">
                    <div class="summary-value">{{ thisWeekDeliveries.length }}</div>
                    <div class="summary-label">Total Deliveries</div>
                  </div>
                  <div class="summary-item">
                    <div class="summary-value">{{ todayDeliveries.length }}</div>
                    <div class="summary-label">Today</div>
                  </div>
                  <div class="summary-item">
                    <div class="summary-value">{{ yesterdayDeliveries.length }}</div>
                    <div class="summary-label">Yesterday</div>
                  </div>
                </div>
              </ion-card-content>
            </ion-card>
          </div>
        </div>
      </div>
    </ion-content>

    <!-- Delivery Details Modal -->
    <ion-modal :is-open="isModalOpen" @didDismiss="closeModal">
      <ion-header>
        <ion-toolbar>
          <ion-title>Delivery Details</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="closeModal">Close</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        <div v-if="selectedDelivery" class="delivery-details">
          <ion-card>
            <ion-card-header>
              <ion-card-title>Waybill #{{ selectedDelivery.waybill_number }}</ion-card-title>
              <ion-card-subtitle>
                Status: <span class="status-delivered">Delivered</span>
              </ion-card-subtitle>
            </ion-card-header>
            <ion-card-content>
              <ion-list>
                <ion-item>
                  <ion-label>
                    <h3>Recipient Information</h3>
                    <p>Name: {{ selectedDelivery.recipient_name }}</p>
                    <p>Contact: {{ selectedDelivery.recipient_contact_number }}</p>
                    <p>Email: {{ selectedDelivery.recipient_email || 'Not provided' }}</p>
                  </ion-label>
                </ion-item>
                <ion-item>
                  <ion-label>
                    <h3>Delivery Address</h3>
                    <p>House Number: {{ selectedDelivery.house_number }}</p>
                    <p>Street: {{ selectedDelivery.street_name }}</p>
                    <p>Suburb: {{ selectedDelivery.suburb }}</p>
                    <p>Province: {{ selectedDelivery.province }}</p>
                    <p>Country: {{ selectedDelivery.country }}</p>
                  </ion-label>
                </ion-item>
                <ion-item>
                  <ion-label>
                    <h3>Completion Information</h3>
                    <p>Completed At: {{ formatDateTime(selectedDelivery.completed_at) }}</p>
                    <p>Completed By: {{ selectedDelivery.completed_by_name }}</p>
                    <p>Status: {{ selectedDelivery.completion_status || 'Delivered' }}</p>
                    <p v-if="selectedDelivery.completion_comments">Comments: {{ selectedDelivery.completion_comments }}</p>
                  </ion-label>
                </ion-item>
                <ion-item v-if="selectedDelivery.completion_photos && selectedDelivery.completion_photos.length > 0">
                  <ion-label>
                    <h3>Delivery Photos</h3>
                    <div class="completion-photos">
                      <div v-for="(photo, index) in selectedDelivery.completion_photos" :key="index" class="photo-item">
                        <img :src="photo" :alt="`Delivery photo ${index + 1}`" @click="viewPhoto(photo)" />
                      </div>
                    </div>
                  </ion-label>
                </ion-item>
              </ion-list>
            </ion-card-content>
          </ion-card>
        </div>
      </ion-content>
    </ion-modal>

    <!-- Photo Viewer Modal -->
    <ion-modal :is-open="showPhotoViewer" @didDismiss="closePhotoViewer">
      <ion-header>
        <ion-toolbar>
          <ion-title>Delivery Photo</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="closePhotoViewer">Close</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        <div class="photo-viewer-container">
          <img :src="selectedPhoto" alt="Delivery photo" class="enlarged-photo" />
        </div>
      </ion-content>
    </ion-modal>
    
    <!-- Bottom Navigation -->
    <BottomNavigation />
  </ion-page>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonModal,
  IonSpinner
} from '@ionic/vue';
import {
  todayOutline,
  calendarOutline,
  timeOutline,
  eyeOutline,
  checkmarkCircleOutline
} from 'ionicons/icons';
import { db } from '../firebase/config';
import { ref as dbRef, onValue } from 'firebase/database';
import { getUserData } from '../services/auth';
import BottomNavigation from '@/components/BottomNavigation.vue';

interface Delivery {
  id: string;
  waybill_number: string;
  recipient_name: string;
  recipient_contact_number: string;
  recipient_email?: string;
  house_number: string;
  street_name: string;
  suburb: string;
  province: string;
  country: string;
  completed_at: string;
  completed_by_name: string;
  completed_by_email?: string;
  completion_status?: string;
  completion_comments?: string;
  completion_photos?: string[];
  status?: string;
}

export default defineComponent({
  name: 'RecentDeliveriesView',
  components: {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    IonList,
    IonItem,
    IonLabel,
    IonBadge,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonModal,
    IonSpinner,
    BottomNavigation
  },
  setup() {
    const router = useRouter();
    const loading = ref(true);
    const completedDeliveries = ref<Delivery[]>([]);
    const currentUser = ref<any>(null);
    const isModalOpen = ref(false);
    const selectedDelivery = ref<Delivery | null>(null);
    const showPhotoViewer = ref(false);
    const selectedPhoto = ref('');

    // Get today's date at start of day
    const getTodayStart = () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return today;
    };

    // Get yesterday's date at start of day
    const getYesterdayStart = () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      return yesterday;
    };

    // Get this week's start (Monday)
    const getThisWeekStart = () => {
      const today = new Date();
      const dayOfWeek = today.getDay();
      const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday = 0, Monday = 1
      const monday = new Date(today);
      monday.setDate(today.getDate() - daysToSubtract);
      monday.setHours(0, 0, 0, 0);
      return monday;
    };

    // Filter deliveries for today
    const todayDeliveries = computed(() => {
      const todayStart = getTodayStart();
      const tomorrowStart = new Date(todayStart);
      tomorrowStart.setDate(todayStart.getDate() + 1);

      return completedDeliveries.value.filter(delivery => {
        const completionDate = new Date(delivery.completed_at);
        return completionDate >= todayStart && completionDate < tomorrowStart;
      }).sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime());
    });

    // Filter deliveries for yesterday
    const yesterdayDeliveries = computed(() => {
      const yesterdayStart = getYesterdayStart();
      const todayStart = getTodayStart();

      return completedDeliveries.value.filter(delivery => {
        const completionDate = new Date(delivery.completed_at);
        return completionDate >= yesterdayStart && completionDate < todayStart;
      }).sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime());
    });

    // Filter deliveries for this week
    const thisWeekDeliveries = computed(() => {
      const weekStart = getThisWeekStart();
      const now = new Date();

      return completedDeliveries.value.filter(delivery => {
        const completionDate = new Date(delivery.completed_at);
        return completionDate >= weekStart && completionDate <= now;
      });
    });

    // Format time for display
    const formatTime = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    };

    // Format date and time for display
    const formatDateTime = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    };

    // View delivery details
    const viewDeliveryDetails = (delivery: Delivery) => {
      selectedDelivery.value = delivery;
      isModalOpen.value = true;
    };

    // Close modal
    const closeModal = () => {
      isModalOpen.value = false;
      selectedDelivery.value = null;
    };

    // View photo
    const viewPhoto = (photoUrl: string) => {
      selectedPhoto.value = photoUrl;
      showPhotoViewer.value = true;
    };

    // Close photo viewer
    const closePhotoViewer = () => {
      showPhotoViewer.value = false;
      selectedPhoto.value = '';
    };

    // Fetch completed deliveries
    const fetchCompletedDeliveries = () => {
      const completedDeliveriesRef = dbRef(db, 'completed_deliveries');
      onValue(completedDeliveriesRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const deliveries = Object.entries(data).map(([key, value]) => ({
            id: key,
            ...(value as Omit<Delivery, 'id'>)
          }));

          // Filter for current driver only
          if (currentUser.value?.role?.toLowerCase() === 'driver') {
            completedDeliveries.value = deliveries.filter(delivery => 
              delivery.completed_by_email === currentUser.value.email
            );
          } else {
            // For admin/manager, show all completed deliveries
            completedDeliveries.value = deliveries;
          }
        } else {
          completedDeliveries.value = [];
        }
        loading.value = false;
      }, (error) => {
        console.error('Error fetching completed deliveries:', error);
        loading.value = false;
      });
    };

    onMounted(async () => {
      const userData = await getUserData();
      if (!userData) {
        router.push('/login');
        return;
      }
      
      currentUser.value = userData;
      fetchCompletedDeliveries();
    });

    return {
      loading,
      todayDeliveries,
      yesterdayDeliveries,
      thisWeekDeliveries,
      formatTime,
      formatDateTime,
      viewDeliveryDetails,
      closeModal,
      viewPhoto,
      closePhotoViewer,
      isModalOpen,
      selectedDelivery,
      showPhotoViewer,
      selectedPhoto,
      todayOutline,
      calendarOutline,
      timeOutline,
      eyeOutline,
      checkmarkCircleOutline
    };
  }
});
</script>

<style scoped>
.recent-deliveries-container {
  padding: 1rem;
  background-color: #f8f9fa;
  min-height: 100%;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  color: #6b7280;
}

.loading-state ion-spinner {
  margin-bottom: 1rem;
  --color: #3b82f6;
}

.loading-state p {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 500;
}

.delivery-section {
  margin-bottom: 2rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding: 0 0.5rem;
}

.section-title {
  display: flex;
  align-items: center;
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.section-icon {
  margin-right: 0.75rem;
  font-size: 1.4rem;
  color: #3b82f6;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #6b7280;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin: 1rem 0;
}

.empty-icon {
  font-size: 3.5rem;
  color: #d1d5db;
  margin-bottom: 1rem;
}

.empty-state p {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 500;
  color: #6b7280;
}

/* Remove default list styling */
ion-list {
  background: transparent;
  padding: 0;
}

ion-list::part(list) {
  background: transparent;
}

/* Delivery item styling */
.delivery-item {
  --padding-start: 1rem;
  --padding-end: 1rem;
  --padding-top: 1rem;
  --padding-bottom: 1rem;
  margin-bottom: 0.75rem;
  border-radius: 12px;
  --background: white;
  --border-color: transparent;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid #f3f4f6;
}

.delivery-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.delivery-item:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.delivery-item::part(native) {
  background: transparent;
  border: none;
}

.delivery-item h3 {
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  line-height: 1.2;
}

.recipient {
  color: #374151;
  margin: 0.25rem 0;
  font-size: 0.95rem;
  font-weight: 500;
  line-height: 1.3;
}

.address {
  color: #6b7280;
  margin: 0.25rem 0;
  font-size: 0.85rem;
  line-height: 1.4;
}

.completion-time {
  display: flex;
  align-items: center;
  color: #3b82f6;
  margin: 0.5rem 0 0 0;
  font-size: 0.85rem;
  font-weight: 600;
}

.time-icon {
  margin-right: 0.4rem;
  font-size: 0.9rem;
  color: #9ca3af;
}

.summary-section {
  margin-top: 2rem;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.summary-item {
  text-align: center;
  padding: 1.25rem 0.75rem;
  background: #f8f9fa;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  transition: all 0.2s ease;
}

.summary-item:hover {
  background: #f1f5f9;
  transform: translateY(-1px);
}

.summary-value {
  font-size: 2rem;
  font-weight: 700;
  color: #3b82f6;
  margin-bottom: 0.5rem;
  line-height: 1;
}

.summary-label {
  font-size: 0.85rem;
  color: #6b7280;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-delivered {
  color: #059669;
  font-weight: 600;
}

.completion-photos {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 0.75rem;
  margin-top: 0.75rem;
}

.photo-item {
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.photo-item:hover {
  transform: scale(1.05);
}

.photo-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-viewer-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  padding: 1rem;
}

.enlarged-photo {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

/* Modal styling */
ion-modal {
  --border-radius: 16px 16px 0 0;
}

ion-modal ion-header {
  --background: #f8f9fa;
}

ion-modal ion-toolbar {
  --background: #f8f9fa;
  --border-color: #e5e7eb;
}

/* Card styling in modal */
.delivery-details ion-card {
  margin: 0;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid #f3f4f6;
}

.delivery-details ion-card-header {
  background: #f8f9fa;
  border-bottom: 1px solid #e5e7eb;
}

.delivery-details ion-card-title {
  color: #1f2937;
  font-weight: 700;
  font-size: 1.25rem;
}

.delivery-details ion-card-subtitle {
  color: #6b7280;
  font-weight: 500;
}

.delivery-details ion-item {
  --padding-start: 0;
  --padding-end: 0;
  --background: transparent;
  --border-color: #f3f4f6;
}

.delivery-details ion-item h3 {
  color: #1f2937;
  font-weight: 600;
  font-size: 1rem;
  margin-bottom: 0.5rem;
}

.delivery-details ion-item p {
  color: #6b7280;
  margin: 0.25rem 0;
  font-size: 0.9rem;
  line-height: 1.4;
}

/* Responsive adjustments */
@media (max-width: 480px) {
  .recent-deliveries-container {
    padding: 0.75rem;
  }
  
  .section-title {
    font-size: 1.1rem;
  }
  
  .section-icon {
    font-size: 1.2rem;
    margin-right: 0.5rem;
  }
  
  .delivery-item {
    --padding-start: 0.75rem;
    --padding-end: 0.75rem;
    --padding-top: 0.75rem;
    --padding-bottom: 0.75rem;
  }
  
  .delivery-item h3 {
    font-size: 1rem;
  }
  
  .recipient {
    font-size: 0.9rem;
  }
  
  .address {
    font-size: 0.8rem;
  }
  
  .summary-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
  }
  
  .summary-value {
    font-size: 1.75rem;
  }
  
  .summary-label {
    font-size: 0.75rem;
  }
}

@media (max-width: 360px) {
  .summary-grid {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
</style> 