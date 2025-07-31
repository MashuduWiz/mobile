import { ref, computed, onUnmounted } from 'vue';
import { useNavigationStore } from '../stores/navigationStore';
import { useMapStore } from '../stores/mapStores';
import type { RouteStop } from '../types/maps';

export function useNavigation() {
  const navigationStore = useNavigationStore();
  const mapStore = useMapStore();

  // Navigation state
  const currentPosition = ref<google.maps.Marker | null>(null);
  const directionsRenderer = ref<google.maps.DirectionsRenderer | null>(null);
  const mapInstance = ref<google.maps.Map | null>(null);
  const directionsService = new google.maps.DirectionsService();
  const watchId = ref<number | null>(null);
  const currentStopIndex = ref(0);
  const currentRoute = ref<google.maps.DirectionsRoute | null>(null);
  const currentLeg = ref<google.maps.DirectionsLeg | null>(null);
  const currentStep = ref<google.maps.DirectionsStep | null>(null);
  const lastKnownPosition = ref<google.maps.LatLng | null>(null);
  const lastKnownHeading = ref<number | null>(null);
  const isOffRoute = ref(false);
  const arrivalRadius = 50; // meters
  const offRouteThreshold = 100; // meters
  const navigationMode = ref<'overview' | 'navigation'>('overview');

  // Speech synthesis for voice guidance
  const speechSynthesis = window.speechSynthesis;

  // Function to set the directions renderer from the map
  const setDirectionsRenderer = (renderer: google.maps.DirectionsRenderer) => {
    directionsRenderer.value = renderer;
  };

  // Function to set the map instance
  const setMapInstance = (map: google.maps.Map) => {
    console.log('Setting map instance in navigation system');
    mapInstance.value = map;
  };

  const speakInstruction = (text: string) => {
    if (navigationStore.voiceEnabled && 'speechSynthesis' in window) {
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      speechSynthesis.speak(utterance);
    }
  };

  // Calculate bearing between two points
  const calculateBearing = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) -
              Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

    return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
  };

  // Check if user is off route
  const checkIfOffRoute = (currentLatLng: google.maps.LatLng, route: google.maps.DirectionsRoute): boolean => {
    if (!route.legs || route.legs.length === 0) return false;

    let minDistance = Infinity;
    
    // Check distance to all route segments
    for (const leg of route.legs) {
      for (const step of leg.steps) {
        const path = step.path || [];
        for (let i = 0; i < path.length - 1; i++) {
          const distance = google.maps.geometry.spherical.computeDistanceBetween(
            currentLatLng,
            path[i]
          );
          minDistance = Math.min(minDistance, distance);
        }
      }
    }

    return minDistance > offRouteThreshold;
  };

  // Update route polyline to hide passed route
  const updateRoutePolyline = (currentLatLng: google.maps.LatLng) => {
    if (!currentRoute.value || !currentLeg.value || !directionsRenderer.value || !mapInstance.value) return;

    try {
      // Find the current step in the route
      let currentStepIndex = -1;
      let minDistance = Infinity;

      for (let i = 0; i < currentLeg.value.steps.length; i++) {
        const step = currentLeg.value.steps[i];
        const path = step.path || [];
        
        for (let j = 0; j < path.length; j++) {
          const distance = google.maps.geometry.spherical.computeDistanceBetween(
            currentLatLng,
            path[j]
          );
          if (distance < minDistance) {
            minDistance = distance;
            currentStepIndex = i;
          }
        }
      }

      // Only update if we're close to the route (within 50 meters)
      if (currentStepIndex >= 0 && minDistance < 50) {
        const remainingSteps = currentLeg.value.steps.slice(currentStepIndex);
        const remainingPath: google.maps.LatLng[] = [];
        
        // Add current position to the start
        remainingPath.push(currentLatLng);
        
        // Add all remaining path points
        remainingSteps.forEach(step => {
          const path = step.path || [];
          remainingPath.push(...path);
        });

        // Create a custom polyline for the remaining route
        if (remainingPath.length > 1) {
          // Remove existing polyline if it exists
          if ((directionsRenderer.value as any).customPolyline) {
            (directionsRenderer.value as any).customPolyline.setMap(null);
          }

          // Create new polyline for remaining route
          const polyline = new google.maps.Polyline({
            path: remainingPath,
            strokeColor: '#4285F4',
            strokeWeight: 6,
            strokeOpacity: 0.8,
            zIndex: 1,
            map: mapInstance.value
          });

          // Store reference to custom polyline
          (directionsRenderer.value as any).customPolyline = polyline;
        }
      }
    } catch (error) {
      console.error('Error updating route polyline:', error);
    }
  };

  // Update navigation information
  const updateNavigationInfo = (currentLatLng: google.maps.LatLng) => {
    if (!currentRoute.value || !currentLeg.value) return;

    let nextManeuver = '';
    let distanceToNextTurn = 0;
    let estimatedTimeToArrival = 0;
    let currentSpeed = 0;
    let foundCurrentStep = false;
    const upcomingTurns: Array<{ instruction: string; distance: string; maneuver: string }> = [];

    // Calculate current speed if we have previous position
    if (lastKnownPosition.value) {
      const distance = google.maps.geometry.spherical.computeDistanceBetween(
        lastKnownPosition.value,
        currentLatLng
      );
      const timeDiff = 1000; // Assuming 1 second between updates
      currentSpeed = (distance / timeDiff) * 3.6; // Convert to km/h
    }

    // Find current step and next maneuver
    for (let i = 0; i < currentLeg.value.steps.length; i++) {
      const step = currentLeg.value.steps[i];
      const path = step.path || [];
      
      for (let j = 0; j < path.length - 1; j++) {
        const distanceToStep = google.maps.geometry.spherical.computeDistanceBetween(
          currentLatLng,
          path[j]
        );

        if (!foundCurrentStep && distanceToStep < 100) {
          currentStep.value = step;
          nextManeuver = step.instructions;
          foundCurrentStep = true;
          
          // Calculate distance to next turn
          let totalDistance = 0;
          for (let k = j; k < path.length - 1; k++) {
            totalDistance += google.maps.geometry.spherical.computeDistanceBetween(
              path[k],
              path[k + 1]
            );
          }
          distanceToNextTurn = totalDistance;

          // Get upcoming turns (next 3 steps)
          for (let k = i + 1; k < Math.min(i + 4, currentLeg.value.steps.length); k++) {
            const upcomingStep = currentLeg.value.steps[k];
            upcomingTurns.push({
              instruction: upcomingStep.instructions,
              distance: upcomingStep.distance?.text || '',
              maneuver: upcomingStep.maneuver || 'straight'
            });
          }
        }
      }
    }

    // Calculate ETA
    if (currentSpeed > 0) {
      estimatedTimeToArrival = (distanceToNextTurn / 1000) / currentSpeed * 60; // minutes
    }

    // Check if off route
    const offRoute = checkIfOffRoute(currentLatLng, currentRoute.value);
    if (offRoute && !isOffRoute.value) {
      isOffRoute.value = true;
      speakInstruction('You are off route. Recalculating...');
    } else if (!offRoute && isOffRoute.value) {
      isOffRoute.value = false;
    }

    // Update store
    navigationStore.updateNavigationInfo({
      nextManeuver,
      distanceToNextTurn: distanceToNextTurn > 0 ? `${Math.round(distanceToNextTurn)} m` : 'Arriving',
      estimatedTimeToArrival: estimatedTimeToArrival > 0 ? `${Math.round(estimatedTimeToArrival)} mins` : '',
      currentSpeed,
      isOffRoute: offRoute,
      upcomingTurns
    });

    // Update last known position
    lastKnownPosition.value = currentLatLng;
  };

  // Force navigation view
  const forceNavigationView = () => {
    if (!mapInstance.value || !navigationStore.isNavigating) return;
    
    try {
      console.log('Forcing navigation view...');
      mapInstance.value.setZoom(18);
      mapInstance.value.setTilt(45);
      if (lastKnownHeading.value !== null) {
        mapInstance.value.setHeading(lastKnownHeading.value);
      }
      console.log('Navigation view forced successfully');
    } catch (error) {
      console.error('Error forcing navigation view:', error);
    }
  };

  // Watch for navigation state changes to maintain view
  const watchNavigationState = () => {
    if (navigationStore.isNavigating && navigationMode.value === 'navigation') {
      // Force navigation view every few seconds to ensure it persists
      const interval = setInterval(() => {
        if (navigationStore.isNavigating && navigationMode.value === 'navigation') {
          forceNavigationView();
        } else {
          clearInterval(interval);
        }
      }, 2000);
      
      return interval;
    }
  };

  // Start location tracking with heading
  const startLocationTracking = (map: google.maps.Map) => {
    if (!navigator.geolocation) {
      navigationStore.setNavigationError('Geolocation not supported');
      return;
    }

    // Mobile-optimized location options
    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 15000, // Increased timeout for mobile
      maximumAge: 1000 // Allow slightly older positions for better performance
    };

    watchId.value = navigator.geolocation.watchPosition(
      (position) => {
        const latLng = new google.maps.LatLng(
          position.coords.latitude,
          position.coords.longitude
        );

        // Calculate heading if we have previous position
        if (lastKnownPosition.value) {
          const bearing = calculateBearing(
            lastKnownPosition.value.lat(),
            lastKnownPosition.value.lng(),
            latLng.lat(),
            latLng.lng()
          );
          lastKnownHeading.value = bearing;
        }

        // Create or update position marker with heading
        if (!currentPosition.value) {
          currentPosition.value = new google.maps.Marker({
            position: latLng,
            map: map,
            icon: {
              path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
              scale: 6,
              fillColor: '#4285F4',
              fillOpacity: 1,
              strokeColor: '#FFFFFF',
              strokeWeight: 2
            },
            title: 'Your Location'
          });
        } else {
          currentPosition.value.setPosition(latLng);
          // Note: Marker rotation is handled by the map heading instead
        }

        // Update navigation info if navigating
        if (navigationStore.isNavigating) {
          updateNavigationInfo(latLng);
          updateRoutePolyline(latLng);
          checkArrivalAtCurrentStop(latLng);
        }

        // Update store with current speed
        if (lastKnownPosition.value) {
          const distance = google.maps.geometry.spherical.computeDistanceBetween(
            lastKnownPosition.value,
            latLng
          );
          const speed = (distance / 1000) * 3.6; // km/h
          navigationStore.updateNavigationInfo({ currentSpeed: speed });
        }

        lastKnownPosition.value = latLng;
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMessage = 'Location error: ';
        
        // Mobile-specific error messages
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Location permission denied. Please enable location access in your device settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information unavailable. Please check your GPS settings.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out. Please try again.';
            break;
          default:
            errorMessage += error.message;
        }
        
        navigationStore.setNavigationError(errorMessage);
      },
      options
    );
  };

  // Check arrival at current stop
  const checkArrivalAtCurrentStop = (currentLatLng: google.maps.LatLng) => {
    if (!currentLeg.value) return;

    const destination = currentLeg.value.end_location;
    const distance = google.maps.geometry.spherical.computeDistanceBetween(
      currentLatLng,
      destination
    );

    if (distance <= arrivalRadius) {
      handleArrivalAtStop();
    }
  };

  // Handle arrival at stop
  const handleArrivalAtStop = async () => {
    if (!currentRoute.value) return;

    const legs = currentRoute.value.legs;
    
    // Show arrival notification
    if ('Notification' in window && Notification.permission === 'granted') {
      const currentStop = legs[currentStopIndex.value];
      new Notification('Arrived at Stop', {
        body: `You have arrived at: ${currentStop.end_address}`,
        icon: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png'
      });
    }

    speakInstruction(`You have arrived at your destination`);

    // If there are more stops, continue to next one
    if (currentStopIndex.value < legs.length - 1) {
      currentStopIndex.value++;
      currentLeg.value = legs[currentStopIndex.value];

      // Show next stop notification
      if ('Notification' in window && Notification.permission === 'granted') {
        const nextStop = legs[currentStopIndex.value];
        new Notification('Continuing to Next Stop', {
          body: `Next stop: ${nextStop.end_address}`,
          icon: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'
        });
      }

      speakInstruction(`Continuing to next stop`);
    } else {
      // Navigation completed
      navigationStore.stopNavigation();
      currentStopIndex.value = 0;

      // Show completion notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Navigation Complete', {
          body: 'You have reached your final destination',
          icon: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png'
        });
      }

      speakInstruction('You have reached your final destination');
    }
  };

  // Restore full route display
  const restoreFullRoute = () => {
    if (!directionsRenderer.value) return;

    try {
      // Remove custom polyline if it exists
      if ((directionsRenderer.value as any).customPolyline) {
        (directionsRenderer.value as any).customPolyline.setMap(null);
        (directionsRenderer.value as any).customPolyline = null;
      }

      // The original route will be restored by the map store when navigation stops
      console.log('Full route restored');
    } catch (error) {
      console.error('Error restoring full route:', error);
    }
  };

  // Stop location tracking
  const stopLocationTracking = () => {
    console.log('stopLocationTracking called - stack trace:', new Error().stack);
    
    if (watchId.value !== null) {
      navigator.geolocation.clearWatch(watchId.value);
      watchId.value = null;
    }
    
    if (currentPosition.value) {
      currentPosition.value.setMap(null);
      currentPosition.value = null;
    }
    
    // Restore full route display when stopping navigation
    restoreFullRoute();
    
    // Don't clear the directions renderer - keep the route visible
    // directionsRenderer.value?.setMap(null);
    // directionsRenderer.value = null;
    
    navigationStore.stopNavigation();
    currentStopIndex.value = 0;
    currentRoute.value = null;
    currentLeg.value = null;
    currentStep.value = null;
    lastKnownPosition.value = null;
    lastKnownHeading.value = null;
    isOffRoute.value = false;
    navigationMode.value = 'overview';
  };

  // Start navigation with multiple stops
  const startNavigation = async (stops: RouteStop[]) => {
    console.log('startNavigation called with stops:', stops.map(s => s.waybillNumber));
    console.log('currentPosition.value:', !!currentPosition.value);
    console.log('directionsRenderer.value:', !!directionsRenderer.value);
    
    if (!currentPosition.value || !directionsRenderer.value) {
      console.error('Navigation not properly initialized:');
      console.error('- currentPosition.value:', currentPosition.value);
      console.error('- directionsRenderer.value:', directionsRenderer.value);
      navigationStore.setNavigationError('Navigation not properly initialized');
      return;
    }

    try {
      // Request notification permission if not granted
      if ('Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission();
      }

      navigationStore.startNavigation();
      currentStopIndex.value = 0;

      const pos = currentPosition.value.getPosition();
      if (!pos) throw new Error('Current position not available');

      const currentLatLng = pos;

      // Use the optimized route order from the map store if available
      let optimizedStops = stops;
      
      if (mapStore.route && mapStore.route.stops && mapStore.route.stops.length > 0) {
        optimizedStops = mapStore.route.stops;
        console.log('Using optimized route from store:', optimizedStops.map(s => s.waybillNumber));
      } else {
        console.log('No optimized route in store, using provided stops:', stops.map(s => s.waybillNumber));
      }

      // Create waypoints from all stops except the last one
      const waypoints = optimizedStops.slice(0, -1).map(stop => ({
        location: new google.maps.LatLng(stop.lat, stop.lng),
        stopover: true
      }));

      const request: google.maps.DirectionsRequest = {
        origin: currentLatLng,
        destination: new google.maps.LatLng(optimizedStops[optimizedStops.length - 1].lat, optimizedStops[optimizedStops.length - 1].lng),
        waypoints,
        travelMode: google.maps.TravelMode.DRIVING,
        optimizeWaypoints: false
      };

      console.log('Starting navigation with optimized route:', {
        currentLocation: currentLatLng.toJSON(),
        numberOfStops: optimizedStops.length,
        firstStop: optimizedStops[0],
        lastStop: optimizedStops[optimizedStops.length - 1],
        routeOrder: optimizedStops.map(s => s.waybillNumber)
      });

      console.log('Calling Google Directions API...');
      const result = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
        try {
          directionsService.route(request).then(response => {
            console.log('Google Directions API response received:', response);
            if (response && response.routes && response.routes.length > 0) {
              console.log('Route found with', response.routes[0].legs.length, 'legs');
              resolve(response);
            } else {
              console.error('No route found in response');
              reject(new Error('No route found'));
            }
          }).catch(error => {
            console.error('Google Directions API error:', error);
            reject(error);
          });
        } catch (err) {
          console.error('Error calling Google Directions API:', err);
          reject(err);
        }
      });

      console.log('Route calculation completed successfully');

      // Store the route and current leg
      currentRoute.value = result.routes[0];
      currentLeg.value = result.routes[0].legs[0];

      directionsRenderer.value.setDirections(result);

      // Wait a moment for the directions to render before setting navigation view
      await new Promise(resolve => setTimeout(resolve, 500));

      // Initial navigation notification
      if ('Notification' in window && Notification.permission === 'granted') {
        const firstLeg = result.routes[0].legs[0];
        const firstStop = optimizedStops[0];
        new Notification('Starting Navigation', {
          body: `Navigating to ${firstStop.address}\nEstimated time: ${firstLeg.duration?.text}`,
          icon: '/icons/navigation-icon.png'
        });
      }

      // Set navigation view with proper zoom and tilt
      console.log('Setting navigation view - mapInstance:', !!mapInstance.value, 'directionsRenderer:', !!directionsRenderer.value);
      
      if (mapInstance.value) {
        console.log('Applying navigation view changes...');
        
        try {
          // Set navigation mode
          navigationMode.value = 'navigation';
          
          // Apply navigation view settings
          mapInstance.value.setZoom(18);
          mapInstance.value.setCenter(currentLatLng);
          mapInstance.value.setTilt(45);
          mapInstance.value.setHeading(lastKnownHeading.value || 0);
          
          console.log('Navigation view changes applied successfully');
        } catch (error) {
          console.error('Error applying navigation view:', error);
        }
      } else {
        console.error('Map instance not available for navigation view changes');
        // Try to get map from directionsRenderer as fallback
        const currentMap = directionsRenderer.value?.getMap();
        if (currentMap) {
          console.log('Using directionsRenderer map for navigation view');
          try {
            currentMap.setZoom(18);
            currentMap.setCenter(currentLatLng);
            currentMap.setTilt(45);
            currentMap.setHeading(lastKnownHeading.value || 0);
          } catch (error) {
            console.error('Error applying navigation view to fallback map:', error);
          }
        }
      }

      // Speak initial instruction
      speakInstruction('Starting navigation');

      // Start watching navigation state to maintain view
      watchNavigationState();

      // Verify navigation state
      console.log('Navigation state after start:', {
        isNavigating: navigationStore.isNavigating,
        navigationView: navigationStore.navigationView,
        nextManeuver: navigationStore.nextManeuver
      });

    } catch (err) {
      console.error('Navigation error:', err);
      navigationStore.setNavigationError('Failed to start navigation');
      currentStopIndex.value = 0;
    }
  };

  // Toggle navigation view
  const toggleNavigationView = () => {
    navigationStore.toggleNavigationView();
    const map = mapInstance.value || directionsRenderer.value?.getMap();
    if (map) {
      if (navigationStore.navigationView === 'navigation') {
        // Switch to navigation view
        navigationMode.value = 'navigation';
        map.setTilt(45);
        map.setZoom(18);
        if (lastKnownHeading.value !== null) {
          map.setHeading(lastKnownHeading.value);
        }
      } else {
        // Switch to overview view
        navigationMode.value = 'overview';
        map.setTilt(0);
        map.setHeading(0);
        map.setZoom(14);
      }
    }
  };

  // Toggle voice guidance
  const toggleVoiceGuidance = () => {
    navigationStore.toggleVoiceGuidance();
    if (!navigationStore.voiceEnabled) {
      speechSynthesis.cancel();
    }
  };

  // Toggle map minimize
  const toggleMapMinimize = () => {
    navigationStore.toggleMapMinimize();
  };

  // Cleanup on component unmount
  onUnmounted(() => {
    stopLocationTracking();
    speechSynthesis.cancel();
  });

  return {
    currentPosition,
    isNavigating: computed(() => navigationStore.isNavigating),
    navigationError: computed(() => navigationStore.navigationError),
    nextManeuver: computed(() => navigationStore.nextManeuver),
    distanceToNextTurn: computed(() => navigationStore.distanceToNextTurn),
    estimatedTimeToArrival: computed(() => navigationStore.estimatedTimeToArrival),
    currentLegProgress: computed(() => navigationStore.currentLegProgress),
    currentSpeed: computed(() => navigationStore.currentSpeed),
    isOffRoute: computed(() => navigationStore.isOffRoute),
    voiceEnabled: computed(() => navigationStore.voiceEnabled),
    navigationView: computed(() => navigationStore.navigationView),
    isMapMinimized: computed(() => navigationStore.isMapMinimized),
    upcomingTurns: computed(() => navigationStore.upcomingTurns),
    setDirectionsRenderer,
    setMapInstance,
    startLocationTracking,
    stopLocationTracking,
    startNavigation,
    toggleNavigationView,
    toggleVoiceGuidance,
    toggleMapMinimize,
    forceNavigationView,
    watchNavigationState,
    updateRoutePolyline,
    restoreFullRoute
  };
} 