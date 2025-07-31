<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/dashboard"></ion-back-button>
        </ion-buttons>
        <ion-title>Delivery History</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="showFilterModal = true" fill="clear">
            <ion-icon :icon="filterOutline" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="delivery-history-container">
        <!-- Search Bar -->
        <div class="search-section">
          <ion-searchbar
            v-model="searchQuery"
            placeholder="Search by waybill, recipient, or address..."
            @ionInput="onSearchInput"
            :debounce="300"
            class="search-bar"
          ></ion-searchbar>
        </div>

        <!-- Statistics Cards -->
        <div class="stats-section">
          <ion-card class="stat-card">
            <ion-card-content>
              <div class="stat-item">
                <div class="stat-value">{{ totalDeliveries }}</div>
                <div class="stat-label">Total Deliveries</div>
              </div>
            </ion-card-content>
          </ion-card>
          
          <ion-card class="stat-card">
            <ion-card-content>
              <div class="stat-item">
                <div class="stat-value">{{ completedDeliveries.length }}</div>
                <div class="stat-label">Completed</div>
              </div>
            </ion-card-content>
          </ion-card>
          
          <ion-card class="stat-card">
            <ion-card-content>
              <div class="stat-item">
                <div class="stat-value">{{ thisMonthDeliveries.length }}</div>
                <div class="stat-label">This Month</div>
              </div>
            </ion-card-content>
          </ion-card>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="loading-state">
          <ion-spinner name="crescent"></ion-spinner>
          <p>Loading delivery history...</p>
        </div>

        <!-- Content when loaded -->
        <div v-else>
          <!-- Filter Summary -->
          <div v-if="activeFilters.length > 0" class="filter-summary">
            <ion-chip v-for="filter in activeFilters" :key="filter.key" color="primary" @click="removeFilter(filter.key)">
              <ion-label>{{ filter.label }}</ion-label>
              <ion-icon :icon="closeOutline"></ion-icon>
            </ion-chip>
            <ion-button fill="clear" size="small" @click="clearAllFilters">
              Clear All
            </ion-button>
          </div>

          <!-- Empty State -->
          <div v-if="filteredDeliveries.length === 0 && !loading" class="empty-state">
            <ion-icon :icon="documentTextOutline" class="empty-icon"></ion-icon>
            <h3>No deliveries found</h3>
            <p v-if="searchQuery || activeFilters.length > 0">
              Try adjusting your search or filters
            </p>
            <p v-else>
              No delivery history available for this driver
            </p>
          </div>

          <!-- Deliveries List -->
          <ion-list v-else>
            <ion-item 
              v-for="delivery in paginatedDeliveries" 
              :key="delivery.id" 
              class="delivery-item"
              @click="viewDeliveryDetails(delivery)"
            >
              <ion-label>
                <div class="delivery-header">
                  <h3 class="waybill-number">{{ delivery.waybill_number }}</h3>
                  <ion-badge :color="getStatusColor(delivery.completion_status || delivery.status)" class="status-badge">
                    {{ delivery.completion_status || delivery.status }}
                  </ion-badge>
                </div>
                <p class="recipient">{{ delivery.recipient_name }}</p>
                <p class="address">{{ delivery.house_number }} {{ delivery.street_name }}, {{ delivery.suburb }}</p>
                <div class="delivery-meta">
                  <span class="completion-date">
                    <ion-icon :icon="calendarOutline" class="meta-icon"></ion-icon>
                    {{ formatDate(delivery.completed_at || delivery.addedDate) }}
                  </span>
                  <span v-if="delivery.completed_at" class="completion-time">
                    <ion-icon :icon="timeOutline" class="meta-icon"></ion-icon>
                    {{ formatTime(delivery.completed_at) }}
                  </span>
                </div>
              </ion-label>
              <ion-buttons slot="end">
                <ion-button @click="viewDeliveryDetails(delivery)" fill="clear">
                  <ion-icon :icon="eyeOutline" slot="icon-only"></ion-icon>
                </ion-button>
              </ion-buttons>
            </ion-item>
          </ion-list>

          <!-- Pagination -->
          <div v-if="totalPages > 1" class="pagination">
            <ion-button 
              :disabled="currentPage === 1" 
              @click="changePage(currentPage - 1)"
              fill="clear"
            >
              <ion-icon :icon="chevronBackOutline" slot="icon-only"></ion-icon>
            </ion-button>
            
            <span class="page-info">
              Page {{ currentPage }} of {{ totalPages }}
            </span>
            
            <ion-button 
              :disabled="currentPage === totalPages" 
              @click="changePage(currentPage + 1)"
              fill="clear"
            >
              <ion-icon :icon="chevronForwardOutline" slot="icon-only"></ion-icon>
            </ion-button>
          </div>
        </div>
      </div>
    </ion-content>

    <!-- Filter Modal -->
    <ion-modal :is-open="showFilterModal" @didDismiss="showFilterModal = false">
      <ion-header>
        <ion-toolbar>
          <ion-title>Filter Deliveries</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="showFilterModal = false">Close</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        <ion-list>
          <!-- Date Range Filter -->
          <ion-item>
            <ion-label>Date Range</ion-label>
            <ion-select v-model="dateFilter" placeholder="Select date range">
              <ion-select-option value="">All Time</ion-select-option>
              <ion-select-option value="today">Today</ion-select-option>
              <ion-select-option value="yesterday">Yesterday</ion-select-option>
              <ion-select-option value="thisWeek">This Week</ion-select-option>
              <ion-select-option value="lastWeek">Last Week</ion-select-option>
              <ion-select-option value="thisMonth">This Month</ion-select-option>
              <ion-select-option value="lastMonth">Last Month</ion-select-option>
            </ion-select>
          </ion-item>

          <!-- Status Filter -->
          <ion-item>
            <ion-label>Status</ion-label>
            <ion-select v-model="statusFilter" placeholder="Select status">
              <ion-select-option value="">All Statuses</ion-select-option>
              <ion-select-option value="delivered">Delivered</ion-select-option>
              <ion-select-option value="failed">Failed</ion-select-option>
              <ion-select-option value="wrong_address">Wrong Address</ion-select-option>
            </ion-select>
          </ion-item>

          <!-- Province Filter -->
          <ion-item>
            <ion-label>Province</ion-label>
            <ion-select v-model="provinceFilter" placeholder="Select province">
              <ion-select-option value="">All Provinces</ion-select-option>
              <ion-select-option v-for="province in availableProvinces" :key="province" :value="province">
                {{ province }}
              </ion-select-option>
            </ion-select>
          </ion-item>
        </ion-list>

        <div class="filter-actions">
          <ion-button expand="block" @click="applyFilters">Apply Filters</ion-button>
          <ion-button expand="block" fill="clear" @click="clearFilters">Clear Filters</ion-button>
        </div>
      </ion-content>
    </ion-modal>

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
                Status: <span :class="`status-${selectedDelivery.completion_status || selectedDelivery.status}`">{{ selectedDelivery.completion_status || selectedDelivery.status }}</span>
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
                    <h3>Delivery Information</h3>
                    <p>Created: {{ formatDateTime(selectedDelivery.addedDate || selectedDelivery.created_at || '') }}</p>
                    <p v-if="selectedDelivery.completed_at">Completed: {{ formatDateTime(selectedDelivery.completed_at) }}</p>
                    <p v-if="selectedDelivery.completed_by_name">Completed By: {{ selectedDelivery.completed_by_name }}</p>
                    <p v-if="selectedDelivery.completion_status">Status: {{ selectedDelivery.completion_status }}</p>
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
  IonSpinner,
  IonSearchbar,
  IonChip,
  IonSelect,
  IonSelectOption
} from '@ionic/vue';
import {
  filterOutline,
  closeOutline,
  documentTextOutline,
  calendarOutline,
  timeOutline,
  eyeOutline,
  chevronBackOutline,
  chevronForwardOutline
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
  status: string;
  addedDate: string;
  created_at?: string;
  completed_at?: string;
  completed_by_name?: string;
  completed_by_email?: string;
  completion_status?: string;
  completion_comments?: string;
  completion_photos?: string[];
}

