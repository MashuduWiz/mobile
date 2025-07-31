import { defineStore } from 'pinia';

interface Stop {
  id: string;
  name: string;
  address: string;
  contactPerson: string;
  phoneNumber: string;
  notes: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface RouteState {
  stops: Stop[];
  totalDistance: number;
  totalTime: number;
  fuelCost: number;
}

export const useRouteStore = defineStore('route', {
  state: (): RouteState => ({
    stops: [],
    totalDistance: 0,
    totalTime: 0,
    fuelCost: 0
  }),

  getters: {
    totalStops: (state) => state.stops.length,
    formattedTotalTime: (state) => {
      const hours = Math.floor(state.totalTime / 60);
      const minutes = state.totalTime % 60;
      return `${hours}h ${minutes}m`;
    },
    formattedTotalDistance: (state) => `${state.totalDistance.toFixed(1)} km`,
    formattedFuelCost: (state) => `$${state.fuelCost.toFixed(2)}`
  },

  actions: {
    addStop(stop: Stop) {
      this.stops.push(stop);
      this.updateRouteStats();
    },

    updateStop(id: string, updatedStop: Partial<Stop>) {
      const index = this.stops.findIndex(stop => stop.id === id);
      if (index !== -1) {
        this.stops[index] = { ...this.stops[index], ...updatedStop };
        this.updateRouteStats();
      }
    },

    removeStop(id: string) {
      this.stops = this.stops.filter(stop => stop.id !== id);
      this.updateRouteStats();
    },

    reorderStops(newOrder: string[]) {
      this.stops = newOrder.map(id => 
        this.stops.find(stop => stop.id === id)
      ).filter((stop): stop is Stop => stop !== undefined);
      this.updateRouteStats();
    },

    updateRouteStats() {
      // TODO: Implement actual route calculation logic
      // This is just a placeholder that would be replaced with actual calculations
      this.totalDistance = this.stops.length * 10; // Example: 10km per stop
      this.totalTime = this.stops.length * 30; // Example: 30 minutes per stop
      this.fuelCost = this.totalDistance * 0.15; // Example: $0.15 per km
    }
  }
}); 