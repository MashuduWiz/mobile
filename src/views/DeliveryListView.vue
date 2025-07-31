<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar class="main-toolbar">
        <ion-buttons slot="start">
          <ion-button class="hamburger-menu" @click="toggleMenu">
            <ion-icon :icon="menuOutline" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title class="header-title">Delivery List</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="openRoutePlan" class="route-plan-icon-button">
            <ion-icon :icon="navigateOutline" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="delivery-container">
        <!-- Statistics Card -->
        <div class="stats-card">
          <div class="stat-item">
            <div class="stat-value">{{ driverTotalDeliveries }}</div>
            <div class="stat-label">DELIVERIES</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ driverActiveDeliveries }}</div>
            <div class="stat-label">ACTIVE</div>
          </div>
        </div>

        <!-- Filter Tabs -->
        <div class="filter-tabs">
          <ion-segment v-model="filterStatus" @ionChange="handleFilterChange" class="filter-segment">
            <ion-segment-button value="all">
              <ion-label>ALL DELI...</ion-label>
            </ion-segment-button>
            <ion-segment-button value="on-route">
              <ion-label>ON ROUTE</ion-label>
            </ion-segment-button>
            <ion-segment-button value="completed">
              <ion-label>COMPLE...</ion-label>
            </ion-segment-button>
          </ion-segment>
        </div>

        <!-- Search Section (Hidden by default, can be accessed via hamburger menu) -->
        <div class="search-section" v-if="showSearch">
          <ion-searchbar v-model="searchQuery" placeholder="Search deliveries" @ionInput="handleSearch" class="search-bar"></ion-searchbar>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="loading-state">
          <ion-spinner name="crescent"></ion-spinner>
          <p>Loading deliveries...</p>
        </div>

        <!-- Delivery List -->
        <ion-list v-else class="delivery-list">
          <ion-item v-for="delivery in filteredDeliveries" :key="delivery.id" class="delivery-item">
            <ion-label @click="viewDeliveryDetails(delivery)">
              <h2>{{ delivery.waybill_number }}</h2>
              <p>Recipient: {{ delivery.recipient_name }}</p>
              <p>Contact: {{ delivery.recipient_contact_number }}</p>
              <p>Address: {{ delivery.house_number }} {{ delivery.street_name }}, {{ delivery.suburb }}, {{
                delivery.province }}</p>
              <p v-if="filterStatus === 'completed'">
                Status: <span class="status-delivered">Delivered</span>
                <br>
                <small>Completed: {{ new Date(delivery.completed_at).toLocaleString() }}</small>
                <br>
                <small>By: {{ delivery.completed_by_name }}</small>
              </p>
              <p v-else>
                Status: <span :class="'status-' + delivery.status">{{ delivery.status }}</span>
              </p>
            </ion-label>
            <ion-buttons slot="end">
              <ion-button v-if="filterStatus !== 'completed'" @click="updateDeliveryStatus(delivery)">
                <ion-icon :icon="createOutline" slot="icon-only"></ion-icon>
              </ion-button>
            </ion-buttons>
          </ion-item>
        </ion-list>

        <!-- Empty State -->
        <div v-if="!loading && filteredDeliveries.length === 0" class="empty-state">
          <ion-icon :icon="carOutline" class="empty-icon"></ion-icon>
          <h3 v-if="filterStatus === 'completed'">No Completed Deliveries Found</h3>
          <h3 v-else-if="filterStatus === 'on-route'">No On-Route Deliveries Found</h3>
          <h3 v-else-if="filterStatus === 'failed'">No Failed Deliveries Found</h3>
          <h3 v-else-if="filterStatus === 'wrong_address'">No Wrong Address Deliveries Found</h3>
          <h3 v-else>No Active Deliveries Found</h3>
          <p v-if="filterStatus === 'completed'">No completed deliveries match your search criteria.</p>
          <p v-else>Add a new delivery or adjust your filters. Completed deliveries are stored separately.</p>
          
          <!-- Debug Information -->
          <div v-if="debugInfo" class="debug-info">
            <h4>Debug Information:</h4>
            <p><strong>User Role:</strong> {{ debugInfo.isDriver ? 'Driver' : 'Other' }}</p>
            <p><strong>Has Pending Deliveries:</strong> {{ debugInfo.hasPendingDeliveries ? 'Yes' : 'No' }}</p>
            <p><strong>Filtered Count:</strong> {{ debugInfo.filteredCount }}</p>
            <p><strong>On-Route Count:</strong> {{ debugInfo.onRouteCount }}</p>
            <p><strong>Total Deliveries:</strong> {{ deliveries.length }}</p>
            <p><strong>Current User:</strong> {{ currentUser ? `${currentUser.firstName} ${currentUser.lastName} (${currentUser.role})` : 'None' }}</p>
            <p><strong>Current Filter:</strong> {{ filterStatus }}</p>
            <p><strong>Delivery Statuses:</strong> {{ debugInfo.statusBreakdown }}</p>
          </div>
        </div>

        <!-- Route Planner Section -->
        <div v-if="showRoutePlanner && mapStore.route" class="route-planner-section">
          <div class="route-planner-grid">
            <div class="map-container">
              <RouteMap />
            </div>
            <div class="route-info">
              <RouteStats />
              <StopList />
            </div>
          </div>
        </div>

        <!-- Navigation Error -->
        <div v-if="navigationError" class="navigation-error">
          {{ navigationError }}
        </div>
      </div>
    </ion-content>

    <!-- Delivery Details Modal -->
    <ion-modal :is-open="isModalOpen" @didDismiss="closeModal">
      <ion-header class="ion-no-border">
        <ion-toolbar class="modal-toolbar">
          <ion-title class="modal-title">Delivery Details</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="closeModal" class="close-button">Close</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="modal-content">
        <div v-if="selectedDelivery" class="delivery-details">
          <!-- For completed deliveries, show completion details -->
          <div v-if="filterStatus === 'completed' || selectedDelivery.status === 'delivered' || selectedDelivery.status === 'completed'">
            <ion-card>
              <ion-card-header>
                <ion-card-title>Waybill #{{ selectedDelivery.waybill_number }}</ion-card-title>
                <ion-card-subtitle>
                  Status: <span :class="'status-' + selectedDelivery.completion_status || selectedDelivery.status">{{ selectedDelivery.completion_status || selectedDelivery.status }}</span>
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
                      <p>Completed At: {{ selectedDelivery.completed_at ? new Date(selectedDelivery.completed_at).toLocaleString() : 'Not available' }}</p>
                      <p>Completed By: {{ selectedDelivery.completed_by_name }}</p>
                      <p>Status: {{ selectedDelivery.completion_status || selectedDelivery.status }}</p>
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
                  <ion-item>
                    <ion-label>
                      <h3>Original Assignment Information</h3>
                      <p>Assigned Date: {{ new Date(selectedDelivery.assignedAt).toLocaleString() }}</p>
                      <p>Added Date: {{ new Date(selectedDelivery.addedDate).toLocaleString() }}</p>
                      <p v-if="selectedDelivery.route_started_at">Route Started: {{ selectedDelivery.route_started_at ? new Date(selectedDelivery.route_started_at).toLocaleString() : 'Not available' }}</p>
                    </ion-label>
                  </ion-item>
                </ion-list>
              </ion-card-content>
            </ion-card>
          </div>

          <!-- For active deliveries, show original details -->
          <div v-else>
            <ion-card>
              <ion-card-header>
                <ion-card-title>Waybill #{{ selectedDelivery.waybill_number }}</ion-card-title>
                <ion-card-subtitle>
                  Status: <span :class="'status-' + selectedDelivery.status">{{ selectedDelivery.status }}</span>
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
                      <h3>Delivery Instructions</h3>
                      <p>{{ selectedDelivery.instructions || 'No special instructions' }}</p>
                    </ion-label>
                  </ion-item>
                  <ion-item>
                    <ion-label>
                      <h3>Assignment Information</h3>
                      <p>Assigned Date: {{ new Date(selectedDelivery.assignedAt).toLocaleString() }}</p>
                      <p>Added Date: {{ new Date(selectedDelivery.addedDate).toLocaleString() }}</p>
                      <p>Last Updated: {{ new Date(selectedDelivery.lastUpdated).toLocaleString() }}</p>
                    </ion-label>
                  </ion-item>
                  <ion-item v-if="selectedDelivery.assignedDrivers && selectedDelivery.assignedDrivers.length > 0">
                    <ion-label>
                      <h3>Assigned Drivers</h3>
                      <div v-for="(driver, index) in selectedDelivery.assignedDrivers" :key="index">
                        <p>Name: {{ driver.name }}</p>
                        <p>Email: {{ driver.email }}</p>
                        <p>Assigned At: {{ new Date(driver.assignedAt).toLocaleString() }}</p>
                        <hr v-if="index < selectedDelivery.assignedDrivers.length - 1">
                      </div>
                    </ion-label>
                  </ion-item>
                </ion-list>
              </ion-card-content>
            </ion-card>

            <!-- Fixed bottom button for active deliveries -->
            <div class="fixed-bottom-button">
              <ion-button expand="block" fill="solid" @click="navigateToDeliveryCompletion" class="complete-button">
                Complete Delivery
                <ion-icon :icon="checkmarkCircleOutline" slot="end"></ion-icon>
              </ion-button>
            </div>
          </div>
        </div>
      </ion-content>
    </ion-modal>

    <!-- Route Planner Modal -->
    <ion-modal :is-open="showRoutePlanner && !isMinimized" @didDismiss="closeRoutePlanner">
      <ion-header class="ion-no-border">
        <ion-toolbar class="modal-toolbar">
          <ion-title class="modal-title">Route Planner</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="toggleStats" class="stats-toggle-button">
              <ion-icon :icon="showStats ? chevronDownOutline : chevronUpOutline" slot="icon-only"></ion-icon>
            </ion-button>
            <ion-button @click="toggleMinimize" class="minimize-button">
              <ion-icon :icon="chevronDownOutline" slot="icon-only"></ion-icon>
            </ion-button>
            <ion-button @click="closeRoutePlanner" class="close-button">Back</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="modal-content">
        <div v-if="mapStore.route" class="route-planner-fullscreen">
          <div class="map-container-fullscreen">
            <RouteMap />
          </div>
          <div class="route-info-collapsible" :class="{ 'hidden': !showStats }">
            <RouteStats />
            <StopList />
          </div>
          <!-- Start Navigation Button - Fixed at bottom -->
          <div class="navigation-button-container">
            <ion-button 
              v-if="!isCurrentlyNavigating" 
              expand="block" 
              color="primary" 
              @click="startRouteNavigation" 
              class="start-navigation-btn"
            >
              <ion-icon :icon="navigateOutline" slot="start"></ion-icon>
              Start Navigation
            </ion-button>
            <ion-button 
              v-else 
              expand="block" 
              color="danger" 
              @click="stopNavigation" 
              class="stop-navigation-btn"
            >
              <ion-icon :icon="closeOutline" slot="start"></ion-icon>
              Stop Navigation
            </ion-button>
          </div>
        </div>
        <div v-else class="empty-state">
          <p>No route data available</p>
        </div>
      </ion-content>
    </ion-modal>

    <!-- Floating Route Widget (when minimized) -->
    <div v-if="showRoutePlanner && isMinimized" class="floating-route-widget">
      <div class="widget-header">
        <span class="widget-title">Route Active</span>
        <ion-button @click="toggleMinimize" class="expand-button">
          <ion-icon :icon="chevronUpOutline" slot="icon-only"></ion-icon>
        </ion-button>
      </div>
      <div class="widget-map-container">
        <!-- Use a simple placeholder instead of RouteMap to avoid recreation -->
        <div class="map-placeholder">
          <div class="map-info">
            <ion-icon :icon="navigateOutline" class="map-icon"></ion-icon>
            <p>Navigation Active</p>
            <small>{{ mapStore.route?.stops?.length || 0 }} stops remaining</small>
          </div>
        </div>
      </div>
      <ion-button @click="closeRoutePlanner" class="stop-navigation-button">
        <ion-icon :icon="closeOutline" slot="start"></ion-icon>
        Stop Navigation
      </ion-button>
    </div>

    <!-- Debug Info for Route Planner -->
    <div v-if="showRoutePlanner" style="position: fixed; top: 10px; left: 10px; background: white; padding: 10px; border-radius: 8px; z-index: 10000; font-size: 12px;">
      <p>showRoutePlanner: {{ showRoutePlanner }}</p>
      <p>isMinimized: {{ isMinimized }}</p>
      <p>Route exists: {{ !!mapStore.route }}</p>
      <p>Navigation State: {{ isCurrentlyNavigating }}</p>
      <p>Navigation Error: {{ navigationError }}</p>
      <p>Route Stops: {{ mapStore.route?.stops?.length || 0 }}</p>
      <p>Button State: {{ isCurrentlyNavigating ? 'Stop' : 'Start' }}</p>
      <ion-button @click="testNavigationState" size="small" color="secondary">Test Navigation State</ion-button>
      <ion-button @click="testToggleNavigation" size="small" color="primary">Toggle Navigation</ion-button>
    </div>

    <!-- Photo Viewer Modal -->
    <ion-modal :is-open="showPhotoViewer" @didDismiss="closePhotoViewer">
      <ion-header class="ion-no-border">
        <ion-toolbar class="modal-toolbar">
          <ion-title class="modal-title">Delivery Photo</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="closePhotoViewer" class="close-button">Close</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="modal-content">
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
  import { defineComponent, ref, computed, onMounted, watch, nextTick } from 'vue';
  import { useRouter } from 'vue-router';
  import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonModal,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent
} from '@ionic/vue';
  import {
    addOutline,
    eyeOutline,
    createOutline,
    carOutline,
    chevronBackOutline,
    chevronForwardOutline,
    checkmarkCircleOutline,
    navigateOutline,
    closeOutline,
    menuOutline,
    chevronUpOutline,
    chevronDownOutline
  } from 'ionicons/icons';
  import { db } from '../firebase/config';
  import { ref as dbRef, onValue, update, get } from 'firebase/database';
  import { getUserData } from '@/services/auth';
  import { loadingController } from '@ionic/vue';
  import RouteMap from '../components/route-planner/RouteMap.vue';
  import RouteStats from '../components/route-planner/RouteStats.vue';
  import StopList from '../components/route-planner/StopList.vue';
  import { useMapStore } from '../stores/mapStores';
  import { useNavigationStore } from '../stores/navigationStore';
  import { useGoogleMaps } from '../composables/useGoogleMaps';
  import { useNavigation } from '../composables/useNavigation';
  import BottomNavigation from '@/components/BottomNavigation.vue';
  import { toastController } from '@ionic/vue';

  interface Driver {
    name: string;
    email: string;
    assignedAt: string;
  }

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
    status: string;
    instructions?: string;
    assignedAt: string;
    addedDate: string;
    lastUpdated: string;
    assignedDrivers?: Driver[];
    latitude: number;
    longitude: number;
    // Completion properties for completed deliveries
    completed_at?: string;
    completed_by_name?: string;
    completion_status?: string;
    completion_comments?: string;
    completion_photos?: string[];
    route_started_at?: string;
  }

  interface UserData {
    uid: string;
    email: string;
    firstName: string;
    lastName: string;
    company: string;
    companyId: string;
    role: string;
    permissions: string[];
    isVerified: boolean;
  }

  export default defineComponent({
    name: 'DeliveryListView',
      components: {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonIcon,
    IonList,
    IonItem,
    IonLabel,
    IonSearchbar,
    IonSegment,
    IonSegmentButton,
    IonModal,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    RouteMap,
    RouteStats,
    StopList,
    BottomNavigation
  },
    setup() {
      // Initialize router
      const router = useRouter();
      const searchQuery = ref('');
      const filterStatus = ref('all');
      const deliveries = ref < Delivery[] > ([]);
      const completedDeliveries = ref < any[] > ([]);
      const loading = ref(true);
      const currentUser = ref < UserData | null > (null);
      const isModalOpen = ref(false);
      const selectedDelivery = ref < Delivery | null > (null);
      const currentDeliveryIndex = ref(0);
      const showRoutePlanner = ref(false);
      const showPhotoViewer = ref(false);
      const selectedPhoto = ref('');
      const showSearch = ref(false);
      const isMinimized = ref(false);
      const showStats = ref(false); // Start with stats hidden

      // Initialize map store
      const mapStore = useMapStore();
      const navigationStore = useNavigationStore();
      
      // Initialize navigation composable
      const { startNavigation: startTurnByTurnNavigation } = useNavigation();
      
      // Get navigation functions from MapComponent
      const getNavigationFunctions = () => {
        return (window as any).navigationFunctions;
      };

      // Use navigation store for state management
      const isCurrentlyNavigating = computed(() => navigationStore.isCurrentlyNavigating);
      const navigationError = computed(() => navigationStore.navigationError);

      // Watch for navigation state changes to update UI
      watch(() => navigationStore.isNavigating, (newState, oldState) => {
        console.log('Navigation state watcher triggered:', newState, 'from:', oldState);
        console.log('Navigation state watcher stack trace:', new Error().stack);
      });

      // Initialize navigation when route planner opens
      watch(showRoutePlanner, async (isOpen) => {
        if (isOpen && mapStore.route) {
          console.log('Route planner opened, ensuring navigation is initialized');
          // The navigation will be initialized by the MapComponent
          // We just need to wait for it to be ready
        }
      });

      // Initialize Google Maps composable at the top level
      const { geocodeAddress, getCurrentLocation } = useGoogleMaps();

      onMounted(async () => {
        console.log('DeliveryListView: Starting user data retrieval...');
        const userData = await getUserData();
        console.log('DeliveryListView: Retrieved user data:', userData);
        
        if (!userData) {
          console.log('DeliveryListView: No user data found, redirecting to login');
          router.push('/login');
          return;
        }
        
        currentUser.value = userData;
        console.log('DeliveryListView: Current user set:', {
          uid: userData.uid,
          email: userData.email,
          role: userData.role,
          firstName: userData.firstName,
          lastName: userData.lastName
        });
        
        fetchDeliveries();
      });

      const fetchDeliveries = () => {
        const deliveriesRef = dbRef(db, 'delivery_list');
        onValue(deliveriesRef, (snapshot) => {
          const data = snapshot.val();
          console.log('Raw Firebase delivery data:', data);
          if (data) {
            deliveries.value = Object.entries(data).map(([key, value]) => {
              console.log('Mapping delivery:', { key, value });
              return {
                id: key,
                ...(value as Omit<Delivery, 'id'>)
              };
            });
          } else {
            deliveries.value = [];
          }
          loading.value = false;
        }, (error) => {
          console.error('Error fetching deliveries:', error);
          loading.value = false;
        });

        // Also fetch completed deliveries
        const completedDeliveriesRef = dbRef(db, 'completed_deliveries');
        onValue(completedDeliveriesRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            completedDeliveries.value = Object.entries(data).map(([key, value]) => ({
              id: key,
              ...(value as any)
            }));
          } else {
            completedDeliveries.value = [];
          }
        }, (error) => {
          console.error('Error fetching completed deliveries:', error);
        });
      };

      const filteredDeliveries = computed(() => {
        if (!currentUser.value) {
          console.log('DeliveryListView: No current user, returning empty array');
          return [];
        }
        
        const userRole = currentUser.value.role.toLowerCase();
        const userEmail = currentUser.value.email;
        
        console.log('DeliveryListView: Filtering deliveries for user:', {
          role: userRole,
          email: userEmail,
          totalDeliveries: deliveries.value.length,
          filterStatus: filterStatus.value
        });
        
        // If showing completed deliveries, filter from completed_deliveries table
        if (filterStatus.value === 'completed') {
          const filtered = completedDeliveries.value.filter((delivery: any) => {
            // Role-based filtering for completed deliveries
            if (userRole === 'driver') {
              // Drivers only see deliveries they completed
              if (delivery.completed_by_email !== userEmail) {
                return false;
              }
            }
            
            // Search filtering for completed deliveries
            const matchesSearch = delivery.waybill_number?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
              delivery.recipient_name?.toLowerCase().includes(searchQuery.value.toLowerCase());
            
            return matchesSearch;
          });
          
          // Sort completed deliveries by completion date (most recent first)
          const sorted = filtered.sort((a: any, b: any) => {
            const dateA = new Date(a.completed_at || a.completedAt || 0);
            const dateB = new Date(b.completed_at || b.completedAt || 0);
            return dateB.getTime() - dateA.getTime(); // Most recent first
          });
          
          console.log('DeliveryListView: Filtered and sorted completed deliveries count:', sorted.length);
          return sorted;
        }
        
        // For active deliveries, filter from delivery_list table
        const filtered = deliveries.value.filter((delivery: Delivery) => {
          // Only exclude delivered deliveries from the main delivery list
          // Failed and wrong_address deliveries should remain in the list
          if (delivery.status === 'delivered') {
            return false;
          }
          
          // Role-based filtering
          if (userRole === 'driver') {
            // Drivers only see deliveries assigned to them
            const isAssignedToDriver = delivery.assignedDrivers?.some((driver: Driver) => driver.email === userEmail);
            if (!isAssignedToDriver) return false;
          }
          // For admin, manager, and other roles, show all deliveries
          // (no additional filtering needed)
          
          // Search and status filtering
          const matchesSearch = delivery.waybill_number?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
            delivery.recipient_name?.toLowerCase().includes(searchQuery.value.toLowerCase());
          const matchesFilter = filterStatus.value === 'all' || delivery.status === filterStatus.value;
          
          return matchesSearch && matchesFilter;
        });
        
        console.log('DeliveryListView: Filtered active deliveries count:', filtered.length);
        return filtered;
      });

      // Statistics computed properties
      const totalDeliveries = computed(() => deliveries.value.length);
      const activeDeliveries = computed(() => 
        deliveries.value.filter(d => d.status !== 'delivered' && d.status !== 'completed').length
      );

      // Driver-specific statistics
      const driverTotalDeliveries = computed(() => {
        if (!currentUser.value || currentUser.value.role.toLowerCase() !== 'driver') {
          return totalDeliveries.value;
        }
        return deliveries.value.filter(delivery => 
          delivery.assignedDrivers?.some((driver: Driver) => driver.email === currentUser.value?.email)
        ).length;
      });

      const driverActiveDeliveries = computed(() => {
        if (!currentUser.value || currentUser.value.role.toLowerCase() !== 'driver') {
          return activeDeliveries.value;
        }
        return deliveries.value.filter(delivery => 
          delivery.status !== 'delivered' && 
          delivery.status !== 'completed' &&
          delivery.assignedDrivers?.some((driver: Driver) => driver.email === currentUser.value?.email)
        ).length;
      });

      const handleSearch = () => {
        // Search is handled by the computed property
      };

      const handleFilterChange = () => {
        // Filter is handled by the computed property
      };

      const openAddDeliveryModal = () => {
        // TODO: Implement add delivery functionality
        console.log('Add delivery functionality not implemented');
      };

      const viewDeliveryDetails = (delivery: Delivery) => {
        selectedDelivery.value = delivery;
        currentDeliveryIndex.value = filteredDeliveries.value.findIndex(d => d.id === delivery.id);
        isModalOpen.value = true;
      };

      const closeModal = () => {
        isModalOpen.value = false;
        selectedDelivery.value = null;
      };

      const navigateToNext = () => {
        if (currentDeliveryIndex.value < filteredDeliveries.value.length - 1) {
          currentDeliveryIndex.value++;
          selectedDelivery.value = filteredDeliveries.value[currentDeliveryIndex.value];
        }
      };

      const navigateToPrevious = () => {
        if (currentDeliveryIndex.value > 0) {
          currentDeliveryIndex.value--;
          selectedDelivery.value = filteredDeliveries.value[currentDeliveryIndex.value];
        }
      };

      const updateDeliveryStatus = async (delivery: Delivery) => {
        try {
          let newStatus;
          switch (delivery.status) {
            case 'pending':
              newStatus = 'on-route';
              break;
            case 'on-route':
              newStatus = 'in-progress';
              break;
            case 'in-progress':
              newStatus = 'pending';
              break;
            default:
              newStatus = 'pending';
          }

          await update(dbRef(db, `delivery_list/${delivery.id}/status`), { status: newStatus });
        } catch (error) {
          console.error('Error updating delivery status:', error);
        }
      };

      const navigateToDeliveryCompletion = () => {
        console.log('Navigation clicked');
        console.log('Selected delivery:', selectedDelivery.value);
        if (selectedDelivery.value) {
          const deliveryId = selectedDelivery.value.id;
          const waybillNumber = selectedDelivery.value.waybill_number;

          console.log('Navigating to:', {
            name: 'delivery-completion',
            params: {
              deliveryId,
              waybillNumber
            }
          });

          // Close modal after getting the data
          closeModal();

          // Navigate to the completion page
          router.push({
            name: 'delivery-completion',
            params: {
              deliveryId,
              waybillNumber
            }
          }).catch(error => {
            console.error('Navigation error:', error);
          });
        } else {
          console.error('No delivery selected');
        }
      };

      const openRoutePlan = async () => {
        if (filteredDeliveries.value.length === 0) {
          alert('No deliveries available for route planning');
          return;
        }

        let loadingElement;
        try {
          loadingElement = await loadingController.create({
            message: 'Loading and optimizing route...',
            duration: 0
          });
          await loadingElement.present();

          // First geocode all addresses
          const routeStops = await Promise.all(
            filteredDeliveries.value.map(async (delivery) => {
              const address = `${delivery.house_number} ${delivery.street_name}, ${delivery.suburb}, ${delivery.province}`;
              try {
                const location = await geocodeAddress(address);
                return {
                  lat: location.lat,
                  lng: location.lng,
                  address,
                  waybillNumber: delivery.waybill_number,
                  name: delivery.recipient_name
                };
              } catch (err) {
                console.error(`Failed to geocode address: ${address}`, err);
                throw new Error(`Failed to geocode address: ${address}`);
              }
            })
          );

          // Get current location for route optimization
          const currentLocation = await getCurrentLocation();
          console.log('Current location for route planning:', currentLocation);

          // Set initial route in store (will be optimized when map loads)
          mapStore.setRoute({
            stops: routeStops,
            totalDistance: '0 km',
            totalDuration: '0h 0m'
          });

          console.log('Route planner opened with stops:', routeStops.map(s => s.waybillNumber));

          // Show the route planner
          showRoutePlanner.value = true;
          await loadingElement.dismiss();
        } catch (err) {
          console.error('Failed to prepare route:', err);
          const toast = await toastController.create({
            message: 'Failed to prepare route. Please try again.',
            duration: 2000,
            color: 'danger'
          });
          await toast.present();
          if (loadingElement) {
            await loadingElement.dismiss();
          }
        }
      };

      const toggleMinimize = () => {
        isMinimized.value = !isMinimized.value;
        console.log('Toggle minimize:', isMinimized.value);
      };

      const toggleStats = () => {
        showStats.value = !showStats.value;
        console.log('Toggle stats:', showStats.value);
      };

      const closeRoutePlanner = () => {
        showRoutePlanner.value = false;
        isMinimized.value = false; // Reset minimize state when closing
        mapStore.clearRoute();
      };

      const isDriver = computed(() => currentUser.value?.role?.toLowerCase() === 'driver');

      const hasPendingDeliveries = computed(() => filteredDeliveries.value.some(delivery => delivery.status === 'on-route'));

      const viewPhoto = (photoUrl: string) => {
        selectedPhoto.value = photoUrl;
        showPhotoViewer.value = true;
      };

      const closePhotoViewer = () => {
        showPhotoViewer.value = false;
        selectedPhoto.value = '';
      };

      const toggleMenu = () => {
        showSearch.value = !showSearch.value;
      };

      const startRouteNavigation = async () => {
        console.log('Start navigation clicked');
        
        if (!mapStore.route?.stops.length) {
          console.error('No stops available for navigation');
          const toast = await toastController.create({
            message: 'No route data available for navigation',
            duration: 2000,
            color: 'warning'
          });
          await toast.present();
          return;
        }

        let loadingElement;
        try {
          // Show loading indicator
          loadingElement = await loadingController.create({
            message: 'Starting turn-by-turn navigation...',
            duration: 0
          });
          await loadingElement.present();

          // Get current user data
          const userData = await getUserData();
          console.log('Retrieved user data:', userData);
          
          if (!userData) {
            throw new Error('User data not available. Please try logging in again.');
          }

          // For employee users, the uid should be available
          // Let's also check if we can use email as a fallback identifier
          let userId = userData.uid;
          
          if (!userId) {
            console.warn('UID not found, trying to use email as identifier');
            if (userData.email) {
              userId = userData.email; // Use email as fallback identifier
            } else {
              console.error('User data exists but neither UID nor email is available:', userData);
              throw new Error('User identifier not available. Please try logging in again.');
            }
          }

          // Use the optimized route from the store
          const optimizedStops = mapStore.route.stops;
          console.log('Starting navigation with optimized stops:', optimizedStops.map(s => s.waybillNumber));
          
          // Update waybill statuses to "on-route"
          const currentTime = new Date().toISOString();
          const updates: Record<string, any> = {};

          // Get all waybill numbers from the optimized route stops
          const waybillNumbers = optimizedStops
            .map(stop => stop.waybillNumber)
            .filter(waybillNumber => waybillNumber); // Filter out any undefined values

          console.log('Updating waybill statuses for:', waybillNumbers);

          if (waybillNumbers.length === 0) {
            throw new Error('No valid waybill numbers found in route stops');
          }

          // First, we need to find the delivery IDs for these waybill numbers
          // We'll need to fetch the delivery list to match waybill numbers with IDs
          const deliveriesRef = dbRef(db, 'delivery_list');
          const snapshot = await get(deliveriesRef);
          
          if (snapshot.exists()) {
            const deliveries = snapshot.val();
            const deliveryEntries = Object.entries(deliveries);
            
            // Find deliveries that match our waybill numbers
            const deliveriesToUpdate = deliveryEntries.filter(([, delivery]: [string, any]) => 
              waybillNumbers.includes(delivery.waybill_number)
            );

            console.log(`Found ${deliveriesToUpdate.length} deliveries to update`);

            if (deliveriesToUpdate.length === 0) {
              throw new Error('No deliveries found matching the waybill numbers in your route');
            }

            // Create updates for each delivery
            deliveriesToUpdate.forEach(([id, delivery]: [string, any]) => {
              // Validate that we have all required data
              if (!id || !delivery) {
                console.warn('Skipping invalid delivery entry:', { id, delivery });
                return;
              }

              updates[`delivery_list/${id}/status`] = 'on-route';
              updates[`delivery_list/${id}/route_started_at`] = currentTime;
              updates[`delivery_list/${id}/route_started_by`] = userId;
              updates[`delivery_list/${id}/lastUpdated`] = currentTime;
            });

            // Apply all updates
            if (Object.keys(updates).length > 0) {
              console.log('Applying updates:', updates);
              await update(dbRef(db), updates);
              console.log('Successfully updated waybill statuses');
            } else {
              throw new Error('No valid updates to apply');
            }
          } else {
            throw new Error('No delivery data found in database');
          }

          // Dismiss loading indicator
          await loadingElement.dismiss();
          
          // Show success toast
          const successToast = await toastController.create({
            message: `Updated ${waybillNumbers.length} waybills to on-route status`,
            duration: 2000,
            color: 'success'
          });
          await successToast.present();
          
          // Start the actual turn-by-turn navigation with the route stops
          if (mapStore.route?.stops && mapStore.route.stops.length > 0) {
            console.log('Starting turn-by-turn navigation with stops:', optimizedStops);
            console.log('Map store route:', mapStore.route);
            console.log('Navigation store state:', navigationStore.isNavigating);
            
            // Get navigation functions from MapComponent
            const navFunctions = getNavigationFunctions();
            console.log('Navigation functions available:', !!navFunctions);
            console.log('startNavigation function available:', !!(navFunctions && navFunctions.startNavigation));
            
            if (navFunctions && navFunctions.startNavigation) {
              // Start navigation using the MapComponent's navigation system
              console.log('Calling MapComponent startNavigation...');
              await navFunctions.startNavigation(optimizedStops);
              
              // Update navigation store state
              navigationStore.startNavigation();
              console.log('Navigation started via MapComponent');
            } else {
              // Fallback to local navigation
              console.log('Falling back to local navigation...');
              await startTurnByTurnNavigation(optimizedStops);
              navigationStore.startNavigation();
              console.log('Navigation started via local composable');
            }
          } else {
            throw new Error('No route stops available for navigation');
          }
          
          // Force a reactive update
          await nextTick();
          
          // Show navigation started toast
          const navigationToast = await toastController.create({
            message: 'Turn-by-turn navigation started! Follow the route on the map.',
            duration: 3000,
            color: 'success'
          });
          await navigationToast.present();
          
        } catch (err) {
          console.error('Failed to start navigation:', err);
          
          // Dismiss loading if it's still showing
          if (loadingElement) {
            await loadingElement.dismiss();
          }
          
          // Show error toast
          const errorToast = await toastController.create({
            message: 'Failed to start navigation: ' + (err instanceof Error ? err.message : 'Unknown error'),
            duration: 3000,
            color: 'danger'
          });
          await errorToast.present();
        }
      };

      const stopNavigation = async () => {
        console.log('Stop navigation clicked');
        try {
          // Get navigation functions from MapComponent
          const navFunctions = getNavigationFunctions();
          if (navFunctions && navFunctions.stopLocationTracking) {
            // Stop navigation using the MapComponent's navigation system
            navFunctions.stopLocationTracking();
            console.log('Navigation stopped via MapComponent');
          } else {
            // Fallback to local navigation
            const { stopLocationTracking } = useNavigation();
            stopLocationTracking();
            console.log('Navigation stopped via local composable');
          }
          
          // Update navigation store state
          navigationStore.stopNavigation();
          console.log('Navigation stopped by user');
          
          // Force a reactive update
          await nextTick();
          
          const toast = await toastController.create({
            message: 'Navigation stopped',
            duration: 2000,
            color: 'warning'
          });
          await toast.present();
        } catch (error) {
          console.error('Error stopping navigation:', error);
        }
      };

      // Test function to manually trigger navigation state
      const testNavigationState = () => {
        console.log('Testing navigation state...');
        console.log('Current navigation state:', navigationStore.isNavigating);
        console.log('Current navigation error:', navigationStore.navigationError);
      };

      // Simple test function to toggle navigation state
      const testToggleNavigation = () => {
        console.log('Testing navigation toggle...');
        if (navigationStore.isNavigating) {
          navigationStore.stopNavigation();
          console.log('Navigation stopped via test');
        } else {
          navigationStore.startNavigation();
          console.log('Navigation started via test');
        }
      };

        return {
          searchQuery,
          filterStatus,
          filteredDeliveries,
          loading,
          handleSearch,
          handleFilterChange,
          openAddDeliveryModal,
          viewDeliveryDetails,
          updateDeliveryStatus,
          addOutline,
          eyeOutline,
          createOutline,
          carOutline,
          navigateOutline,
          isModalOpen,
          selectedDelivery,
          currentDeliveryIndex,
          closeModal,
          navigateToNext,
          navigateToPrevious,
          chevronBackOutline,
          chevronForwardOutline,
          navigateToDeliveryCompletion,
          checkmarkCircleOutline,
          openRoutePlan,
          isDriver,
          hasPendingDeliveries,
          debugInfo: computed(() => ({
            isDriver: isDriver.value,
            hasPendingDeliveries: hasPendingDeliveries.value,
            filteredCount: filteredDeliveries.value.length,
            onRouteCount: filteredDeliveries.value.filter(d => d.status === 'on-route').length,
            statusBreakdown: {
              pending: filteredDeliveries.value.filter(d => d.status === 'pending').length,
              onRoute: filteredDeliveries.value.filter(d => d.status === 'on-route').length,
              inProgress: filteredDeliveries.value.filter(d => d.status === 'in-progress').length,
              completed: filteredDeliveries.value.filter(d => d.status === 'completed').length,
              delivered: filteredDeliveries.value.filter(d => d.status === 'delivered').length,
              failed: filteredDeliveries.value.filter(d => d.status === 'failed').length,
              wrongAddress: filteredDeliveries.value.filter(d => d.status === 'wrong_address').length
            }
          })),
          currentUser,
          deliveries,
          showRoutePlanner,
          closeRoutePlanner,
          mapStore,
          navigationError,
          closeOutline,
          viewPhoto,
          showPhotoViewer,
          selectedPhoto,
          closePhotoViewer,
          totalDeliveries,
          activeDeliveries,
          driverTotalDeliveries,
          driverActiveDeliveries,
          showSearch,
          toggleMenu,
          menuOutline,
          isMinimized,
          toggleMinimize,
          chevronUpOutline,
          chevronDownOutline,
          showStats,
          toggleStats,
          navigationStore,
          isCurrentlyNavigating,
          startRouteNavigation,
          stopNavigation,
          testNavigationState,
          testToggleNavigation
        };
    }
  });
