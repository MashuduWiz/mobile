<template>
    <div class="map-container">
      <div ref="mapRef" id="google-map" class="map"></div>
      <NavigationOverlay />
      
      <!-- Floating Minimize Button -->
      <div class="floating-minimize" v-if="navigationStore.isNavigating">
        <ion-button fill="clear" @click="navigationStore.toggleMapMinimize" class="minimize-btn">
          <ion-icon :icon="navigationStore.isMapMinimized ? expandOutline : contractOutline"></ion-icon>
        </ion-button>
      </div>
      

      <LoadingSpinner v-if="isLoading" :is-overlay="true" message="Loading map..." />
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted, onUnmounted, watch } from 'vue';
  import { useGoogleMaps } from '../composables/useGoogleMaps.ts';
  import { useMapStore } from '../stores/mapStores';
  import { useNavigationStore } from '../stores/navigationStore';
  import { useNavigation } from '../composables/useNavigation';
  import LoadingSpinner from './common/LoadingSpinner.vue';
  import NavigationOverlay from './navigation/NavigationOverlay.vue';
  import type { MapComponentProps, RouteStop } from '../types/maps';
  import { IonButton, IonIcon } from '@ionic/vue';
  import { expandOutline, contractOutline } from 'ionicons/icons';
  
  const props = withDefaults(defineProps<MapComponentProps>(), {
    center: () => ({ lat: 0, lng: 0 }),
    zoom: 12,
    height: '100%',
    width: '100%'
  });
  
  const mapRef = ref<HTMLElement | null>(null);
  const mapStore = useMapStore();
  const navigationStore = useNavigationStore();
  const mapInstance = ref<google.maps.Map | null>(null);
  const { 
    isLoading, 
    initMap, 
    getCurrentLocation, 
    calculateOptimizedRoute,
    clearMap,
    directionsRenderer
  } = useGoogleMaps();

  const {
    startLocationTracking,
    stopLocationTracking,
    startNavigation,
    setDirectionsRenderer,
    setMapInstance
  } = useNavigation();

  // Expose navigation functions to parent components
  const exposeNavigation = () => {
    return {
      startNavigation,
      stopLocationTracking
    };
  };

  // Make navigation functions available globally
  (window as any).navigationFunctions = exposeNavigation();

  // Calculate route function
  const calculateRouteForStops = async (stops: RouteStop[]) => {
    if (!mapInstance.value) {
      console.error('Map not initialized');
      return;
    }

    if (!stops || stops.length < 1) {
      console.error('Invalid stops array:', stops);
      return;
    }

    try {
      // Get current location
      const currentLocation = mapStore.currentLocation;
      if (!currentLocation) {
        console.error('Current location not available');
        return;
      }

      // Use the new optimized route calculation
      const result = await calculateOptimizedRoute(stops, currentLocation);

      // Update store with route details and optimized order
      if (result.optimizedWaypointOrder && result.optimizedWaypointOrder.length > 0) {
        // Get the optimized stops in the correct order
        const optimizedStops = result.optimizedWaypointOrder.map(index => stops[index]);

        mapStore.setRoute({
          stops: optimizedStops,
          totalDistance: result.totalDistance || '0 km',
          totalDuration: result.totalDuration || '0h 0m'
        });

        // Render the route on the map
        if (directionsRenderer.value) {
          directionsRenderer.value.setDirections(result);
        } else {
          console.error('directionsRenderer not available for route rendering');
        }
      } else {
        // Fallback: use original stops if no optimization
        mapStore.setRoute({
          stops: stops,
          totalDistance: result.totalDistance || '0 km',
          totalDuration: result.totalDuration || '0h 0m'
        });

        // Render the route on the map
        if (directionsRenderer.value) {
          directionsRenderer.value.setDirections(result);
        } else {
          console.error('directionsRenderer not available for fallback route rendering');
        }
      }
    } catch (err) {
      console.error('Failed to calculate route:', err);
    }
  };

  // Initialize map and start location tracking
  onMounted(async () => {
    try {
      if (!mapRef.value) return;

      // Get current location
      const location = await getCurrentLocation();
      console.log('Current location obtained:', location);

      // Initialize map with navigation-optimized settings
      const newMapInstance = await initMap(mapRef.value, {
        center: new google.maps.LatLng(location.lat, location.lng),
        zoom: props.zoom,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
        tilt: 0, // Start flat, will tilt during navigation
        heading: 0, // Start with north up
        gestureHandling: 'cooperative', // Better for mobile navigation
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
          },
          {
            featureType: "transit",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
          }
        ]
      });

      mapInstance.value = newMapInstance;

      // Get the directionsRenderer from the map initialization and pass it to navigation
      if (directionsRenderer.value) {
        setDirectionsRenderer(directionsRenderer.value);
        console.log('DirectionsRenderer passed to navigation system');
      } else {
        console.error('DirectionsRenderer not available from map initialization');
      }

      // Pass the map instance to the navigation system
      setMapInstance(newMapInstance);
      console.log('Map instance passed to navigation system');

      // Start location tracking with enhanced features
      console.log('Starting enhanced location tracking...');
      startLocationTracking(newMapInstance);

      // Update map store with current location
      mapStore.setCurrentLocation(location);

      // Check if there's already a route in the store and calculate it
      if (mapStore.route?.stops && mapStore.route.stops.length >= 2) {
        console.log('Route already exists in store, calculating route on mount:', mapStore.route.stops.map(s => s.waybillNumber));
        await calculateRouteForStops(mapStore.route.stops);
      }

    } catch (error) {
      console.error('Error initializing map:', error);
    }
  });
  
  // Watch for route changes
  watch(() => mapStore.route?.stops, async (newStops, oldStops) => {
    if (!newStops || newStops.length < 2 || !mapInstance.value) return;

    // Only recalculate if the stops have actually changed
    const stopsChanged = !oldStops || 
      oldStops.length !== newStops.length ||
      newStops.some((stop, index) => {
        const oldStop = oldStops[index];
        return !oldStop || 
          stop.lat !== oldStop.lat || 
          stop.lng !== oldStop.lng ||
          stop.address !== oldStop.address;
      });

    if (stopsChanged) {
      await calculateRouteForStops(newStops);
    }
  }, { deep: true });

  // Watch for navigation state changes to maintain navigation view
  watch(() => navigationStore.isNavigating, (isNavigating) => {
    if (isNavigating && mapInstance.value) {
      console.log('Navigation started, ensuring navigation view...');
      // Force navigation view after a short delay
      setTimeout(() => {
        if (navigationStore.isNavigating && mapInstance.value) {
          try {
            mapInstance.value.setZoom(18);
            mapInstance.value.setTilt(45);
            console.log('Navigation view enforced');
          } catch (error) {
            console.error('Error enforcing navigation view:', error);
          }
        }
      }, 1000);
    } else if (!isNavigating && mapInstance.value && mapStore.route) {
      console.log('Navigation stopped, restoring route display...');
      // Restore the route display when navigation stops
      setTimeout(() => {
        if (mapStore.route && directionsRenderer.value) {
          try {
            // Recalculate and display the full route
            calculateRouteForStops(mapStore.route.stops);
            console.log('Route display restored');
          } catch (error) {
            console.error('Error restoring route display:', error);
          }
        }
      }, 500);
    }
  });
  
  // Cleanup
  onUnmounted(() => {
    clearMap();
    stopLocationTracking();
  });


  </script>
  
  <style scoped>
  .map-container {
    position: relative;
    width: v-bind('props.width');
    height: v-bind('props.height');
  }
  
  .map {
    width: 100%;
    height: 100%;
    min-height: 400px;
    border-radius: 8px;
  }



  .floating-minimize {
    position: absolute;
    top: 16px;
    right: 16px;
    z-index: 1;
  }

  .minimize-btn {
    --padding-start: 0;
    --padding-end: 0;
    --padding-top: 0;
    --padding-bottom: 0;
    --background: transparent;
    --background-activated: transparent;
    --background-hover: transparent;
    --background-focused: transparent;
    --background-activated-opacity: 0.1;
    --background-hover-opacity: 0.1;
    --background-focused-opacity: 0.1;
    --border-radius: 50%;
    --border-width: 0;
    --border-style: solid;
    --border-color: transparent;
    --border-activated-color: transparent;
    --border-hover-color: transparent;
    --border-focused-color: transparent;
    --box-shadow: none;
    --ripple-color: transparent;
    --transition: none;
  }
  </style> 