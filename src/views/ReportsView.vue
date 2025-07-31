<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar class="main-toolbar">
        <ion-buttons slot="start">
          <ion-button @click="goBack" class="back-button">
            <ion-icon :icon="arrowBackOutline" slot="icon-only"></ion-icon>
            <span>Dashboard</span>
          </ion-button>
        </ion-buttons>
        <ion-title>Inventory Reports</ion-title>
      </ion-toolbar>
    </ion-header>
  
    <ion-content class="ion-padding">
      <ion-grid>
        <ion-row>
          <ion-col size="12" size-md="6">
            <ion-card>
              <ion-card-header>
                <ion-card-title>Inventory Summary</ion-card-title>
                <ion-card-subtitle>Overall inventory status</ion-card-subtitle>
              </ion-card-header>
              <ion-card-content>
                <div class="summary-stats">
                  <div class="stat-box">
                    <div class="stat-value">{{ totalItems }}</div>
                    <div class="stat-label">Total Items</div>
                  </div>
                  <div class="stat-box">
                    <div class="stat-value">{{ totalStock }}</div>
                    <div class="stat-label">Total Stock</div>
                  </div>
                  <div class="stat-box">
                    <div class="stat-value">{{ lowStockItems }}</div>
                    <div class="stat-label">Low Stock</div>
                  </div>
                  <div class="stat-box">
                    <div class="stat-value">{{ outOfStockItems }}</div>
                    <div class="stat-label">Out of Stock</div>
                  </div>
                </div>
              </ion-card-content>
            </ion-card>
          </ion-col>
    
          <ion-col size="12" size-md="6">
            <ion-card>
              <ion-card-header>
                <ion-card-title>Stock by Category</ion-card-title>
                <ion-card-subtitle>Inventory distribution</ion-card-subtitle>
              </ion-card-header>
              <ion-card-content>
                <div class="chart-container">
                  <div v-for="(value, category) in categoryDistribution" :key="category" class="category-bar">
                    <div class="category-name">{{ formatCategoryName(category) }}</div>
                    <div class="progress-container">
                      <div 
                        class="progress-bar" 
                        :style="{ width: `${(value / totalItems) * 100}%`, backgroundColor: getCategoryColor(category) }"
                      ></div>
                    </div>
                    <div class="category-count">{{ value }}</div>
                  </div>
                </div>
              </ion-card-content>
            </ion-card>
          </ion-col>
        </ion-row>
    
        <ion-row>
          <ion-col size="12">
            <ion-card>
              <ion-card-header>
                <div class="header-with-actions">
                  <div>
                    <ion-card-title>Low Stock Items</ion-card-title>
                    <ion-card-subtitle>Items that need attention</ion-card-subtitle>
                  </div>
                  <ion-button size="small" @click="exportLowStockReport">
                    <ion-icon :icon="downloadOutline" slot="start"></ion-icon>
                    Export
                  </ion-button>
                </div>
              </ion-card-header>
              <ion-card-content>
                <ion-list>
                  <ion-item v-for="item in lowStockItemsList" :key="item.id">
                    <ion-label>
                      <h2>{{ item.name }}</h2>
                      <p>SKU: {{ item.sku }}</p>
                    </ion-label>
                    <ion-badge :color="item.quantity === 0 ? 'danger' : 'warning'" slot="end">
                      {{ item.quantity === 0 ? 'Out of Stock' : `${item.quantity} left` }}
                    </ion-badge>
                  </ion-item>
                  <ion-item v-if="lowStockItemsList.length === 0">
                    <ion-label>No low stock items found</ion-label>
                  </ion-item>
                </ion-list>
              </ion-card-content>
            </ion-card>
          </ion-col>
        </ion-row>
    
        <ion-row>
          <ion-col size="12">
            <ion-card>
              <ion-card-header>
                <div class="header-with-actions">
                  <div>
                    <ion-card-title>Generate Reports</ion-card-title>
                    <ion-card-subtitle>Custom inventory reports</ion-card-subtitle>
                  </div>
                </div>
              </ion-card-header>
              <ion-card-content>
                <ion-list>
                  <ion-item button @click="generateInventoryReport">
                    <ion-icon :icon="documentTextOutline" slot="start"></ion-icon>
                    <ion-label>Full Inventory Report</ion-label>
                  </ion-item>
                  <ion-item button @click="generateStockValueReport">
                    <ion-icon :icon="cashOutline" slot="start"></ion-icon>
                    <ion-label>Stock Value Report</ion-label>
                  </ion-item>
                  <ion-item button @click="generateMovementReport">
                    <ion-icon :icon="trendingUpOutline" slot="start"></ion-icon>
                    <ion-label>Inventory Movement Report</ion-label>
                  </ion-item>
                  <ion-item button @click="showReportModal = true">
                    <ion-icon :icon="optionsOutline" slot="start"></ion-icon>
                    <ion-label>Custom Report</ion-label>
                  </ion-item>
                </ion-list>
              </ion-card-content>
            </ion-card>
          </ion-col>
        </ion-row>
      </ion-grid>
  
      <!-- Custom Report Modal -->
      <ion-modal :is-open="showReportModal" @didDismiss="showReportModal = false">
        <ion-header>
          <ion-toolbar>
            <ion-title>Custom Report</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="showReportModal = false">
                <ion-icon :icon="closeOutline" slot="icon-only"></ion-icon>
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <form @submit.prevent="generateCustomReport">
            <ion-item>
              <ion-label position="floating">Report Name</ion-label>
              <ion-input v-model="customReport.name" required></ion-input>
            </ion-item>
            
            <ion-item>
              <ion-label>Categories</ion-label>
              <ion-select v-model="customReport.categories" :multiple="true">
                <ion-select-option value="electronics">Electronics</ion-select-option>
                <ion-select-option value="clothing">Clothing</ion-select-option>
                <ion-select-option value="food">Food</ion-select-option>
                <ion-select-option value="office">Office Supplies</ion-select-option>
                <ion-select-option value="other">Other</ion-select-option>
              </ion-select>
            </ion-item>
            
            <ion-item>
              <ion-label>Include</ion-label>
              <ion-select v-model="customReport.include" :multiple="true">
                <ion-select-option value="all">All Items</ion-select-option>
                <ion-select-option value="low">Low Stock Items</ion-select-option>
                <ion-select-option value="out">Out of Stock Items</ion-select-option>
              </ion-select>
            </ion-item>
            
            <ion-button type="submit" expand="block" class="ion-margin-top">
              Generate Report
            </ion-button>
          </form>
        </ion-content>
      </ion-modal>
  
      <!-- Report Generation Toast -->
      <ion-toast
        :is-open="showToast"
        :message="toastMessage"
        :duration="3000"
        @didDismiss="showToast = false"
      ></ion-toast>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  // IonBackButton,
  IonButtons,
  IonButton,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonModal,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonToast,
  IonGrid,
  IonRow,
  IonCol,
} from '@ionic/vue';
import {
  downloadOutline,
  documentTextOutline,
  cashOutline,
  trendingUpOutline,
  optionsOutline,
  closeOutline,
  arrowBackOutline,
} from 'ionicons/icons';
import { useRouter } from 'vue-router';

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  category: string;
}

