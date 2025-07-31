<template>
  <div class="map-container">
    <MapComponent
      :center="mapCenter"
      :zoom="12"
      :markers="stops"
      :height="'100%'"
      :width="'100%'"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch } from 'vue';
import { useMapStore } from '../../stores/mapStores';
import MapComponent from '../MapComponets.vue';
import type { RouteStop } from '../../types/maps';

export default defineComponent({
  name: 'RouteMap',
  components: {
    MapComponent
  },
  setup() {
    const mapStore = useMapStore();
    const stops = ref<RouteStop[]>([]);

    const mapCenter = computed(() => {
      return mapStore.currentLocation || { lat: 0, lng: 0 };
    });

    watch(() => mapStore.route, (newRoute) => {
      if (newRoute) {
        stops.value = newRoute.stops;
      } else {
        stops.value = [];
      }
    }, { immediate: true });

    return {
      stops,
      mapCenter
    };
  }
});
</script>

<style scoped>
.map-container {
  width: 100%;
  height: 100%;
  background-color: #f5f5f5;
  border-radius: 8px;
  overflow: hidden;
}
</style> 