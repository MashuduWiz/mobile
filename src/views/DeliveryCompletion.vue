<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar class="main-toolbar">
        <ion-buttons slot="start">
          <ion-back-button default-href="/delivery-list" class="back-button"></ion-back-button>
        </ion-buttons>
        <ion-title class="header-title">Complete Delivery</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="completion-content">
      <div class="completion-container">
        <!-- Waybill Information -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Waybill #{{ waybillNumber }}</ion-card-title>
          </ion-card-header>
        </ion-card>

        <!-- Photo Upload Section -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Delivery Photos</ion-card-title>
            <ion-card-subtitle>Take at least 1 photo of the delivery (maximum 5)</ion-card-subtitle>
          </ion-card-header>
          <ion-card-content>
            <div class="photo-grid">
              <div v-for="(photo, index) in photos" :key="index" class="photo-item">
                <img :src="photo" alt="Delivery photo" />
                <ion-button fill="clear" color="danger" @click="removePhoto(index)">
                  <ion-icon :icon="trashOutline"></ion-icon>
                </ion-button>
              </div>
              <div v-if="photos.length < 5" class="photo-item add-photo" @click="takePhoto">
                <ion-icon :icon="cameraOutline"></ion-icon>
                <span>Add Photo</span>
              </div>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Status Update Section -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Delivery Status</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-list>
              <ion-radio-group v-model="deliveryStatus">
                <ion-item>
                  <ion-label>Delivered</ion-label>
                  <ion-radio value="delivered"></ion-radio>
                </ion-item>
                <ion-item>
                  <ion-label>Delivery Failed</ion-label>
                  <ion-radio value="failed"></ion-radio>
                </ion-item>
                <ion-item>
                  <ion-label>Wrong Address</ion-label>
                  <ion-radio value="wrong_address"></ion-radio>
                </ion-item>
              </ion-radio-group>
            </ion-list>
          </ion-card-content>
        </ion-card>

        <!-- Comments Section -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Comments</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-textarea
              v-model="comments"
              placeholder="Add any additional comments about the delivery..."
              :rows="4"
              @ionFocus="handleTextareaFocus"
              @ionBlur="handleTextareaBlur"
            ></ion-textarea>
          </ion-card-content>
        </ion-card>

        <!-- Submit Button -->
        <ion-button
          expand="block"
          :disabled="!isFormValid"
          @click="submitDeliveryCompletion"
        >
          Complete Delivery
        </ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonButton,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonRadio,
  IonRadioGroup,
  IonTextarea
} from '@ionic/vue';
import { trashOutline, cameraOutline } from 'ionicons/icons';
import { getDatabase, ref as dbRef, update, get } from 'firebase/database';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { loadingController, toastController } from '@ionic/vue';
import { getUserData } from '@/services/auth';

