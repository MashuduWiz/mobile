<template>
  <div class="route-stats-container">
    <ion-grid>
      <ion-row>
        <ion-col size="6">
          <div class="stat-card">
            <ion-icon :icon="timeOutline" color="primary"></ion-icon>
            <div class="stat-content">
              <h3>Total Time</h3>
              <p>{{ totalTime }}</p>
            </div>
          </div>
        </ion-col>
        <ion-col size="6">
          <div class="stat-card">
            <ion-icon :icon="speedometerOutline" color="primary"></ion-icon>
            <div class="stat-content">
              <h3>Total Distance</h3>
              <p>{{ totalDistance }}</p>
            </div>
          </div>
        </ion-col>
      </ion-row>
      <ion-row>
        <ion-col size="6">
          <div class="stat-card">
            <ion-icon :icon="locationOutline" color="primary"></ion-icon>
            <div class="stat-content">
              <h3>Total Stops</h3>
              <p>{{ totalStops }}</p>
            </div>
          </div>
        </ion-col>
        <ion-col size="6">
          <div class="stat-card">
            <ion-icon :icon="carOutline" color="primary"></ion-icon>
            <div class="stat-content">
              <h3>Fuel Cost</h3>
              <p>{{ fuelCost }}</p>
            </div>
          </div>
        </ion-col>
      </ion-row>
    </ion-grid>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import { useMapStore } from '../../stores/mapStores';
import {
  IonGrid,
  IonRow,
  IonCol,
  IonIcon
} from '@ionic/vue';
import {
  timeOutline,
  speedometerOutline,
  locationOutline,
  carOutline
} from 'ionicons/icons';

export default defineComponent({
  name: 'RouteStats',
  components: {
    IonGrid,
    IonRow,
    IonCol,
    IonIcon
  },
  setup() {
    const mapStore = useMapStore();

    const totalTime = computed(() => {
      return mapStore.route?.totalDuration || '0h 0m';
    });

    const totalDistance = computed(() => {
      return mapStore.route?.totalDistance || '0 km';
    });

    const totalStops = computed(() => {
      return mapStore.route?.stops.length || 0;
    });

    const fuelCost = computed(() => {
      const distance = parseFloat(totalDistance.value);
      if (isNaN(distance)) return 'R0.00';
      const cost = (distance / 10) * 25; // R25 per 10km (adjusted for South African fuel prices)
      return `R${cost.toFixed(2)}`;
    });

    return {
      totalTime,
      totalDistance,
      totalStops,
      fuelCost,
      timeOutline,
      speedometerOutline,
      locationOutline,
      carOutline
    };
  }
});
</script>

<style scoped>
.route-stats-container {
  background-color: transparent;
  border-radius: 8px;
  padding: 0.5rem 0;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  background-color: #f8f9fa;
  border-radius: 8px;
  height: 100%;
  margin-bottom: 0.5rem;
}

.stat-content {
  margin-left: 0.75rem;
}

.stat-content h3 {
  margin: 0;
  font-size: 0.8rem;
  color: #666;
  font-weight: 500;
}

.stat-content p {
  margin: 0.25rem 0 0;
  font-size: 1rem;
  font-weight: 600;
  color: #333;
}

ion-icon {
  font-size: 1.25rem;
  color: #FF4B2B;
}

/* Make the grid more compact */
ion-grid {
  padding: 0;
}

ion-col {
  padding: 0.25rem;
}
</style> 