</script>

<style scoped>
  .delivery-container {
    padding: 1rem;
    background-color: #f8f9fa;
    min-height: 100%;
  }

  /* Header Styling */
  .main-toolbar {
    --background: linear-gradient(135deg, #FF4B2B 0%, #FF416C 100%);
    --color: white;
    --border-color: transparent;
    --padding-top: 0.5rem;
    --padding-bottom: 0.5rem;
  }

  .main-toolbar ion-title {
    color: white;
    font-weight: 600;
  }

  .main-toolbar ion-back-button {
    --color: white;
  }

  .hamburger-menu {
    --color: white;
    font-size: 24px;
  }

  .header-title {
    text-align: center;
    font-weight: 600;
  }

  .route-plan-icon-button {
    --color: white;
    --background: transparent;
    --background-activated: rgba(255, 255, 255, 0.1);
    --background-hover: rgba(255, 255, 255, 0.1);
    --border-radius: 50%;
    --padding-start: 8px;
    --padding-end: 8px;
    --padding-top: 8px;
    --padding-bottom: 8px;
  }

  .route-plan-icon-button ion-icon {
    font-size: 20px;
  }

  .search-filter-section {
    margin-bottom: 1.5rem;
  }

  .search-bar {
    --background: white;
    --border-radius: 12px;
    --box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    --placeholder-color: #9ca3af;
    --color: #374151;
    margin-bottom: 1rem;
  }

  /* Statistics Card */
  .stats-card {
    background: white;
    border-radius: 12px;
    padding: 2rem 1.5rem;
    margin-bottom: 1.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .stat-item {
    text-align: center;
    flex: 1;
  }

  .stat-value {
    font-size: 1.8rem;
    font-weight: 700;
    color: #FF4B2B;
    margin-bottom: 0.5rem;
    line-height: 1;
  }

  .stat-label {
    font-size: 0.8rem;
    color: #6b7280;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  /* Filter Tabs */
  .filter-tabs {
    margin-bottom: 1.5rem;
  }

  .filter-segment {
    --background: transparent;
    --border-radius: 12px;
    --box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  /* Search Section */
  .search-section {
    margin-bottom: 1.5rem;
  }

  ion-segment {
    --background: transparent;
  }

  ion-segment-button {
    --color: #666666;
    --color-checked: #FF4B2B;
    --indicator-color: #FF4B2B;
    --font-weight: 600;
    --font-size: 0.9rem;
  }

  .delivery-list {
    background: transparent;
    padding: 0;
  }

  .delivery-list::part(list) {
    background: transparent;
  }

  .delivery-item {
    --padding-start: 1rem;
    --padding-end: 1rem;
    margin-bottom: 0.75rem;
    border-radius: 12px;
    --background: white;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    display: flex;
    align-items: center;
    justify-content: space-between;
    border: 1px solid #f3f4f6;
  }

  .delivery-item h2 {
    font-weight: 600;
    color: #333;
    margin-bottom: 0.3rem;
    background: white;
    padding: 4px 8px;
    border-radius: 6px;
    display: inline-block;
  }

  .delivery-item p {
    color: #666;
    margin: 0.2rem 0;
    font-size: 0.9rem;
  }

  .status-pending {
    color: #ff9800;
    font-weight: 500;
  }

  .status-in-progress {
    color: #2196f3;
    font-weight: 500;
  }

  .status-completed {
    color: #4caf50;
    font-weight: 500;
  }

  .status-delivered {
    color: #4caf50;
    font-weight: 500;
  }

  .status-failed {
    color: #f44336;
    font-weight: 500;
  }

  .status-wrong_address {
    color: #ff9800;
    font-weight: 500;
  }

  .empty-state {
    text-align: center;
    padding: 2rem;
    color: #666;
  }

  .empty-icon {
    font-size: 4rem;
    color: #00bcd4;
    margin-bottom: 1rem;
  }

  .empty-state h3 {
    margin: 0.5rem 0;
    color: #333;
  }

  .empty-state p {
    margin: 0;
    font-size: 0.9rem;
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    color: #666;
  }

  .loading-state ion-spinner {
    margin-bottom: 1rem;
  }

  .loading-state p {
    margin: 0;
    font-size: 0.9rem;
  }

  .delivery-details {
    padding: 0;
    background: #f8f9fa !important;
  }

  /* Force light background on all modal elements */
  .delivery-details * {
    background-color: transparent !important;
  }

  .delivery-details ion-item {
    --background: white !important;
    background: white !important;
    --border-color: transparent;
    margin-bottom: 0.75rem;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    border: 1px solid #e9ecef;
  }

  .delivery-details ion-card {
    --background: white !important;
    background: white !important;
    margin: 0 0 1rem 0;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    border: 1px solid #e9ecef;
  }

  .delivery-details ion-card-header {
    background-color: white;
    border-bottom: 1px solid #e9ecef;
  }

  .delivery-details ion-card-title {
    font-size: 1.2rem;
    font-weight: 600;
    color: #333;
  }

  .delivery-details ion-card-subtitle {
    margin-top: 0.5rem;
    color: #666;
  }

  .delivery-details ion-item h3 {
    font-weight: 600;
    color: #333;
    margin-bottom: 0.5rem;
    background: white;
    padding: 0.5rem;
    border-radius: 6px;
  }

  .delivery-details ion-item p {
    color: #666;
    margin: 0.2rem 0;
    background: white;
    padding: 0.25rem 0.5rem;
  }

  .delivery-details ion-list {
    background: transparent;
    padding: 0;
  }

  .delivery-details ion-list::part(list) {
    background: transparent;
  }

  /* Fixed Bottom Button for Delivery Details */
  .fixed-bottom-button {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: white;
    padding: 1rem;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
    z-index: 1000;
  }

  .complete-button {
    --background: linear-gradient(135deg, #FF4B2B 0%, #FF416C 100%);
    --color: white;
    --border-radius: 12px;
    --padding-top: 1rem;
    --padding-bottom: 1rem;
    font-weight: 600;
    margin: 0;
  }

  /* Add bottom padding to modal content to prevent overlap */
  .modal-content {
    --background: #f8f9fa !important;
    background: #f8f9fa !important;
    padding: 1rem;
    padding-bottom: 5rem; /* Space for fixed button */
  }

  /* Modal Styling */
  .modal-toolbar {
    --background: linear-gradient(135deg, #FF4B2B 0%, #FF416C 100%);
    --color: white;
    --border-color: transparent;
    --padding-top: 0.5rem;
    --padding-bottom: 0.5rem;
  }

  .modal-title {
    color: white;
    font-weight: 600;
  }

  .minimize-button {
    --color: white;
    --background: transparent;
    --background-activated: rgba(255, 255, 255, 0.1);
    --background-hover: rgba(255, 255, 255, 0.1);
    --border-radius: 50%;
    --padding-start: 8px;
    --padding-end: 8px;
    --padding-top: 8px;
    --padding-bottom: 8px;
  }

  .minimize-button ion-icon {
    font-size: 20px;
  }

  .close-button {
    --color: white;
    --background: transparent;
    --background-activated: rgba(255, 255, 255, 0.1);
    --background-hover: rgba(255, 255, 255, 0.1);
  }

  /* Override any dark backgrounds */
  .modal-content ion-content {
    --background: #f8f9fa !important;
    background: #f8f9fa !important;
  }

  .modal-content ion-content::part(scroll) {
    background: #f8f9fa !important;
  }

  /* Global modal styling to prevent dark backgrounds */
  ion-modal {
    --background: #f8f9fa !important;
  }

  ion-modal::part(content) {
    background: #f8f9fa !important;
  }

  ion-modal ion-content {
    --background: #f8f9fa !important;
    background: #f8f9fa !important;
  }

  ion-modal ion-content::part(scroll) {
    background: #f8f9fa !important;
  }

  /* Route Planner Specific Styling */
  .route-planner-grid {
    background: #f8f9fa;
    border-radius: 12px;
    overflow: hidden;
  }

  .map-container {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    margin-bottom: 1rem;
  }

  .route-info {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    padding: 1rem;
  }

  .empty-state {
    text-align: center;
    padding: 2rem;
    color: #666;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  .empty-state p {
    margin: 0;
    font-size: 1rem;
    color: #666;
  }

  /* Completion Photos Styling */
  .completion-photos {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 0.5rem;
    margin-top: 0.5rem;
  }

  .completion-photos .photo-item {
    aspect-ratio: 1;
    border-radius: 8px;
    overflow: hidden;
    cursor: pointer;
    transition: transform 0.2s ease;
  }

  .completion-photos .photo-item:hover {
    transform: scale(1.05);
  }

  .completion-photos .photo-item img {
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
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  /* Status Styling */
  .status-on-route {
    color: #9c27b0;
    font-weight: 500;
  }

  /* Debug Info Styling */
  .debug-info {
    margin-top: 1rem;
    padding: 1rem;
    background-color: #f8f9fa;
    border-radius: 8px;
    border: 1px solid #dee2e6;
    font-size: 0.9rem;
  }

  .debug-info h4 {
    margin: 0 0 0.5rem 0;
    color: #495057;
    font-size: 1rem;
  }

  .debug-info p {
    margin: 0.25rem 0;
    color: #6c757d;
  }

  /* Minimized Modal Styling */
  .modal-content.minimized {
    padding: 0;
    background: transparent !important;
    position: fixed;
    top: auto;
    left: auto;
    right: 20px;
    bottom: 100px;
    width: 300px;
    height: 200px;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    z-index: 9999;
    overflow: hidden;
    border: 2px solid #FF4B2B;
  }

  .route-planner-grid.minimized {
    position: relative;
    width: 100%;
    height: 100%;
    background: white;
    border-radius: 12px;
    overflow: hidden;
    margin: 0;
  }

  .map-container.minimized {
    width: 100%;
    height: 100%;
    margin: 0;
    border-radius: 12px;
    box-shadow: none;
  }

  /* Minimized Modal Overlay */
  ion-modal {
    --backdrop-opacity: 0;
  }

  ion-modal.minimized {
    --backdrop-opacity: 0;
    --width: 300px;
    --height: 200px;
    --border-radius: 12px;
    --top: auto;
    --left: auto;
    --right: 20px;
    --bottom: 100px;
  }

  /* Ensure minimized modal doesn't block interaction */
  .modal-content.minimized ion-content {
    --background: transparent !important;
    background: transparent !important;
  }

  /* Hide modal backdrop when minimized */
  ion-modal.minimized::part(backdrop) {
    display: none;
  }

  /* Floating Route Widget Styling */
  .floating-route-widget {
    position: fixed;
    bottom: 100px; /* Adjust based on Bottom Navigation height */
    right: 20px;
    width: 300px;
    height: 200px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    z-index: 9998; /* Ensure it's above other content */
    border: 2px solid #FF4B2B;
  }

  .widget-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    background-color: #FF4B2B;
    color: white;
    border-top-left-radius: 12px;
    border-top-right-radius: 12px;
    border-bottom: 1px solid #FF416C;
  }

  .widget-title {
    font-size: 1rem;
    font-weight: 600;
    color: white;
  }

  .widget-map-container {
    flex-grow: 1;
    background: #f8f9fa;
    border-bottom-left-radius: 12px;
    border-bottom-right-radius: 12px;
    overflow: hidden;
  }

  .map-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    position: relative;
  }

  .map-info {
    text-align: center;
    color: #333;
    padding: 1rem;
  }

  .map-icon {
    font-size: 2rem;
    color: #FF4B2B;
    margin-bottom: 0.5rem;
  }

  .map-info p {
    margin: 0.5rem 0;
    font-weight: 600;
    font-size: 1rem;
  }

  .map-info small {
    color: #666;
    font-size: 0.8rem;
  }

  .stop-navigation-button {
    --background: linear-gradient(135deg, #FF4B2B 0%, #FF416C 100%);
    --color: white;
    --border-radius: 12px;
    --padding-top: 0.75rem;
    --padding-bottom: 0.75rem;
    font-weight: 600;
    margin: 0.5rem 1rem;
    --box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .expand-button {
    --color: white;
    --background: transparent;
    --background-activated: rgba(255, 255, 255, 0.1);
    --background-hover: rgba(255, 255, 255, 0.1);
    --border-radius: 50%;
    --padding-start: 8px;
    --padding-end: 8px;
    --padding-top: 8px;
    --padding-bottom: 8px;
  }

  .expand-button ion-icon {
    font-size: 20px;
  }

  /* New styles for fullscreen route planner */
  .route-planner-fullscreen {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: #f8f9fa;
    position: relative;
    overflow: hidden;
  }

  .map-container-fullscreen {
    flex: 1;
    width: 100%;
    background: white;
    position: relative;
    z-index: 1;
    margin-bottom: 80px; /* Space for navigation button */
  }

  .route-info-collapsible {
    position: absolute;
    bottom: 80px; /* Position above navigation button */
    left: 0;
    right: 0;
    background: white;
    border-top-left-radius: 16px;
    border-top-right-radius: 16px;
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
    padding: 1rem;
    z-index: 10;
    max-height: 50vh;
    overflow-y: auto;
    transform: translateY(0);
    transition: transform 0.3s ease-in-out;
  }

  .route-info-collapsible.hidden {
    transform: translateY(100%);
  }

  .stats-toggle-button {
    --color: white;
    --background: transparent;
    --background-activated: rgba(255, 255, 255, 0.1);
    --background-hover: rgba(255, 255, 255, 0.1);
    --border-radius: 50%;
    --padding-start: 8px;
    --padding-end: 8px;
    --padding-top: 8px;
    --padding-bottom: 8px;
  }

  .stats-toggle-button ion-icon {
    font-size: 20px;
  }

  /* Override modal content for fullscreen */
  .modal-content {
    --background: transparent !important;
    background: transparent !important;
    padding: 0;
  }

  .modal-content ion-content {
    --background: transparent !important;
    background: transparent !important;
  }

  .modal-content ion-content::part(scroll) {
    background: transparent !important;
  }

  /* New styles for navigation buttons */
  .navigation-button-container {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 1rem;
    background: white;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
    z-index: 9999;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    border-top: 2px solid #FF4B2B;
  }

  .start-navigation-btn,
  .stop-navigation-btn {
    --background: linear-gradient(135deg, #FF4B2B 0%, #FF416C 100%);
    --color: white;
    --border-radius: 12px;
    --padding-top: 0.75rem;
    --padding-bottom: 0.75rem;
    font-weight: 600;
    --box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    width: 100%;
    max-width: 400px;
  }

  .start-navigation-btn ion-icon,
  .stop-navigation-btn ion-icon {
    font-size: 20px;
  }
</style>