declare namespace google {
  namespace maps {
    class Map {
      constructor(element: HTMLElement, options: MapOptions);
      setCenter(latLng: LatLng | LatLngLiteral): void;
      setZoom(zoom: number): void;
      setTilt(tilt: number): void;
      setHeading(heading: number): void;
      panTo(latLng: LatLng | LatLngLiteral): void;
      fitBounds(bounds: LatLngBounds): void;
    }
    class DirectionsService {
      route(request: DirectionsRequest): Promise<DirectionsResult>;
    }
    class DirectionsRenderer {
      constructor(options: DirectionsRendererOptions);
      setMap(map: Map | null): void;
      setDirections(directions: DirectionsResult | { routes: [] }): void;
      getDirections(): DirectionsResult | null;
      getMap(): Map | null;
    }
    class Marker {
      constructor(options: MarkerOptions);
      setPosition(latLng: LatLng | LatLngLiteral): void;
      getPosition(): LatLng | null;
      setMap(map: Map | null): void;
    }
    class LatLngBounds {
      constructor();
      extend(latLng: LatLng | LatLngLiteral): void;
    }
    class Size {
      constructor(width: number, height: number);
      width: number;
      height: number;
    }
    namespace geometry {
      namespace spherical {
        function computeDistanceBetween(from: LatLng, to: LatLng): number;
      }
    }
    interface MapOptions {
      center: LatLng;
      zoom: number;
      mapTypeControl?: boolean;
      streetViewControl?: boolean;
      fullscreenControl?: boolean;
      tilt?: number;
      heading?: number;
    }
    interface DirectionsRendererOptions {
      map: Map;
      suppressMarkers?: boolean;
      preserveViewport?: boolean;
      polylineOptions?: PolylineOptions;
      markerOptions?: MarkerOptions;
    }
    interface PolylineOptions {
      strokeColor?: string;
      strokeWeight?: number;
    }
    interface MarkerOptions {
      position?: LatLng;
      map?: Map;
      title?: string;
      label?: string;
      icon?: string | Icon | GMSymbol;
    }
    interface Icon {
      url: string;
      scaledSize?: Size;
    }
    interface GMSymbol {
      path: SymbolPath;
      scale?: number;
      fillColor?: string;
      fillOpacity?: number;
      strokeColor?: string;
      strokeWeight?: number;
    }
    enum SymbolPath {
      CIRCLE
    }
    interface LatLng {
      lat(): number;
      lng(): number;
      toJSON(): LatLngLiteral;
    }
    interface LatLngLiteral {
      lat: number;
      lng: number;
    }
    interface DirectionsRequest {
      origin: LatLng | string;
      destination: LatLng | string;
      waypoints?: DirectionsWaypoint[];
      travelMode: string;
      optimizeWaypoints?: boolean;
    }
    interface DirectionsWaypoint {
      location: LatLng | string;
      stopover: boolean;
    }
    interface DirectionsResult {
      routes: DirectionsRoute[];
    }
    interface DirectionsRoute {
      legs: DirectionsLeg[];
    }
    interface DirectionsLeg {
      start_location: LatLng;
      end_location: LatLng;
      start_address: string;
      end_address: string;
      duration?: DirectionsDuration;
    }
    interface DirectionsDuration {
      text: string;
      value: number;
    }
  }
} 