export default defineComponent({
  name: 'DeliveryCompletion',
  components: {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonButton,
    IonIcon,
    IonList,
    IonItem,
    IonLabel,
    IonRadio,
    IonRadioGroup,
    IonTextarea
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const db = getDatabase();

    console.log('DeliveryCompletion mounted with params:', route.params);

    const deliveryId = route.params.deliveryId;
    const waybillNumber = route.params.waybillNumber;

    console.log('Extracted deliveryId:', deliveryId);
    console.log('Extracted waybillNumber:', waybillNumber);

    if (!deliveryId || !waybillNumber) {
      console.error('Missing required route parameters');
      router.push('/delivery-list');
      return {
        waybillNumber: '',
        photos: ref<string[]>([]),
        deliveryStatus: ref(''),
        comments: ref(''),
        isFormValid: computed(() => false),
        takePhoto: () => {},
        removePhoto: () => {},
        submitDeliveryCompletion: () => {},
        trashOutline,
        cameraOutline
      };
    }

    const photos = ref<string[]>([]);
    const deliveryStatus = ref<'delivered' | 'failed' | 'wrong_address'>('delivered');
    const comments = ref('');

    const isFormValid = computed(() => {
      // For all statuses, require at least 1 photo and status
      // Comments are required for delivered status, optional for failed/wrong_address
      const hasRequiredFields = photos.value.length >= 1 && deliveryStatus.value;
      
      if (deliveryStatus.value === 'delivered') {
        return hasRequiredFields && comments.value.trim().length > 0;
      } else {
        // For failed and wrong_address, comments are optional
        return hasRequiredFields;
      }
    });

    const takePhoto = async () => {
      try {
        // Check authentication before taking photo
        const userData = getUserData();
        if (!userData) {
          console.error('User not authenticated before taking photo');
          const toast = await toastController.create({
            message: 'Authentication required. Please log in again.',
            duration: 3000,
            color: 'warning'
          });
          await toast.present();
          router.push('/login');
          return;
        }

        const image = await Camera.getPhoto({
          quality: 70, // Reduced quality to minimize memory usage
          allowEditing: true,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Camera
        });

        if (image.dataUrl) {
          // Immediately compress the image to reduce memory usage
          const compressedImage = await compressImage(image.dataUrl as string);
          
          // Check authentication again after photo processing
          const currentUserData = getUserData();
          if (!currentUserData) {
            console.error('User authentication lost after taking photo');
            const toast = await toastController.create({
              message: 'Authentication lost. Please log in again.',
              duration: 3000,
              color: 'warning'
            });
            await toast.present();
            router.push('/login');
            return;
          }
          
          photos.value.push(compressedImage);
          
          // Show success message
          const toast = await toastController.create({
            message: 'Photo added successfully',
            duration: 1500,
            color: 'success'
          });
          await toast.present();
        }
      } catch (error) {
        console.error('Error taking photo:', error);
        
        // Check if it's an authentication error
        if (error instanceof Error && error.message.includes('auth')) {
          const toast = await toastController.create({
            message: 'Authentication error. Please log in again.',
            duration: 3000,
            color: 'danger'
          });
          await toast.present();
          router.push('/login');
          return;
        }
        
        // Show generic error to user
        const toast = await toastController.create({
          message: 'Failed to take photo. Please try again.',
          duration: 3000,
          color: 'danger'
        });
        await toast.present();
      }
    };

    const compressImage = async (dataUrl: string): Promise<string> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        
        // Add error handling for memory issues
        img.onerror = () => {
          console.error('Failed to load image for compression');
          reject(new Error('Failed to load image'));
        };
        
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Calculate new dimensions while maintaining aspect ratio
            let width = img.width;
            let height = img.height;
            const maxDimension = 800; // Reduced from 1024 to save memory
            
            if (width > height && width > maxDimension) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else if (height > maxDimension) {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
            
            canvas.width = width;
            canvas.height = height;
            
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              // Use lower quality (0.6) to reduce memory usage
              const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.6);
              
              // Clean up memory
              canvas.width = 0;
              canvas.height = 0;
              
              resolve(compressedDataUrl);
            } else {
              reject(new Error('Failed to get canvas context'));
            }
          } catch (error) {
            console.error('Error during image compression:', error);
            reject(error);
          }
        };
        
        img.src = dataUrl;
      });
    };

    const removePhoto = (index: number) => {
      photos.value.splice(index, 1);
    };

    // Keyboard handling functions
    const handleTextareaFocus = () => {
      // Add a small delay to ensure the keyboard is fully shown
      setTimeout(() => {
        const textarea = document.querySelector('ion-textarea');
        if (textarea) {
          textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
    };

    const handleTextareaBlur = () => {
      // Optional: Reset scroll position when keyboard is dismissed
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    };

    const submitDeliveryCompletion = async () => {
      let loading;
      try {
        // Check authentication first
        const userData = getUserData();
        if (!userData) {
          console.error('User not authenticated during submission');
          const toast = await toastController.create({
            message: 'Authentication required. Please log in again.',
            duration: 3000,
            color: 'warning'
          });
          await toast.present();
          router.push('/login');
          return;
        }

        if (!isFormValid.value) {
          let message = 'Please complete all required fields: at least 1 photo and status';
          if (deliveryStatus.value === 'delivered') {
            message += ', and comments are required for successful deliveries';
          }
          const toast = await toastController.create({
            message: message + ' before submitting.',
            duration: 3000,
            color: 'warning'
          });
          await toast.present();
          return;
        }

        // Show loading state
        loading = await loadingController.create({
          message: 'Submitting delivery completion...',
          duration: 0
        });
        await loading.present();

        const currentTime = new Date().toISOString();
        const userId = userData.uid || userData.email;

        // Find the delivery by waybill number to ensure we update the correct record
        const deliveriesRef = dbRef(db, 'delivery_list');
        const allDeliveriesSnapshot = await get(deliveriesRef);
        
        if (!allDeliveriesSnapshot.exists()) {
          throw new Error('No deliveries found in database');
        }

        const deliveries = allDeliveriesSnapshot.val();
        const deliveryEntries = Object.entries(deliveries);
        
        // Find delivery by waybill number
        const foundDelivery = deliveryEntries.find(([, delivery]: [string, any]) => 
          delivery.waybill_number === waybillNumber
        );

        if (!foundDelivery) {
          throw new Error(`Delivery not found for waybill number: ${waybillNumber}`);
        }

        const [actualDeliveryId, originalDelivery] = foundDelivery;
        console.log('Found delivery to update:', actualDeliveryId, 'with waybill:', waybillNumber);
        
        // Type assertion for originalDelivery
        const delivery = originalDelivery as any;

        // Create updates object - ONLY update the existing delivery
        const updates: Record<string, any> = {};

        // Update the existing delivery record
        updates[`delivery_list/${actualDeliveryId}/status`] = deliveryStatus.value;
        updates[`delivery_list/${actualDeliveryId}/lastUpdated`] = currentTime;
        updates[`delivery_list/${actualDeliveryId}/completion_photos`] = photos.value || [];
        updates[`delivery_list/${actualDeliveryId}/completion_comments`] = comments.value || '';

        // Only add completion metadata for successful deliveries
        if (deliveryStatus.value === 'delivered') {
          updates[`delivery_list/${actualDeliveryId}/completed_at`] = currentTime;
          updates[`delivery_list/${actualDeliveryId}/completed_by`] = userId;
          
          // For successful deliveries, also create/update the completed_deliveries entry
          const completedDeliveryRef = dbRef(db, `completed_deliveries/${waybillNumber}`);
          const completedDeliverySnapshot = await get(completedDeliveryRef);
          
          const completionData = {
            original_delivery_id: actualDeliveryId,
            waybill_number: waybillNumber,
            recipient_name: delivery.recipient_name || '',
            recipient_contact_number: delivery.recipient_contact_number || '',
            recipient_email: delivery.recipient_email || '',
            house_number: delivery.house_number || '',
            street_name: delivery.street_name || '',
            suburb: delivery.suburb || '',
            province: delivery.province || '',
            country: delivery.country || '',
            instructions: delivery.instructions || '',
            assignedAt: delivery.assignedAt || currentTime,
            addedDate: delivery.addedDate || currentTime,
            assignedDrivers: delivery.assignedDrivers || [],
            latitude: delivery.latitude || 0,
            longitude: delivery.longitude || 0,
            completion_status: deliveryStatus.value,
            completion_photos: photos.value || [],
            completion_comments: comments.value || '',
            completed_at: currentTime,
            completed_by: userId,
            completed_by_name: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'Unknown',
            completed_by_email: userData.email || '',
            completed_by_role: userData.role || '',
            status_details: {
              is_delivered: true,
              is_failed: false,
              is_wrong_address: false,
              status_changed_at: currentTime
            },
            completion_duration: delivery.route_started_at ? 
              new Date(currentTime).getTime() - new Date(delivery.route_started_at).getTime() : null,
            route_started_at: delivery.route_started_at || null,
            route_started_by: delivery.route_started_by || null
          };
          
          if (completedDeliverySnapshot.exists()) {
            updates[`completed_deliveries/${waybillNumber}`] = {
              ...completedDeliverySnapshot.val(),
              ...completionData
            };
          } else {
            updates[`completed_deliveries/${waybillNumber}`] = completionData;
          }
        }

        console.log('Updating delivery with status:', deliveryStatus.value);
        console.log('Updates object keys:', Object.keys(updates));
        
        // Apply all updates in a single transaction
        await update(dbRef(db), updates);
        
        console.log('Updates applied successfully');

        // Dismiss loading
        await loading.dismiss();

        // Show success message with status
        const statusMessage = {
          'delivered': 'Delivery completed successfully!',
          'failed': 'Delivery marked as failed.',
          'wrong_address': 'Delivery marked as wrong address.'
        }[deliveryStatus.value] || 'Delivery status updated!';

        const toast = await toastController.create({
          message: statusMessage,
          duration: 2000,
          color: 'success'
        });
        await toast.present();

        // Navigate back to delivery list
        router.push('/delivery-list');
      } catch (error) {
        console.error('Error completing delivery:', error);
        
        // Dismiss loading if it's still showing
        if (loading) {
          await loading.dismiss();
        }
        
        // Show error message
        const toast = await toastController.create({
          message: 'Failed to complete delivery: ' + (error instanceof Error ? error.message : 'Unknown error'),
          duration: 3000,
          color: 'danger'
        });
        await toast.present();
      }
    };

    // Add lifecycle hooks to preserve authentication state
    onMounted(() => {
      // Verify authentication on mount
      const userData = getUserData();
      if (!userData) {
        console.error('No user data found on component mount');
        router.push('/login');
        return;
      }
      console.log('Component mounted with user:', userData.email);
      
      // Set up a periodic authentication check
      const authCheckInterval = setInterval(() => {
        const currentUserData = getUserData();
        if (!currentUserData) {
          console.error('Authentication lost during component lifecycle');
          clearInterval(authCheckInterval);
          router.push('/login');
        }
      }, 5000); // Check every 5 seconds
      
      // Clean up interval on unmount
      onUnmounted(() => {
        clearInterval(authCheckInterval);
      });
    });

    onUnmounted(() => {
      // Clean up any resources if needed
      console.log('DeliveryCompletion component unmounted');
    });



    return {
      waybillNumber,
      photos,
      deliveryStatus,
      comments,
      isFormValid,
      takePhoto,
      removePhoto,
      handleTextareaFocus,
      handleTextareaBlur,
      submitDeliveryCompletion,
      trashOutline,
      cameraOutline
    };
  }
});
</script>