interface Filter {
  key: string;
  label: string;
  value: string;
}

export default defineComponent({
  name: 'DeliveryHistoryView',
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
    IonSearchbar,
    IonChip,
    IonSelect,
    IonSelectOption,
    BottomNavigation
  },
  setup() {
    const router = useRouter();
    const loading = ref(true);
    const allDeliveries = ref<Delivery[]>([]);
    const currentUser = ref<any>(null);
    const searchQuery = ref('');
    const showFilterModal = ref(false);
    const isModalOpen = ref(false);
    const selectedDelivery = ref<Delivery | null>(null);
    const showPhotoViewer = ref(false);
    const selectedPhoto = ref('');

    // Filter states
    const dateFilter = ref('');
    const statusFilter = ref('');
    const provinceFilter = ref('');
    const activeFilters = ref<Filter[]>([]);

    // Pagination
    const currentPage = ref(1);
    const itemsPerPage = 20;

    // Get date ranges
    const getDateRange = (filter: string) => {
      const start = new Date();
      const end = new Date();

      switch (filter) {
        case 'today':
          start.setHours(0, 0, 0, 0);
          end.setHours(23, 59, 59, 999);
          break;
        case 'yesterday':
          start.setDate(start.getDate() - 1);
          start.setHours(0, 0, 0, 0);
          end.setDate(end.getDate() - 1);
          end.setHours(23, 59, 59, 999);
          break;
        case 'thisWeek': {
          const dayOfWeek = start.getDay();
          const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
          start.setDate(start.getDate() - daysToSubtract);
          start.setHours(0, 0, 0, 0);
          break;
        }
        case 'lastWeek': {
          const lastWeekStart = new Date(start);
          lastWeekStart.setDate(start.getDate() - 7);
          const dayOfLastWeek = lastWeekStart.getDay();
          const daysToSubtractLastWeek = dayOfLastWeek === 0 ? 6 : dayOfLastWeek - 1;
          start.setDate(lastWeekStart.getDate() - daysToSubtractLastWeek);
          start.setHours(0, 0, 0, 0);
          end.setDate(start.getDate() + 6);
          end.setHours(23, 59, 59, 999);
          break;
        }
        case 'thisMonth':
          start.setDate(1);
          start.setHours(0, 0, 0, 0);
          break;
        case 'lastMonth':
          start.setMonth(start.getMonth() - 1);
          start.setDate(1);
          start.setHours(0, 0, 0, 0);
          end.setDate(0);
          end.setHours(23, 59, 59, 999);
          break;
        default:
          return null;
      }

      return { start, end };
    };

    // Filter deliveries based on search and filters
    const filteredDeliveries = computed(() => {
      let filtered = allDeliveries.value;

      // Search filter
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        filtered = filtered.filter(delivery =>
          delivery.waybill_number.toLowerCase().includes(query) ||
          delivery.recipient_name.toLowerCase().includes(query) ||
          delivery.house_number.toLowerCase().includes(query) ||
          delivery.street_name.toLowerCase().includes(query) ||
          delivery.suburb.toLowerCase().includes(query)
        );
      }

      // Date filter
      if (dateFilter.value) {
        const dateRange = getDateRange(dateFilter.value);
        if (dateRange) {
          filtered = filtered.filter(delivery => {
            const deliveryDate = new Date(delivery.completed_at || delivery.addedDate);
            return deliveryDate >= dateRange.start && deliveryDate <= dateRange.end;
          });
        }
      }

      // Status filter
      if (statusFilter.value) {
        filtered = filtered.filter(delivery => 
          (delivery.completion_status || delivery.status).toLowerCase() === statusFilter.value.toLowerCase()
        );
      }

      // Province filter
      if (provinceFilter.value) {
        filtered = filtered.filter(delivery => 
          delivery.province === provinceFilter.value
        );
      }

      return filtered.sort((a, b) => 
        new Date(b.completed_at || b.addedDate).getTime() - 
        new Date(a.completed_at || a.addedDate).getTime()
      );
    });

    // Paginated deliveries
    const paginatedDeliveries = computed(() => {
      const start = (currentPage.value - 1) * itemsPerPage;
      const end = start + itemsPerPage;
      return filteredDeliveries.value.slice(start, end);
    });

    // Total pages
    const totalPages = computed(() => 
      Math.ceil(filteredDeliveries.value.length / itemsPerPage)
    );

    // Statistics
    const totalDeliveries = computed(() => allDeliveries.value.length);
    
    const completedDeliveries = computed(() => 
      allDeliveries.value.filter(d => (d.completion_status || d.status).toLowerCase() === 'delivered')
    );

    const thisMonthDeliveries = computed(() => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return allDeliveries.value.filter(delivery => {
        const deliveryDate = new Date(delivery.completed_at || delivery.addedDate);
        return deliveryDate >= startOfMonth;
      });
    });

    // Available provinces for filter
    const availableProvinces = computed(() => {
      const provinces = new Set(allDeliveries.value.map(d => d.province));
      return Array.from(provinces).sort();
    });

    // Format date
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    };

    // Format time
    const formatTime = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    };

    // Format date and time
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

    // Get status color
    const getStatusColor = (status: string) => {
      switch (status.toLowerCase()) {
        case 'delivered':
          return 'success';
        case 'failed':
          return 'danger';
        case 'wrong_address':
          return 'warning';
        default:
          return 'medium';
      }
    };

    // Search input handler
    const onSearchInput = () => {
      currentPage.value = 1;
    };

    // Apply filters
    const applyFilters = () => {
      activeFilters.value = [];
      
      if (dateFilter.value) {
        activeFilters.value.push({
          key: 'date',
          label: `Date: ${dateFilter.value}`,
          value: dateFilter.value
        });
      }
      
      if (statusFilter.value) {
        activeFilters.value.push({
          key: 'status',
          label: `Status: ${statusFilter.value}`,
          value: statusFilter.value
        });
      }
      
      if (provinceFilter.value) {
        activeFilters.value.push({
          key: 'province',
          label: `Province: ${provinceFilter.value}`,
          value: provinceFilter.value
        });
      }
      
      currentPage.value = 1;
      showFilterModal.value = false;
    };

    // Clear filters
    const clearFilters = () => {
      dateFilter.value = '';
      statusFilter.value = '';
      provinceFilter.value = '';
      activeFilters.value = [];
      currentPage.value = 1;
    };

    // Remove specific filter
    const removeFilter = (key: string) => {
      activeFilters.value = activeFilters.value.filter(f => f.key !== key);
      
      // Update filter values
      if (key === 'date') dateFilter.value = '';
      if (key === 'status') statusFilter.value = '';
      if (key === 'province') provinceFilter.value = '';
      
      currentPage.value = 1;
    };

    // Clear all filters
    const clearAllFilters = () => {
      clearFilters();
    };

    // Change page
    const changePage = (page: number) => {
      currentPage.value = page;
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

    // Fetch completed deliveries from Firebase
    const fetchDeliveries = () => {
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
            allDeliveries.value = deliveries.filter(delivery => 
              delivery.completed_by_email === currentUser.value.email
            );
          } else {
            // For admin/manager, show all completed deliveries
            allDeliveries.value = deliveries;
          }
        } else {
          allDeliveries.value = [];
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
      fetchDeliveries();
    });

    return {
      loading,
      searchQuery,
      showFilterModal,
      isModalOpen,
      selectedDelivery,
      showPhotoViewer,
      selectedPhoto,
      dateFilter,
      statusFilter,
      provinceFilter,
      activeFilters,
      currentPage,
      totalPages,
      filteredDeliveries,
      paginatedDeliveries,
      totalDeliveries,
      completedDeliveries,
      thisMonthDeliveries,
      availableProvinces,
      formatDate,
      formatTime,
      formatDateTime,
      getStatusColor,
      onSearchInput,
      applyFilters,
      clearFilters,
      removeFilter,
      clearAllFilters,
      changePage,
      viewDeliveryDetails,
      closeModal,
      viewPhoto,
      closePhotoViewer,
      filterOutline,
      closeOutline,
      documentTextOutline,
      calendarOutline,
      timeOutline,
      eyeOutline,
      chevronBackOutline,
      chevronForwardOutline
    };
  }
});
</script>

