import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useNavigationStore = defineStore('navigation', () => {
  // Navigation state
  const isNavigating = ref(false);
  const navigationError = ref<string | null>(null);
  const currentStep = ref<any>(null);
  const nextManeuver = ref<string>('');
  const distanceToNextTurn = ref<string>('');
  const estimatedTimeToArrival = ref<string>('');
  const currentLegProgress = ref<number>(0);
  const currentSpeed = ref<number>(0);
  const isOffRoute = ref<boolean>(false);
  const voiceEnabled = ref<boolean>(true);
  const navigationView = ref<'overview' | 'navigation'>('overview');
  const isMapMinimized = ref<boolean>(false);
  const upcomingTurns = ref<Array<{
    instruction: string;
    distance: string;
    maneuver: string;
  }>>([]);

  // Computed properties
  const isCurrentlyNavigating = computed(() => isNavigating.value);
  const hasNavigationError = computed(() => !!navigationError.value);

  // Actions
  const startNavigation = () => {
    console.log('NavigationStore: Starting navigation');
    isNavigating.value = true;
    navigationError.value = null;
  };

  const stopNavigation = () => {
    console.log('NavigationStore: Stopping navigation');
    isNavigating.value = false;
    navigationError.value = null;
  };

  const setNavigationError = (error: string) => {
    console.log('NavigationStore: Setting error:', error);
    navigationError.value = error;
    isNavigating.value = false;
  };

  const updateNavigationInfo = (info: {
    nextManeuver?: string;
    distanceToNextTurn?: string | number;
    estimatedTimeToArrival?: string | number;
    currentLegProgress?: number;
    currentSpeed?: number;
    isOffRoute?: boolean;
    upcomingTurns?: Array<{ instruction: string; distance: string; maneuver: string }>;
  }) => {
    if (info.nextManeuver !== undefined) nextManeuver.value = info.nextManeuver;
    if (info.distanceToNextTurn !== undefined) {
      if (typeof info.distanceToNextTurn === 'number') {
        distanceToNextTurn.value = info.distanceToNextTurn > 0 ? `${Math.round(info.distanceToNextTurn)} m` : 'Arriving';
      } else {
        distanceToNextTurn.value = info.distanceToNextTurn;
      }
    }
    if (info.estimatedTimeToArrival !== undefined) {
      if (typeof info.estimatedTimeToArrival === 'number') {
        estimatedTimeToArrival.value = info.estimatedTimeToArrival > 0 ? `${Math.round(info.estimatedTimeToArrival)} mins` : '';
      } else {
        estimatedTimeToArrival.value = info.estimatedTimeToArrival;
      }
    }
    if (info.currentLegProgress !== undefined) currentLegProgress.value = info.currentLegProgress;
    if (info.currentSpeed !== undefined) currentSpeed.value = info.currentSpeed;
    if (info.isOffRoute !== undefined) isOffRoute.value = info.isOffRoute;
    if (info.upcomingTurns !== undefined) upcomingTurns.value = info.upcomingTurns;
  };

  const toggleVoiceGuidance = () => {
    voiceEnabled.value = !voiceEnabled.value;
  };

  const toggleNavigationView = () => {
    navigationView.value = navigationView.value === 'overview' ? 'navigation' : 'overview';
  };

  const toggleMapMinimize = () => {
    isMapMinimized.value = !isMapMinimized.value;
  };

  return {
    // State
    isNavigating,
    navigationError,
    currentStep,
    nextManeuver,
    distanceToNextTurn,
    estimatedTimeToArrival,
    currentLegProgress,
    currentSpeed,
    isOffRoute,
    voiceEnabled,
    navigationView,
    isMapMinimized,
    upcomingTurns,
    
    // Computed
    isCurrentlyNavigating,
    hasNavigationError,
    
    // Actions
    startNavigation,
    stopNavigation,
    setNavigationError,
    updateNavigationInfo,
    toggleVoiceGuidance,
    toggleNavigationView,
    toggleMapMinimize
  };
}); 