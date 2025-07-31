<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/dashboard"></ion-back-button>
        </ion-buttons>
        <ion-title>Route Planner</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="toggleMinimize" :color="isMinimized ? 'primary' : 'medium'">
            <ion-icon :icon="isMinimized ? chevronDownOutline : chevronUpOutline" slot="icon-only"></ion-icon>
          </ion-button>
          <ion-button @click="addNewStop">
            <ion-icon :icon="addOutline" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="route-planner-container" :class="{ 'minimized': isMinimized }">
        <!-- Map Component - Always visible -->
        <RouteMap class="route-map" :class="{ 'full-screen': isMinimized }" />

        <!-- Route Statistics and Stop List - Hidden when minimized -->
        <div v-if="!isMinimized" class="route-details">
          <RouteStats class="route-stats" />
          <StopList class="stop-list" />
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
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
  IonIcon
} from '@ionic/vue';
import { addOutline, chevronUpOutline, chevronDownOutline } from 'ionicons/icons';
import RouteMap from '@/components/route-planner/RouteMap.vue';
import RouteStats from '@/components/route-planner/RouteStats.vue';
import StopList from '@/components/route-planner/StopList.vue';

export default defineComponent({
  name: 'RoutePlannerPage',
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
    RouteMap,
    RouteStats,
    StopList
  },
  setup() {
    const router = useRouter();
    const isMinimized = ref(false);

    const addNewStop = () => {
      router.push('/route-planner/add-stop');
    };

    const toggleMinimize = () => {
      isMinimized.value = !isMinimized.value;
    };

    return {
      addNewStop,
      toggleMinimize,
      isMinimized,
      addOutline,
      chevronUpOutline,
      chevronDownOutline
    };
  }
});
</script>

<style scoped>
.route-planner-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 1rem;
  transition: all 0.3s ease;
}

.route-planner-container.minimized {
  padding: 0;
}

.route-map {
  flex: 1;
  min-height: 300px;
  margin-bottom: 1rem;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.route-map.full-screen {
  flex: 1;
  min-height: 100vh;
  margin-bottom: 0;
  border-radius: 0;
}

.route-details {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.route-stats {
  margin-bottom: 1rem;
}

.stop-list {
  flex: 1;
  min-height: 200px;
}

/* Animation for smooth transitions */
.route-planner-container.minimized .route-details {
  display: none;
}
</style> 