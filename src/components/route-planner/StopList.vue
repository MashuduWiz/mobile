<template>
  <div class="stop-list-container">
    <ion-list>
      <ion-item v-for="(stop, index) in stops" :key="index" @click="viewStopDetails(stop)">
        <ion-label>
          <h2>{{ stop.name || `Stop ${index + 1}` }}</h2>
          <p>{{ stop.address }}</p>
          <p v-if="stop.waybillNumber">Waybill: {{ stop.waybillNumber }}</p>
        </ion-label>
        <ion-badge slot="end" color="primary">{{ index + 1 }}</ion-badge>
      </ion-item>
    </ion-list>

    <div v-if="stops.length === 0" class="empty-state">
      <ion-icon :icon="locationOutline" size="large"></ion-icon>
      <p>No stops added yet</p>
      <ion-button @click="addNewStop">Add First Stop</ion-button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useMapStore } from '../../stores/mapStores';
import {
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonIcon,
  IonButton
} from '@ionic/vue';
import { locationOutline } from 'ionicons/icons';
import type { RouteStop } from '../../types/maps';

export default defineComponent({
  name: 'StopList',
  components: {
    IonList,
    IonItem,
    IonLabel,
    IonBadge,
    IonIcon,
    IonButton
  },
  setup() {
    const router = useRouter();
    const mapStore = useMapStore();
    const stops = ref<RouteStop[]>([]);

    watch(() => mapStore.route, (newRoute) => {
      if (newRoute) {
        stops.value = newRoute.stops;
      } else {
        stops.value = [];
      }
    }, { immediate: true });

    const viewStopDetails = (stop: RouteStop) => {
      mapStore.setSelectedStop(stop);
      router.push(`/route-planner/stop/${stop.waybillNumber}`);
    };

    const addNewStop = () => {
      router.push('/route-planner/add-stop');
    };

    return {
      stops,
      viewStopDetails,
      addNewStop,
      locationOutline
    };
  }
});
</script>

<style scoped>
.stop-list-container {
  height: auto;
  max-height: 200px;
  background-color: transparent;
  border-radius: 8px;
  overflow-y: auto;
  margin-top: 0.5rem;
}

.stop-list-container ion-list {
  background: transparent;
  padding: 0;
}

.stop-list-container ion-list::part(list) {
  background: transparent;
}

.stop-list-container ion-item {
  --background: #f8f9fa;
  --border-color: #e9ecef;
  margin-bottom: 0.5rem;
  border-radius: 8px;
  --padding-start: 0.75rem;
  --padding-end: 0.75rem;
  --padding-top: 0.5rem;
  --padding-bottom: 0.5rem;
}

.stop-list-container ion-item h2 {
  font-size: 0.9rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.25rem;
}

.stop-list-container ion-item p {
  font-size: 0.8rem;
  color: #666;
  margin: 0.1rem 0;
}

.stop-list-container ion-badge {
  font-size: 0.8rem;
  --background: #FF4B2B;
  --color: white;
}

.empty-state {
  height: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  color: #666;
}

.empty-state p {
  margin: 0.5rem 0;
  font-size: 0.9rem;
}

.empty-state ion-button {
  --background: #FF4B2B;
  --color: white;
  --border-radius: 8px;
  --padding-start: 1rem;
  --padding-end: 1rem;
  --padding-top: 0.5rem;
  --padding-bottom: 0.5rem;
  font-size: 0.8rem;
}
</style> 