const showReportModal = ref(false);
const showToast = ref(false);
const toastMessage = ref('');

// Sample inventory data - would come from database in real app
const inventoryItems = ref<InventoryItem[]>([
  { id: '1', name: 'Laptop Dell XPS 13', sku: 'DELL-XPS-13', quantity: 15, category: 'electronics' },
  { id: '2', name: 'Office Chair', sku: 'FURN-CHAIR-01', quantity: 8, category: 'office' },
  { id: '3', name: 'Wireless Mouse', sku: 'ACC-MOUSE-02', quantity: 32, category: 'electronics' },
  { id: '4', name: 'Company T-Shirt (L)', sku: 'APPRL-SHIRT-L', quantity: 2, category: 'clothing' },
  { id: '5', name: 'Notebook', sku: 'STRY-NB-01', quantity: 0, category: 'office' },
  { id: '6', name: 'Desk Lamp', sku: 'FURN-LAMP-01', quantity: 4, category: 'office' },
  { id: '7', name: 'Ballpoint Pens (Box)', sku: 'STRY-PEN-01', quantity: 12, category: 'office' },
  { id: '8', name: 'USB Drive 32GB', sku: 'ELEC-USB-32', quantity: 3, category: 'electronics' },
]);

const customReport = ref({
  name: '',
  categories: ['electronics', 'office', 'clothing', 'food', 'other'],
  include: ['all'],
});

