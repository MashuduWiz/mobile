import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import { setupAuthGuard } from '../services/auth';

const routes: Array<RouteRecordRaw> = [
  {
    path: '',
    redirect: '/login'
  },
  {
    path: '/login',
    component: () => import('../views/LoginView.vue')
  },
  {
    path: '/dashboard',
    component: () => import('../views/DashboardView.vue')
  },
  {
    path: '/forgot-password',
    component: () => import('../views/ForgotPasswordView.vue')
  },
  {
    path: '/folder/:id',
    component: () => import('../views/FolderPage.vue')
  },
  // Inventory management routes
  {
    path: '/inventory',
    component: () => import('../views/InventoryView.vue')
  },
  // Add reports route
  {
    path: '/reports',
    component: () => import('../views/ReportsView.vue')
  },
  // Add users management route
  {
    path: '/users',
    component: () => import('../views/UsersView.vue')
  },

  // Add delivery list route
  {
    path: '/delivery-list',
    name: 'delivery-list',
    component: () => import('../views/DeliveryListView.vue')
  },
  // Add delivery completion route
  {
    path: '/delivery-completion/:deliveryId/:waybillNumber',
    name: 'delivery-completion',
    component: () => import('../views/DeliveryCompletion.vue')
  },
  // Add recent deliveries route
  {
    path: '/recent-deliveries',
    name: 'recent-deliveries',
    component: () => import('../views/RecentDeliveriesView.vue')
  },
  // Add delivery history route
  {
    path: '/delivery-history',
    name: 'delivery-history',
    component: () => import('../views/DeliveryHistoryView.vue')
  },
  // Add barcode scanner route
  {
    path: '/barcode-scanner',
    name: 'barcode-scanner',
    component: () => import('../views/BarcodeScanner.vue')
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// Add navigation debugging
router.beforeEach((to, from, next) => {
  console.log(`Router navigation: ${from.path} → ${to.path}`);
  next();
});

// Set up authentication guard
setupAuthGuard(router);

export default router