<style scoped>
/* Header Styling */
.main-toolbar {
  --background: linear-gradient(135deg, #FF4B2B 0%, #FF416C 100%);
  --color: white;
  --border-color: transparent;
  --padding-top: 0.5rem;
  --padding-bottom: 0.5rem;
}

.header-title {
  color: white;
  font-weight: 600;
}

.back-button {
  --color: white;
}

/* Content Styling */
.completion-content {
  --background: #f8f9fa !important;
  background: #f8f9fa !important;
  padding: 1rem;
}

.completion-content::part(scroll) {
  background: #f8f9fa !important;
}

.completion-container {
  max-width: 800px;
  margin: 0 auto;
  /* Mobile keyboard handling */
  min-height: 100vh;
  padding-bottom: 20px;
  background: #f8f9fa;
}

/* Card Styling */
ion-card {
  --background: white !important;
  background: white !important;
  margin: 0 0 1rem 0;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid #e9ecef;
}

ion-card-header {
  background-color: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

ion-card-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;
}

ion-card-subtitle {
  margin-top: 0.5rem;
  color: #666;
}

ion-card-content {
  background: white;
}

/* List Styling */
ion-list {
  background: transparent;
  padding: 0;
}

ion-list::part(list) {
  background: transparent;
}

ion-item {
  --background: white;
  --border-color: #f3f4f6;
  margin-bottom: 0.5rem;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

ion-item h3 {
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
}

ion-item p {
  color: #666;
  margin: 0.2rem 0;
}

/* Button Styling */
ion-button {
  margin-top: 2rem;
  --background: linear-gradient(135deg, #FF4B2B 0%, #FF416C 100%);
  --color: white;
  --border-radius: 12px;
  --padding-top: 1rem;
  --padding-bottom: 1rem;
  font-weight: 600;
}

/* Mobile keyboard adjustments */
@media (max-width: 768px) {
  .completion-container {
    padding-bottom: 60px; /* Extra space for keyboard */
  }
  
  ion-textarea {
    --padding-bottom: 10px;
  }
}

.photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.photo-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  background-color: #f5f5f5;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.photo-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.add-photo {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: 2px dashed #ccc;
  color: #666;
  background: white;
}

.add-photo ion-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

/* Textarea Styling */
ion-textarea {
  --background: white;
  --border-color: #e9ecef;
  --border-radius: 8px;
  --padding: 0.75rem;
  border: 1px solid #e9ecef;
}

/* Radio Group Styling */
ion-radio-group {
  background: transparent;
}

ion-radio {
  --color: #FF4B2B;
  --color-checked: #FF4B2B;
}

ion-label {
  color: #333 !important;
  font-weight: 500;
  font-size: 1rem;
  margin-left: 0.5rem;
}

/* Ensure radio items are properly styled */
ion-item ion-label {
  color: #333 !important;
  font-weight: 500;
  font-size: 1rem;
}

/* Override any dark theme on radio items */
ion-item {
  --background: white !important;
  --color: #333 !important;
  --border-color: #f3f4f6;
  margin-bottom: 0.5rem;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

ion-item::part(native) {
  background: white !important;
  color: #333 !important;
}

/* Specific styling for delivery status radio items */
ion-card ion-item {
  --background: white !important;
  --color: #333 !important;
  --border-color: transparent;
  margin-bottom: 0.25rem;
  border-radius: 6px;
  border: none;
  background: white !important;
}

ion-card ion-item ion-label {
  color: #333 !important;
  font-weight: 500;
  font-size: 1rem;
  margin: 0;
}

ion-card ion-item::part(native) {
  background: white !important;
  color: #333 !important;
  padding: 0.75rem;
}

/* Force light theme on all elements */
ion-card * {
  color: #333 !important;
}

ion-card ion-label {
  color: #333 !important;
}
</style> 