import { defineStore } from 'pinia';
import type { Route, RouteStop, LatLng } from '../types/maps';

export const useMapStore = defineStore('map', {
  state: () => ({
    currentLocation: null as LatLng | null,
    selectedStop: null as RouteStop | null,
    route: null as Route | null,
    isLoading: false,
    error: null as string | null
  }),

  actions: {
    setCurrentLocation(location: LatLng) {
      this.currentLocation = location;
    },

    setSelectedStop(stop: RouteStop) {
      this.selectedStop = stop;
    },

    setRoute(route: Route) {
      this.route = route;
    },

    addStop(stop: RouteStop) {
      if (this.route) {
        this.route.stops.push(stop);
      } else {
        this.route = {
          stops: [stop],
          totalDistance: '',
          totalDuration: ''
        };
      }
    },

    removeStop(stopId: string) {
      if (this.route) {
        this.route.stops = this.route.stops.filter(
          stop => stop.waybillNumber !== stopId
        );
      }
    },

    reorderStops(stops: RouteStop[]) {
      if (this.route) {
        this.route.stops = stops;
      }
    },

    setLoading(loading: boolean) {
      this.isLoading = loading;
    },

    setError(error: string | null) {
      this.error = error;
    },

    clearRoute() {
      this.route = null;
      this.selectedStop = null;
    }
  }
}); 