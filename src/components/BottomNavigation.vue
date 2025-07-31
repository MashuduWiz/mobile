<template>
  <ion-footer class="ion-no-border">
    <ion-toolbar class="bottom-nav-toolbar">
      <div class="bottom-nav-container">
        <div 
          v-for="item in navigationItems" 
          :key="item.path"
          class="nav-item"
          :class="{ 
            'active': isActive(item.path),
            'scan-item': item.isScan 
          }"
          @click="navigateTo(item.path)"
        >
          <div class="nav-icon-container" :class="{ 'scan-container': item.isScan }">
            <ion-icon :icon="item.icon" class="nav-icon" :class="{ 'scan-icon': item.isScan }"></ion-icon>
          </div>
          <span class="nav-label" :class="{ 'scan-label': item.isScan }">{{ item.label }}</span>
        </div>
      </div>
    </ion-toolbar>
  </ion-footer>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
  IonFooter,
  IonToolbar,
  IonIcon
} from '@ionic/vue';
import {
  homeOutline,
  timeOutline,
  scanOutline,
  refreshOutline,
  menuOutline
} from 'ionicons/icons';

export default defineComponent({
  name: 'BottomNavigation',
  components: {
    IonFooter,
    IonToolbar,
    IonIcon
  },
  setup() {
    const router = useRouter();
    const route = useRoute();

    const navigationItems = [
      {
        path: '/dashboard',
        icon: homeOutline,
        label: 'Home'
      },
      {
        path: '/delivery-history',
        icon: timeOutline,
        label: 'History'
      },
      {
        path: '/scanner',
        icon: scanOutline,
        label: 'Scan',
        isScan: true
      },
      {
        path: '/recent-deliveries',
        icon: refreshOutline,
        label: 'Recent'
      },
      {
        path: '/menu',
        icon: menuOutline,
        label: 'Menu'
      }
    ];

    const isActive = (path: string) => {
      return route.path === path || route.path.startsWith(path + '/');
    };

    const navigateTo = (path: string) => {
      if (route.path !== path) {
        router.push(path);
      }
    };

    return {
      navigationItems,
      isActive,
      navigateTo
    };
  }
});
</script>

<style scoped>
.bottom-nav-toolbar {
  --background: white;
  --border-color: #e0e0e0;
  --border-width: 1px 0 0 0;
  padding: 12px 0 8px 0;
  height: 85px;
  /* Ensure proper safe area support */
  padding-bottom: env(safe-area-inset-bottom);
  padding-bottom: constant(safe-area-inset-bottom);
}

.bottom-nav-container {
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: 100%;
  max-width: 100%;
  padding: 0 16px;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 4px 8px;
  border-radius: 8px;
  min-height: 65px;
  position: relative;
}

.nav-item:active {
  transform: scale(0.95);
}

.nav-icon-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  transition: all 0.2s ease;
  margin-bottom: 6px;
}

.nav-item.active .nav-icon-container {
  background: #007AFF;
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
}

.nav-icon {
  font-size: 20px;
  color: #666;
  transition: color 0.2s ease;
}

.nav-item.active .nav-icon {
  color: white;
}

.nav-label {
  font-size: 11px;
  font-weight: 500;
  color: #666;
  text-align: center;
  transition: color 0.2s ease;
  line-height: 1.2;
  margin-top: 0;
  display: block;
  white-space: nowrap;
}

.nav-item.active .nav-label {
  color: #007AFF;
  font-weight: 600;
}

/* Scan button special styling */
.scan-item {
  /* Keep scan button at same height as others */
  align-items: center;
  justify-content: center;
}

.scan-container {
  width: 48px !important;
  height: 48px !important;
  background: linear-gradient(135deg, #FF4B2B 0%, #FF416C 100%);
  box-shadow: 0 4px 16px rgba(255, 75, 43, 0.4);
  border: 3px solid white;
  margin-bottom: 6px;
  /* Center the larger button properly */
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.scan-icon {
  font-size: 22px !important;
  color: white !important;
}

.scan-label {
  color: #FF4B2B !important;
  font-weight: 600 !important;
  font-size: 12px !important;
  margin-top: 4px !important;
  display: block !important;
  white-space: nowrap !important;
}

.scan-item:active {
  transform: scale(0.95);
}

.scan-item:active .scan-container {
  box-shadow: 0 2px 8px rgba(255, 75, 43, 0.3);
}

/* Tablet and larger screens */
@media (min-width: 768px) {
  .nav-label {
    font-size: 12px;
  }
  
  .nav-icon {
    font-size: 22px;
  }
  
  .nav-icon-container {
    width: 44px;
    height: 44px;
  }
}
</style> 