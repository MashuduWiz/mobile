import { ref, onUnmounted } from 'vue';
import type { 
  LatLng, 
  RouteStop, 
  DirectionsRequest,
  MapError 
} from '../types/maps';

interface ExtendedDirectionsResult extends google.maps.DirectionsResult {
  totalDistance?: string;
  totalDuration?: string;
  optimizedWaypointOrder?: number[];
}



export function useGoogleMaps() {
  const map = ref<google.maps.Map | null>(null);
  const error = ref<MapError | null>(null);
  const isLoading = ref(false);

  // Initialize services
  const geocoder = new google.maps.Geocoder();
  const directionsService = new google.maps.DirectionsService();
  const directionsRenderer = ref<google.maps.DirectionsRenderer | null>(null);

  // Initialize the map
  const initMap = async (element: HTMLElement, options: google.maps.MapOptions) => {
    try {
      // Check if Google Maps API is loaded
      if (typeof google === 'undefined' || !google.maps) {
        throw new Error('Google Maps API not loaded. Please check your API key and make sure the API is enabled in the Google Cloud Console.');
      }

      // Create map instance
      const mapInstance = new google.maps.Map(element, {
        ...options,
        mapId: 'my-map'
      });

      map.value = mapInstance;

      // Initialize DirectionsRenderer with the map
      directionsRenderer.value = new google.maps.DirectionsRenderer({
        map: mapInstance,
        suppressMarkers: false,
        preserveViewport: true, // Keep our manual viewport settings
        polylineOptions: {
          strokeColor: '#4285F4',
          strokeWeight: 6,
          strokeOpacity: 0.8,
          zIndex: 1
        }
      });

      return mapInstance;
    } catch (err) {
      error.value = {
        code: 'MAP_INIT_ERROR',
        message: 'Failed to initialize map',
        details: err
      };
      console.error('Map initialization error:', err);
      throw err;
    }
  };

  // Get current location
  const getCurrentLocation = (): Promise<LatLng> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          reject(new Error(`Failed to get current location: ${error.message}`));
        }
      );
    });
  };



  // Optimize route using nearest neighbor algorithm
  const optimizeRouteOrder = (stops: RouteStop[], startLocation: LatLng): RouteStop[] => {
    if (stops.length <= 1) return stops;

    console.log('Starting route optimization:');
    console.log('  Start location:', startLocation);
    console.log('  Original stops:', stops.map(s => s.waybillNumber));

    // For now, we'll use a simple nearest neighbor approach
    // In a production app, you might want to use a more sophisticated TSP solver
    const optimizedStops: RouteStop[] = [];
    const unvisited = [...stops];
    let currentPoint = startLocation;

    while (unvisited.length > 0) {
      let nearestIndex = 0;
      let nearestDistance = Infinity;

      // Find the nearest unvisited stop
      unvisited.forEach((stop, index) => {
        const distance = calculateDistance(currentPoint, { lat: stop.lat, lng: stop.lng });
        console.log(`  Distance from current point to ${stop.waybillNumber}: ${distance.toFixed(2)} km`);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = index;
        }
      });

      // Add the nearest stop to the optimized route
      const nextStop = unvisited[nearestIndex];
      optimizedStops.push(nextStop);
      console.log(`  Selected next stop: ${nextStop.waybillNumber} (distance: ${nearestDistance.toFixed(2)} km)`);
      
      currentPoint = { lat: nextStop.lat, lng: nextStop.lng };
      unvisited.splice(nearestIndex, 1);
    }

    console.log('Route optimization completed:');
    console.log('  Optimized order:', optimizedStops.map(s => s.waybillNumber));
    
    return optimizedStops;
  };

  // Calculate distance between two points using Haversine formula
  const calculateDistance = (point1: LatLng, point2: LatLng): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLng = (point2.lng - point1.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Calculate optimized route
  const calculateOptimizedRoute = async (stops: RouteStop[], startLocation: LatLng): Promise<ExtendedDirectionsResult> => {
    if (!map.value || !directionsRenderer.value) {
      throw new Error('Map services not properly initialized');
    }

    if (stops.length === 0) {
      throw new Error('No stops provided for route calculation');
    }

    isLoading.value = true;

    try {
      // Optimize the route order
      const optimizedStops = optimizeRouteOrder(stops, startLocation);
      console.log('Route optimization completed:');
      console.log('  Original order:', stops.map(s => s.waybillNumber));
      console.log('  Optimized order:', optimizedStops.map(s => s.waybillNumber));
      console.log('  Starting from:', startLocation);

      // If we have only one stop, create a simple route
      if (optimizedStops.length === 1) {
        const request: DirectionsRequest = {
          origin: startLocation,
          destination: { lat: optimizedStops[0].lat, lng: optimizedStops[0].lng },
          travelMode: 'DRIVING'
        };
        return await calculateRoute(request);
      }

      // For multiple stops, create a route with waypoints
      const waypoints = optimizedStops.slice(0, -1).map(stop => ({
        location: { lat: stop.lat, lng: stop.lng },
        stopover: true
      }));

      const lastStop = optimizedStops[optimizedStops.length - 1];

      const request: DirectionsRequest = {
        origin: startLocation,
        destination: { lat: lastStop.lat, lng: lastStop.lng },
        waypoints,
        travelMode: 'DRIVING',
        optimizeWaypoints: false // We've already optimized the order
      };

      const result = await calculateRoute(request);

      // Create the optimized waypoint order that maps back to original stops
      const optimizedWaypointOrder = optimizedStops.map(optimizedStop => 
        stops.findIndex(originalStop => 
          originalStop.waybillNumber === optimizedStop.waybillNumber
        )
      ).filter(index => index !== -1);

      console.log('Optimized waypoint order indices:', optimizedWaypointOrder);

      // Update the result with our optimized order
      return {
        ...result,
        optimizedWaypointOrder: optimizedWaypointOrder
      };
    } finally {
      isLoading.value = false;
    }
  };

  // Calculate route
  const calculateRoute = async (request: DirectionsRequest): Promise<ExtendedDirectionsResult> => {
    if (!map.value || !directionsRenderer.value) {
      throw new Error('Map services not properly initialized');
    }

    // Validate request parameters
    if (!request.origin || !request.destination) {
      throw new Error('Origin and destination are required');
    }

    isLoading.value = true;
    let retryCount = 0;
    const maxRetries = 3;

    try {
      while (retryCount < maxRetries) {
        try {
          // Clear existing route
          directionsRenderer.value.setMap(null);
          directionsRenderer.value.setMap(map.value);

          const googleRequest: google.maps.DirectionsRequest = {
            origin: typeof request.origin === 'string' ? request.origin : new google.maps.LatLng(request.origin.lat, request.origin.lng),
            destination: typeof request.destination === 'string' ? request.destination : new google.maps.LatLng(request.destination.lat, request.destination.lng),
            waypoints: request.waypoints?.map(wp => ({
              location: typeof wp.location === 'string' ? wp.location : new google.maps.LatLng(wp.location.lat, wp.location.lng),
              stopover: true
            })),
            travelMode: google.maps.TravelMode.DRIVING,
            optimizeWaypoints: request.optimizeWaypoints ?? true
          };

          // Add a small delay between retries
          if (retryCount > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          }

          const result = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
            try {
              const request = {
                ...googleRequest,
                travelMode: google.maps.TravelMode.DRIVING
              };
              
              directionsService.route(request).then(response => {
                if (response && response.routes && response.routes.length > 0) {
                  resolve(response);
                } else {
                  reject(new Error('No route found'));
                }
              }).catch(reject);
            } catch (err) {
              reject(err);
            }
          });

          // Set the directions on the renderer
          directionsRenderer.value.setDirections(result);

          // Calculate total distance and duration
          const route = result.routes[0];
          let totalDistance = 0;
          let totalDuration = 0;

          if (route && route.legs) {
            route.legs.forEach((leg: google.maps.DirectionsLeg) => {
              totalDistance += leg.distance?.value || 0;
              totalDuration += leg.duration?.value || 0;
            });
          }

          // Get the optimized waypoint order if available
          const optimizedOrder = route.waypoint_order || [];

          return {
            ...result,
            totalDistance: `${(totalDistance / 1000).toFixed(1)} km`,
            totalDuration: `${Math.round(totalDuration / 60)} mins`,
            optimizedWaypointOrder: optimizedOrder
          };
        } catch (err) {
          console.error(`Route calculation attempt ${retryCount + 1} failed:`, err);
          retryCount++;

          if (retryCount === maxRetries) {
            error.value = {
              code: 'ROUTE_CALCULATION_ERROR',
              message: 'Failed to calculate route after multiple attempts',
              details: err
            };
            throw err;
          }
        }
      }

      throw new Error('Failed to calculate route');
    } finally {
      isLoading.value = false;
    }
  };

  // Add markers to map
  const addMarkers = (stops: RouteStop[]) => {
    if (!map.value) return;

    stops.forEach((stop) => {
      if (!map.value) return;
      new google.maps.Marker({
        position: new google.maps.LatLng(stop.lat, stop.lng),
        map: map.value,
        title: stop.address,
        label: stop.waybillNumber
      });
    });
  };

  // Clear map
  const clearMap = () => {
    if (directionsRenderer.value) {
      directionsRenderer.value.setMap(null);
      directionsRenderer.value = null;
    }
    if (map.value) {
      map.value = null;
    }
  };

  // Geocode address
  const geocodeAddress = async (address: string): Promise<LatLng> => {
    try {
      const result = await geocoder.geocode({ address });
      const location = result.results[0]?.geometry?.location;
      
      if (!location) {
        throw new Error('No results found');
      }

      const latLng = location.toJSON();
      return {
        lat: latLng.lat,
        lng: latLng.lng
      };
    } catch (err) {
      console.error('Geocoding error:', err);
      throw err;
    }
  };

  // Cleanup
  onUnmounted(() => {
    clearMap();
  });

  return {
    map,
    error,
    isLoading,
    directionsRenderer,
    initMap,
    getCurrentLocation,
    calculateRoute,
    calculateOptimizedRoute,
    addMarkers,
    clearMap,
    geocodeAddress
  };
} 