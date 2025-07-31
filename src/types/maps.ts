export interface LatLng {
    lat: number;
    lng: number;
  }
  
  export interface RouteStop {
    lat: number;
    lng: number;
    address: string;
    waybillNumber: string;
    name?: string;
    phone?: string;
    notes?: string;
  }
  
  export interface Route {
    stops: RouteStop[];
    totalDistance: string;
    totalDuration: string;
    polyline?: string;
  }
  
  // Map Component Props
  export interface MapComponentProps {
    center?: LatLng;
    zoom?: number;
    markers?: RouteStop[];
    polyline?: string;
    height?: string;
    width?: string;
  }
  
  // Map Events
  export interface MapClickEvent {
    latLng: LatLng;
    placeId?: string;
  }
  
  // Directions Service Types
  export interface DirectionsRequest {
    origin: LatLng | string;
    destination: LatLng | string;
    waypoints?: Array<{
      location: LatLng | string;
      stopover: boolean;
    }>;
    travelMode: string;
    optimizeWaypoints?: boolean;
  }
  
  export interface DirectionsResult {
    routes: any[];
  }
  
  export interface ExtendedDirectionsResult extends DirectionsResult {
    totalDistance?: string;
    totalDuration?: string;
    optimizedWaypointOrder?: number[];
  }
  
  // Geocoding Types
  export interface GeocodeResult {
    address: string;
    location: LatLng;
    placeId: string;
  }
  
  // Store Types
  export interface MapState {
    currentLocation: LatLng | null;
    selectedStop: RouteStop | null;
    route: Route | null;
    isLoading: boolean;
    error: string | null;
  }
  
  // Component Props Types
  export interface StopListProps {
    stops: RouteStop[];
    onStopSelect?: (stop: RouteStop) => void;
    onStopReorder?: (stops: RouteStop[]) => void;
  }
  
  export interface RouteStatsProps {
    totalDistance: string;
    totalDuration: string;
    stopsCount: number;
  }
  
  // API Response Types
  export interface ApiResponse<T> {
    data: T;
    status: 'success' | 'error';
    message?: string;
  }
  
  // Error Types
  export interface MapError {
    code: string;
    message: string;
    details?: unknown;
  }
  
  export interface MapOptions {
    center: { lat: number; lng: number };
    zoom: number;
  }
  
  export interface MarkerData {
    position: { lat: number; lng: number };
    label?: string;
    info?: string;
  }