// Computed properties for summary stats
const totalItems = computed(() => inventoryItems.value.length);
const totalStock = computed(() => inventoryItems.value.reduce((sum, item) => sum + item.quantity, 0));
const lowStockItems = computed(() => inventoryItems.value.filter(item => item.quantity > 0 && item.quantity < 5).length);
const outOfStockItems = computed(() => inventoryItems.value.filter(item => item.quantity === 0).length);

// Computed property for category distribution
const categoryDistribution = computed(() => {
  const distribution: Record<string, number> = {};
  
  inventoryItems.value.forEach(item => {
    if (!distribution[item.category]) {
      distribution[item.category] = 0;
    }
    distribution[item.category]++;
  });
  
  return distribution;
});

// Computed property for low stock items list
const lowStockItemsList = computed(() => {
  return inventoryItems.value
    .filter(item => item.quantity < 5)
    .sort((a, b) => a.quantity - b.quantity);
});

const formatCategoryName = (category: string) => {
  return category.charAt(0).toUpperCase() + category.slice(1);
};

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    electronics: '#4c8dff',
    clothing: '#2dd36f',
    food: '#ffc409',
    office: '#eb445a',
    other: '#92949c',
  };
  
  return colors[category] || colors.other;
};

const exportLowStockReport = () => {
  // In a real app, this would generate and download a CSV or PDF
  toastMessage.value = 'Low stock report exported successfully';
  showToast.value = true;
};

const generateInventoryReport = () => {
  toastMessage.value = 'Full inventory report generated successfully';
  showToast.value = true;
};

const generateStockValueReport = () => {
  toastMessage.value = 'Stock value report generated successfully';
  showToast.value = true;
};

const generateMovementReport = () => {
  toastMessage.value = 'Inventory movement report generated successfully';
  showToast.value = true;
};

const generateCustomReport = () => {
  showReportModal.value = false;
  toastMessage.value = `Custom report "${customReport.value.name}" generated successfully`;
  showToast.value = true;
  
  // Reset custom report form
  customReport.value = {
    name: '',
    categories: ['electronics', 'office', 'clothing', 'food', 'other'],
    include: ['all'],
  };
};

const router = useRouter();

const goBack = () => {
  router.push('/dashboard');
};

onMounted(() => {
  // In a real app, you would fetch inventory data from your database here
  console.log('Reports component mounted');
});
</script>

<style scoped>
.summary-stats {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
}

.stat-box {
  flex: 1;
  min-width: 100px;
  padding: 1rem;
  text-align: center;
  background-color: var(--ion-color-light);
  border-radius: 8px;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: var(--ion-color-primary);
}

.stat-label {
  font-size: 0.9rem;
  color: var(--ion-color-medium);
}

.chart-container {
  margin-top: 1rem;
}

.category-bar {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
}

.category-name {
  width: 120px;
  font-size: 0.9rem;
}

.progress-container {
  flex: 1;
  height: 20px;
  background-color: var(--ion-color-light);
  border-radius: 10px;
  overflow: hidden;
  margin: 0 10px;
}

.progress-bar {
  height: 100%;
  border-radius: 10px;
  transition: width 0.3s ease;
}

.category-count {
  width: 30px;
  text-align: right;
  font-size: 0.9rem;
  font-weight: bold;
}

.header-with-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.main-toolbar {
  --background: white;
  --color: #333;
  --border-color: transparent;
  --border-width: 0;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

ion-content {
  --background: #f8f9fa;
}

ion-card {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  margin: 1rem;
}

ion-button {
  --border-radius: 8px;
}

.back-button {
  display: flex;
  align-items: center;
}

.back-button span {
  margin-left: 4px;
}
</style>