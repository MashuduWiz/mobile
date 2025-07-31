<template>
  <ion-page>
    <!-- Header with improved styling -->
    <ion-header class="ion-no-border">
      <ion-toolbar class="main-toolbar">
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>
          <div class="logo-container">
            <ion-icon :icon="cubeOutline" class="logo-icon"></ion-icon>
            <span class="logo-text">IMS</span>
          </div>
        </ion-title>
        <ion-buttons slot="end">
          <ion-button class="notification-btn">
            <ion-badge color="danger" slot="end">1</ion-badge>
            <ion-icon :icon="notificationsOutline" slot="icon-only"></ion-icon>
          </ion-button>
          <ion-button class="user-btn" @click="showUserMenu">
            <ion-icon :icon="personCircleOutline" slot="start"></ion-icon>
            <span class="welcome-text">Welcome, {{ userName }}</span>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>

      <!-- User Menu Popover -->
      <ion-popover :is-open="showUserMenuPopover" @didDismiss="showUserMenuPopover = false">
    <ion-content class="ion-padding">
            <ion-list>
            <ion-item button @click="handleLogout">
              <ion-icon :icon="logOutOutline" slot="start"></ion-icon>
              <ion-label>Logout</ion-label>
              </ion-item>
            </ion-list>
        </ion-content>
      </ion-popover>


    </ion-header>

    <ion-content>
      <div class="dashboard-container">
        <!-- Welcome Banner -->
        <div class="welcome-banner">
          <div class="welcome-content">
            <h1>Welcome to your Dashboard</h1>
            <p>Manage your inventory, track orders, and optimize your business operations</p>
          </div>
          </div>

        <!-- Main Navigation Cards -->
        <div class="nav-cards">
          <ion-card 
            v-for="card in filteredNavCards" 
            :key="card.path"
            class="nav-card" 
            @click="navigateTo(card.path)"
          >
                    <ion-card-content>
              <ion-icon :icon="card.icon" class="nav-icon" :class="card.label.toLowerCase()"></ion-icon>
              <div class="nav-label">{{ card.label }}</div>
                    </ion-card-content>
                  </ion-card>
        </div>
      </div>
    </ion-content>
    
    <!-- Bottom Navigation -->
    <BottomNavigation />
  </ion-page>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonMenuButton,
  IonButton,
  IonIcon,
  IonBadge,
  IonCard,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  actionSheetController,
  IonPopover
} from '@ionic/vue';
import {
  notificationsOutline,
  personCircleOutline,
  homeOutline,
  businessOutline,
  cartOutline,
  carOutline,
  cashOutline,
  settingsOutline,
  cubeOutline,
  peopleOutline,
  barChartOutline,
  serverOutline,
  addOutline,
  personAddOutline,
  timeOutline,
  refreshOutline,
  logOutOutline,
  scanOutline
} from 'ionicons/icons';
import { getUserData, signOutUser } from '@/services/auth';
import { ScanbotBarcodeSDK } from 'capacitor-plugin-scanbot-barcode-scanner-sdk';
import { BarcodeScannerScreenConfiguration, SingleScanningMode, MultipleScanningMode } from 'capacitor-plugin-scanbot-barcode-scanner-sdk/dist/esm/ui_v2';
import BottomNavigation from '@/components/BottomNavigation.vue';