<style scoped>
.delivery-history-container {
  padding: 1rem;
  background-color: #f8f9fa;
  min-height: 100%;
}

.search-section {
  margin-bottom: 1.5rem;
}

.search-bar {
  --background: white;
  --border-radius: 12px;
  --box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  --placeholder-color: #9ca3af;
  --color: #374151;
}

.stats-section {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  margin-bottom: 2rem;
}

.stat-card {
  margin: 0;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  --background: white;
  border: none;
}

.stat-item {
  text-align: center;
  padding: 1rem 0.5rem;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: #3b82f6;
  margin-bottom: 0.25rem;
  line-height: 1;
}

.stat-label {
  font-size: 0.8rem;
  color: #6b7280;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
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

.filter-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  align-items: center;
  padding: 0.75rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.empty-state {
  text-align: center;
  padding: 4rem 1rem;
  color: #6b7280;
  background: white;
  border-radius: 12px;
  margin: 1rem 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.empty-icon {
  font-size: 4rem;
  color: #d1d5db;
  margin-bottom: 1rem;
}

.empty-state h3 {
  margin: 0 0 0.5rem 0;
  color: #374151;
  font-weight: 600;
}

.empty-state p {
  margin: 0;
  font-size: 0.9rem;
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

.delivery-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
}

.waybill-number {
  font-weight: 700;
  color: #1f2937;
  margin: 0;
  font-size: 1.1rem;
  line-height: 1.2;
}

.status-badge {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
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

.delivery-meta {
  display: flex;
  gap: 1rem;
  margin-top: 0.75rem;
  flex-wrap: wrap;
}

.completion-date,
.completion-time {
  display: flex;
  align-items: center;
  color: #6b7280;
  font-size: 0.8rem;
  font-weight: 500;
}

.meta-icon {
  margin-right: 0.4rem;
  font-size: 0.9rem;
  color: #9ca3af;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
  padding: 1.5rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.page-info {
  font-size: 0.9rem;
  color: #6b7280;
  font-weight: 500;
  min-width: 100px;
  text-align: center;
}

.filter-actions {
  margin-top: 2rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* Status colors */
.status-delivered {
  color: #059669;
  font-weight: 600;
}

.status-failed {
  color: #dc2626;
  font-weight: 600;
}

.status-wrong_address {
  color: #d97706;
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
  .delivery-history-container {
    padding: 0.75rem;
  }
  
  .stats-section {
    grid-template-columns: repeat(3, 1fr);
    gap: 0.5rem;
  }
  
  .stat-value {
    font-size: 1.5rem;
  }
  
  .stat-label {
    font-size: 0.7rem;
  }
  
  .delivery-meta {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .delivery-item {
    --padding-start: 0.75rem;
    --padding-end: 0.75rem;
    --padding-top: 0.75rem;
    --padding-bottom: 0.75rem;
  }
  
  .waybill-number {
    font-size: 1rem;
  }
  
  .recipient {
    font-size: 0.9rem;
  }
  
  .address {
    font-size: 0.8rem;
  }
}

@media (max-width: 360px) {
  .stats-section {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
  
  .delivery-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
</style> 