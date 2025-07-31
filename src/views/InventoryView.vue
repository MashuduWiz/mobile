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
          <ion-title>Inventory Management</ion-title>
        </ion-toolbar>
      </ion-header>
  
      <ion-content class="ion-padding">
        <ion-grid>
          <ion-row>
            <ion-col size="12">
              <ion-card>
                <ion-card-header>
                  <ion-card-title>Inventory Items</ion-card-title>
                  <ion-card-subtitle>Manage your checklist inventory</ion-card-subtitle>
                </ion-card-header>
                <ion-card-content>
                  <div class="search-filter-container">
                    <ion-searchbar
                      v-model="searchQuery"
                      placeholder="Search items..."
                      @ionChange="filterItems"
                    ></ion-searchbar>
                    <ion-button @click="showAddItemModal = true">
                      <ion-icon :icon="addOutline" slot="start"></ion-icon>
                      Add Item
                    </ion-button>
                  </div>
  
                  <div v-if="loading" class="loading-container">
                    <ion-spinner name="crescent"></ion-spinner>
                    <p>Loading inventory...</p>
                  </div>
  
                  <ion-list v-else>
                    <ion-item v-if="filteredItems.length === 0">
                      <ion-label>No items found</ion-label>
                    </ion-item>
                    <ion-item v-for="item in filteredItems" :key="item.id">
                      <ion-label>
                        <h2>{{ item.name }}</h2>
                        <p>SKU: {{ item.sku }}</p>

                        <p>Quantity: {{ item.stock || item.quantity || 0 }}</p>
                        <p v-if="item.waybillNumber">Waybill: {{ item.waybillNumber }}</p>
                      </ion-label>
                      <ion-badge slot="end" :color="getStockStatusColor(item.stock || item.quantity || 0)">
                        {{ getStockStatus(item.stock || item.quantity || 0) }}
                      </ion-badge>
                      <ion-buttons slot="end">
                        <ion-button @click="editItem(item)">
                          <ion-icon :icon="createOutline" slot="icon-only"></ion-icon>
                        </ion-button>
                        <ion-button @click="confirmDelete(item.id)">
                          <ion-icon :icon="trashOutline" slot="icon-only"></ion-icon>
                        </ion-button>
                      </ion-buttons>
                    </ion-item>
                  </ion-list>
                </ion-card-content>
              </ion-card>
            </ion-col>
          </ion-row>
        </ion-grid>
  
        <!-- Add Item Modal -->
        <ion-modal :is-open="showAddItemModal" @didDismiss="showAddItemModal = false">
          <ion-header>
            <ion-toolbar>
              <ion-title>{{ isEditing ? 'Edit Item' : 'Add New Item' }}</ion-title>
              <ion-buttons slot="end">
                <ion-button @click="showAddItemModal = false">
                  <ion-icon :icon="closeOutline" slot="icon-only"></ion-icon>
                </ion-button>
              </ion-buttons>
            </ion-toolbar>
          </ion-header>
          <ion-content class="ion-padding">
            <div v-if="loading" class="loading-container">
              <ion-spinner name="crescent"></ion-spinner>
              <p>Saving...</p>
            </div>
            
            <form @submit.prevent="saveItem" v-else>
              <ion-item>
                <ion-label position="floating">Item Name</ion-label>
                <ion-input v-model="newItem.name" required></ion-input>
              </ion-item>
              <ion-item>
                <ion-label position="floating">SKU</ion-label>
                <ion-input v-model="newItem.sku" required></ion-input>
              </ion-item>

              <ion-item>
                <ion-label position="floating">Quantity</ion-label>
                <ion-input
                  v-model="newItem.quantity"
                  type="number"
                  min="0"
                  required
                ></ion-input>
              </ion-item>
              <ion-item>
                <ion-label position="floating">Category</ion-label>
                <ion-select v-model="newItem.category">
                  <ion-select-option value="electronics">Electronics</ion-select-option>
                  <ion-select-option value="clothing">Clothing</ion-select-option>
                  <ion-select-option value="food">Food</ion-select-option>
                  <ion-select-option value="office">Office Supplies</ion-select-option>
                  <ion-select-option value="other">Other</ion-select-option>
                </ion-select>
              </ion-item>
              <ion-button type="submit" expand="block" class="ion-margin-top">
                {{ isEditing ? 'Update Item' : 'Add Item' }}
              </ion-button>
            </form>
          </ion-content>
        </ion-modal>
  
        <!-- Delete Confirmation Alert -->
        <ion-alert
          :is-open="showDeleteAlert"
          header="Confirm Delete"
          message="Are you sure you want to delete this item?"
          :buttons="[
            {
              text: 'Cancel',
              role: 'cancel',
              handler: () => {
                showDeleteAlert = false;
              },
            },
            {
              text: 'Delete',
              handler: () => {
                deleteItem();
              },
            },
          ]"
        ></ion-alert>
      </ion-content>
      
      <!-- Bottom Navigation -->
      <BottomNavigation />
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
    IonSearchbar,
    IonBadge,
    IonModal,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonAlert,
    IonGrid,
    IonRow,
    IonCol,
    toastController,
    IonSpinner
  } from '@ionic/vue';
  import {
    addOutline,
    closeOutline,
    createOutline,
    trashOutline,
    arrowBackOutline,
  } from 'ionicons/icons';
  import { db } from '../firebase/config';
  import { ref as dbRef, get, set, push, update, remove } from 'firebase/database';
  import { useRouter } from 'vue-router';
  import BottomNavigation from '@/components/BottomNavigation.vue';
  
  interface InventoryItem {
    id: string;
    name: string;
    sku: string;
    quantity?: number;
    stock?: number;
    category: string;
    waybillNumber?: string;
    addedOn?: string;
    lastUpdated?: string;
  }
  
  const searchQuery = ref('');
  const showAddItemModal = ref(false);
  const showDeleteAlert = ref(false);
  const isEditing = ref(false);
  const selectedItemId = ref('');
  const loading = ref(false);
  
  // Initialize with empty array, will load from Firebase
  const inventoryItems = ref<InventoryItem[]>([]);
  
  const newItem = ref<Omit<InventoryItem, 'id'>>({
    name: '',
    sku: '',
    quantity: 0,
    category: 'other',
  });
  
  // Get current date in YYYY-MM-DD format
  const getCurrentDate = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  };
  
  // Load inventory data from Firebase checklist table
  const loadInventoryData = async () => {
    loading.value = true;
    try {
      const checklistRef = dbRef(db, 'checklist');
      const snapshot = await get(checklistRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        // Convert Firebase object to array with ID included
        inventoryItems.value = Object.keys(data).map(key => ({
          id: key,
          ...data[key],
          // Handle both quantity and stock fields for compatibility
          quantity: data[key].stock || data[key].quantity || 0
        }));
        console.log('Loaded inventory items:', inventoryItems.value);
      } else {
        console.log('No checklist data available');
        inventoryItems.value = [];
      }
    } catch (error) {
      console.error('Error loading inventory data:', error);
      showToast('Error loading inventory data');
    } finally {
      loading.value = false;
    }
  };
  
  const filteredItems = computed(() => {
    if (!searchQuery.value) {
      return inventoryItems.value;
    }
    const query = searchQuery.value.toLowerCase();
    return inventoryItems.value.filter(
      (item) =>
        item.name?.toLowerCase().includes(query) ||
        item.sku?.toLowerCase().includes(query) ||
        item.category?.toLowerCase().includes(query) ||

        item.waybillNumber?.toLowerCase().includes(query)
    );
  });
  
  const getStockStatus = (quantity: number | undefined) => {
    const stock = quantity || 0;
    if (stock <= 0) return 'Out of Stock';
    if (stock < 5) return 'Low Stock';
    return 'In Stock';
  };
  
  const getStockStatusColor = (quantity: number | undefined) => {
    const stock = quantity || 0;
    if (stock <= 0) return 'danger';
    if (stock < 5) return 'warning';
    return 'success';
  };
  
  const filterItems = () => {
    // Already handled by computed property
    console.log('Filtering with:', searchQuery.value);
  };
  
  const editItem = (item: InventoryItem) => {
    isEditing.value = true;
    selectedItemId.value = item.id;
    newItem.value = {
      name: item.name,
      sku: item.sku,
      quantity: item.stock || item.quantity || 0,
      category: item.category || 'other',
    };
    showAddItemModal.value = true;
  };
  
  const saveItem = async () => {
    loading.value = true;
    try {
      if (isEditing.value) {
        // Update existing item in Firebase
        const itemRef = dbRef(db, `checklist/${selectedItemId.value}`);
        
        await update(itemRef, {
          name: newItem.value.name,
          sku: newItem.value.sku,
          stock: newItem.value.quantity,
          category: newItem.value.category,
          lastUpdated: getCurrentDate()
        });
        
        showToast('Item updated successfully');
      } else {
        // Add new item to Firebase
        const newItemRef = push(dbRef(db, 'checklist'));
        
        const itemData = {
          name: newItem.value.name,
          sku: newItem.value.sku,
          stock: newItem.value.quantity,
          category: newItem.value.category,
          addedOn: getCurrentDate(),
          waybillNumber: `WB-${getCurrentDate()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`
        };
        
        await set(newItemRef, itemData);
        showToast('New item added successfully');
      }
      
      // Reload inventory data
      await loadInventoryData();
      
      // Reset form
      resetForm();
    } catch (error) {
      console.error('Error saving item:', error);
      showToast('Error saving item');
    } finally {
      loading.value = false;
    }
  };
  
  const confirmDelete = (id: string) => {
    selectedItemId.value = id;
    showDeleteAlert.value = true;
  };
  
  const deleteItem = async () => {
    loading.value = true;
    try {
      // Delete item from Firebase
      const itemRef = dbRef(db, `checklist/${selectedItemId.value}`);
      await remove(itemRef);
      
      showToast('Item deleted successfully');
      showDeleteAlert.value = false;
      
      // Reload inventory data
      await loadInventoryData();
    } catch (error) {
      console.error('Error deleting item:', error);
      showToast('Error deleting item');
    } finally {
      loading.value = false;
    }
  };
  
  const resetForm = () => {
    newItem.value = {
      name: '',
      sku: '',
      quantity: 0,
      category: 'other',
    };
    isEditing.value = false;
    selectedItemId.value = '';
    showAddItemModal.value = false;
  };
  
  // Show toast message
  const showToast = async (message: string) => {
    const toast = await toastController.create({
      message,
      duration: 2000,
      position: 'bottom'
    });
    await toast.present();
  };
  
  const router = useRouter();
  
  const goBack = () => {
    router.push('/dashboard');
  };
  
  onMounted(async () => {
    // Fetch inventory data from Firebase
    await loadInventoryData();
  });
  </script>
  
  <style scoped>
  .search-filter-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }
  
  ion-searchbar {
    padding: 0;
    flex: 1;
    margin-right: 1rem;
  }
  
  .loading-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 2rem;
    text-align: center;
  }
  
  .loading-container ion-spinner {
    margin-bottom: 1rem;
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