export default defineComponent({
  name: 'DashboardView',
  components: {
    IonPage, 
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent,
    IonButtons,
    IonMenuButton,
    IonButton,
    IonIcon,
    IonBadge,
    IonCard,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonPopover,
    BottomNavigation
  },
  setup() {
const router = useRouter();
    const userName = ref('User');
    const showUserMenuPopover = ref(false);
    
    // Initialize user data immediately
    const userData = getUserData();
    const userRole = userData?.role?.toLowerCase() || 'user';
    userName.value = userData?.firstName || 'User';
    
    // Pre-define all navigation cards
    const allNavCards = [
      {
        path: '/inventory',
        icon: cubeOutline,
        label: 'Inventory',
        showForDriver: false
      },
      {
        path: '/barcode-scanner',
        icon: scanOutline,
        label: 'Barcode Scanner',
        showForDriver: true
      },
      {
        path: '/users',
        icon: peopleOutline,
        label: 'User Management',
        showForDriver: false
      },
      {
        path: '/reports',
        icon: barChartOutline,
        label: 'Reports',
        showForDriver: false
      },
      {
        path: '/warehouse',
        icon: businessOutline,
        label: 'Warehouse',
        showForDriver: false
      },
      {
        path: '/orders',
        icon: cartOutline,
        label: 'Orders',
        showForDriver: false
      },
      {
        path: '/delivery-list',
        icon: carOutline,
        label: 'Delivery List',
        showForDriver: true
      },
      {
        path: '/delivery-history',
        icon: timeOutline,
        label: 'Delivery History',
        showForDriver: true
      },
      {
        path: '/recent-deliveries',
        icon: refreshOutline,
        label: 'Recent Deliveries',
        showForDriver: true
      }
    ];

    // Compute filtered data based on role
    const isDriver = computed(() => userRole === 'driver');
    
    const filteredNavCards = computed(() => 
      allNavCards.filter(card => !isDriver.value || card.showForDriver)
    );
    
    const navigateTo = (path: string) => {
      router.push(path);
    };
    
    const showActionSheet = async () => {
      const actionSheet = await actionSheetController.create({
        header: 'Actions',
        buttons: [
          {
            text: 'Scan Barcode',
            icon: scanOutline,
            handler: () => {
              startBarcodeScan();
            }
          },
          {
            text: 'Scan Multiple Barcodes',
            icon: scanOutline,
            handler: () => {
              startMultiBarcodeScan();
            }
          },
          {
            text: 'Add Product',
            icon: addOutline,
            handler: () => {
              navigateTo('/add-product');
            }
          },
          {
            text: 'Add User',
            icon: personAddOutline,
            handler: () => {
              navigateTo('/add-user');
            }
          },
          {
            text: 'Cancel',
            icon: 'close',
            role: 'cancel'
          }
        ]
      });
      
      await actionSheet.present();
    };
    
    const showUserMenu = () => {
      showUserMenuPopover.value = true;
    };

    const handleLogout = async () => {
  try {
        await signOutUser();
    router.push('/login');
  } catch (error) {
    console.error('Logout error:', error);
    router.push('/login');
  }
};

    // Barcode Scanner Functions
    const startBarcodeScan = async () => {
      try {
        const licenseInfo = await ScanbotBarcodeSDK.getLicenseInfo();
        if (!licenseInfo.isLicenseValid) {
          alert('SDK license is not valid.');
          return;
        }
        const config = new BarcodeScannerScreenConfiguration();
        config.useCase = new SingleScanningMode();
        const result = await ScanbotBarcodeSDK.startBarcodeScanner(config);
        if (result.data && result.data.items && result.data.items.length > 0) {
          alert(
            'Barcode Scanning successfully!\n' +
            `Value: ${result.data.items[0].barcode.text} \n` +
            `Type: ${result.data.items[0].barcode.format}`
          );
        }
      } catch (e: any) {
        console.error('An error has occurred while running Barcode Scanner', e.message);
      }
    };

    const startMultiBarcodeScan = async () => {
      try {
        const licenseInfo = await ScanbotBarcodeSDK.getLicenseInfo();
        if (!licenseInfo.isLicenseValid) {
          alert('SDK license is not valid.');
          return;
        }
        const config = new BarcodeScannerScreenConfiguration();
        config.useCase = new MultipleScanningMode();
        const result = await ScanbotBarcodeSDK.startBarcodeScanner(config);
        if (result.data && result.data.items && result.data.items.length > 0) {
          alert(
            'Barcode Scanning successfully!\n' +
            result.data.items.map((barcode: any) =>
              `Barcode value: ${barcode.barcode.text} and type: ${barcode.barcode.format}`
            ).join("\n")
          );
        }
      } catch (e: any) {
        console.error('An error has occurred while running Barcode Scanner', e.message);
      }
    };

    return {
      userName,
      navigateTo,
      showActionSheet,
      notificationsOutline,
      personCircleOutline,
      homeOutline,
      businessOutline,
      cartOutline,
      carOutline,
      cashOutline,
      settingsOutline,
      cubeOutline,
      peopleOutline,
      barChartOutline,
      serverOutline,
      addOutline,
      personAddOutline,
      timeOutline,
      refreshOutline,
      showUserMenuPopover,
      showUserMenu,
      handleLogout,
      logOutOutline,
      filteredNavCards,
      scanOutline,
      startBarcodeScan,
      startMultiBarcodeScan
    };
  }
});
</script>

<style scoped>
/* Global Styles */
.dashboard-container {
  padding: 1rem;
  background-color: #f8f9fa;
  min-height: 100%;
}

/* Header Styling */
.main-toolbar {
  --background: #ffffff;
  --color: #333333;
  --border-color: transparent;
  --padding-top: 0.5rem;
  --padding-bottom: 0.5rem;
}

.logo-container {
  display: flex;
  align-items: center;
}

.logo-icon {
  font-size: 1.5rem;
  color: #FF4B2B;
  margin-right: 0.5rem;
}

.logo-text {
  font-weight: 700;
  font-size: 1.2rem;
  color: #FF4B2B;
}

.notification-btn {
  position: relative;
}

.user-btn {
  --padding-start: 0.5rem;
  --padding-end: 0.5rem;
}



/* Welcome Banner */
.welcome-banner {
  background: linear-gradient(135deg, #FF4B2B 0%, #FF416C 100%);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  color: white;
  box-shadow: 0 4px 12px rgba(255, 75, 43, 0.2);
}

.welcome-banner h1 {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
}

.welcome-banner p {
  font-size: 0.95rem;
  margin: 0;
  opacity: 0.9;
}

/* Section Styling */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.section-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.view-all-btn {
  --color: #FF4B2B;
  --padding-start: 0.5rem;
  --padding-end: 0.5rem;
  font-size: 0.85rem;
}

/* Navigation Cards */
.nav-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

.nav-card {
  margin: 0;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  overflow: hidden;
  background: white;
}

.nav-card:active {
  transform: scale(0.98);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.nav-card ion-card-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem 1rem;
  text-align: center;
}

.nav-icon {
  font-size: 2.5rem;
  margin-bottom: 0.8rem;
}

.nav-icon.inventory {
  color: #4caf50;
}

.nav-icon.barcode-scanner {
  color: #2196f3;
}

.nav-icon.users {
  color: #9c27b0;
}

.nav-icon.reports {
  color: #ff9800;
}

.nav-icon.warehouse {
  color: #795548;
}

.nav-icon.orders {
  color: #f44336;
}

.nav-icon.delivery {
  color: #00bcd4;
}

.nav-icon.delivery-history {
  color: #9c27b0;
}

.nav-icon.recent-deliveries {
  color: #ff9800;
}

.nav-label {
  font-weight: 500;
  color: #333;
}





.welcome-text {
  display: none;
}

/* Tablet and larger screens */
@media (min-width: 768px) {
  .nav-cards {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .welcome-text {
    display: inline;
    margin-left: 0.5rem;
  }
  
  .welcome-banner h1 {
    font-size: 1.8rem;
  }
  
  .welcome-banner p {
    font-size: 1.1rem;
  }
}

/* Large screens */
@media (min-width: 1200px) {
  .nav-cards {
    grid-template-columns: repeat(6, 1fr);
  }
}

/* User Menu Styles */
ion-popover {
  --width: 200px;
}

ion-popover ion-item {
  --padding-start: 16px;
  --padding-end: 16px;
  --min-height: 48px;
}

ion-popover ion-icon {
  margin-right: 12px;
  color: #666;
}
</style>