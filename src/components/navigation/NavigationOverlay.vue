<template>
  <div class="navigation-overlay" v-if="isNavigating">
    <!-- Top Navigation Bar -->
    <div class="top-navigation-bar">
      <div class="navigation-header">
        <div class="current-location">
          <ion-icon :icon="locationOutline" class="location-icon"></ion-icon>
          <span class="location-text">Following route</span>
        </div>
        <div class="navigation-controls">
          <ion-button fill="clear" @click="toggleNavigationView" class="control-button">
            <ion-icon :icon="navigationView === 'navigation' ? mapOutline : navigateOutline"></ion-icon>
          </ion-button>
          <ion-button fill="clear" @click="toggleVoiceGuidance" class="control-button">
            <ion-icon :icon="voiceEnabled ? volumeHighOutline : volumeMuteOutline"></ion-icon>
          </ion-button>
          <ion-button fill="clear" @click="stopNavigation" class="control-button stop-button">
            <ion-icon :icon="closeOutline"></ion-icon>
          </ion-button>
        </div>
      </div>
    </div>

    <!-- Main Navigation Card -->
    <div class="maneuver-card" :class="{ 'off-route': isOffRoute, 'arriving': distanceToNextTurn === 'Arriving' }">
      <div class="next-maneuver">
        <div class="maneuver-header">
          <h3>{{ isOffRoute ? 'Off Route' : distanceToNextTurn === 'Arriving' ? 'Arriving' : 'Next Turn' }}</h3>
          <div class="maneuver-icon" :class="getManeuverClass()">
            <ion-icon :icon="getManeuverIcon()"></ion-icon>
          </div>
        </div>
        <p v-html="nextManeuver" class="maneuver-instruction"></p>
      </div>
      
      <div class="navigation-stats">
        <div class="stat-item">
          <ion-icon :icon="locationOutline"></ion-icon>
          <span>{{ distanceToNextTurn }}</span>
        </div>
        <div class="stat-item">
          <ion-icon :icon="timeOutline"></ion-icon>
          <span>{{ estimatedTimeToArrival }}</span>
        </div>
        <div class="stat-item" v-if="currentSpeed > 0">
          <ion-icon :icon="speedometerOutline"></ion-icon>
          <span>{{ Math.round(currentSpeed) }} km/h</span>
        </div>
      </div>
      
      <!-- Progress indicator -->
      <div class="progress-indicator" v-if="distanceToNextTurn !== 'Arriving'">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: `${currentLegProgress}%` }"></div>
        </div>
        <div class="progress-dot" :style="{ left: `${currentLegProgress}%` }"></div>
      </div>
    </div>

    <!-- Upcoming Turns -->
    <div class="upcoming-turns" v-if="upcomingTurns.length > 1">
      <div class="turns-header">
        <h3>Upcoming Turns</h3>
        <span class="turns-count">{{ upcomingTurns.length - 1 }} more</span>
      </div>
      <div class="turns-list">
        <div v-for="(turn, index) in upcomingTurns.slice(1, 4)" :key="index" class="turn-item">
          <div class="turn-icon" :class="turn.maneuver.toLowerCase()">
            <ion-icon :icon="getManeuverIcon(turn.maneuver)"></ion-icon>
          </div>
          <div class="turn-info">
            <p v-html="turn.instruction" class="turn-instruction"></p>
            <span class="turn-distance">{{ turn.distance }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Arrival notification -->
    <div class="arrival-notification" v-if="distanceToNextTurn === 'Arriving'">
      <ion-icon :icon="checkmarkCircleOutline" class="arrival-icon"></ion-icon>
      <span class="arrival-text">You have arrived at your destination</span>
    </div>

    <!-- Bottom Navigation Controls -->
    <div class="bottom-navigation-controls">
      <ion-button 
        @click="stopNavigation" 
        fill="solid" 
        color="danger" 
        class="stop-navigation-button"
      >
        <ion-icon :icon="closeOutline" slot="start"></ion-icon>
        Stop Navigation
      </ion-button>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { IonIcon, IonButton } from '@ionic/vue';
  import {
    locationOutline,
    timeOutline,
    navigateOutline,
    mapOutline,
    volumeHighOutline,
    volumeMuteOutline,
    speedometerOutline,
    arrowForwardOutline,
    arrowBackOutline,
    arrowUpOutline,
    returnDownBackOutline,
    returnUpForwardOutline,
    swapHorizontalOutline,
    checkmarkCircleOutline,
    closeOutline
  } from 'ionicons/icons';
  import { useNavigationStore } from '../../stores/navigationStore';

  const navigationStore = useNavigationStore();

  const {
    isNavigating,
    nextManeuver,
    distanceToNextTurn,
    estimatedTimeToArrival,
    currentLegProgress,
    currentSpeed,
    isOffRoute,
    voiceEnabled,
    navigationView,
    upcomingTurns,
    toggleNavigationView,
    toggleVoiceGuidance,
    stopNavigation
  } = navigationStore;

  const getManeuverIcon = (maneuver?: string) => {
    const maneuverType = maneuver || nextManeuver.toLowerCase();
    const maneuverMap: { [key: string]: string } = {
      'turn-right': arrowForwardOutline,
      'turn-left': arrowBackOutline,
      'slight-right': arrowForwardOutline,
      'slight-left': arrowBackOutline,
      'sharp-right': arrowForwardOutline,
      'sharp-left': arrowBackOutline,
      'uturn-right': returnDownBackOutline,
      'uturn-left': returnUpForwardOutline,
      'roundabout-right': swapHorizontalOutline,
      'roundabout-left': swapHorizontalOutline,
      'straight': arrowUpOutline,
      'merge': swapHorizontalOutline,
      'fork-right': arrowForwardOutline,
      'fork-left': arrowBackOutline,
      'ramp-right': arrowForwardOutline,
      'ramp-left': arrowBackOutline
    };

    return maneuverMap[maneuverType] || arrowForwardOutline;
  };

  const getManeuverClass = () => {
    const maneuverType = nextManeuver.toLowerCase();
    if (maneuverType.includes('right')) return 'turn-right';
    if (maneuverType.includes('left')) return 'turn-left';
    if (maneuverType.includes('straight')) return 'straight';
    if (maneuverType.includes('u-turn')) return 'uturn';
    return 'straight';
  };
</script>

<style scoped>
  .navigation-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    pointer-events: none;
    background: transparent;
  }

  .top-navigation-bar {
    background: linear-gradient(135deg, rgba(255, 75, 43, 0.9) 0%, rgba(255, 65, 108, 0.9) 100%);
    padding: 1rem;
    pointer-events: auto;
    backdrop-filter: blur(10px);
  }

  .navigation-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .current-location {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: white;
  }

  .location-icon {
    font-size: 1.2rem;
  }

  .location-text {
    font-weight: 500;
    font-size: 0.9rem;
  }

  .navigation-controls {
    display: flex;
    gap: 0.5rem;
  }

  .control-button {
    --color: white;
    --background: rgba(255, 255, 255, 0.1);
    --border-radius: 50%;
    --padding-start: 8px;
    --padding-end: 8px;
    --padding-top: 8px;
    --padding-bottom: 8px;
  }

  .stop-button {
    --background: rgba(244, 67, 54, 0.8);
  }

  .maneuver-card {
    background: white;
    border-radius: 16px;
    margin: 1rem;
    padding: 1.5rem;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    pointer-events: auto;
    transition: all 0.3s ease;
  }

  .maneuver-card.off-route {
    background: #fff3f3;
    border: 2px solid #ffcdd2;
  }

  .maneuver-card.arriving {
    background: #f1f8e9;
    border: 2px solid #c8e6c9;
  }

  .next-maneuver {
    margin-bottom: 1rem;
  }

  .maneuver-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .maneuver-header h3 {
    margin: 0;
    font-size: 1rem;
    color: #333;
    font-weight: 600;
  }

  .maneuver-icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #4285F4;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
  }

  .maneuver-icon.turn-right {
    transform: rotate(-45deg);
  }

  .maneuver-icon.turn-left {
    transform: rotate(45deg);
  }

  .maneuver-icon.uturn {
    transform: rotate(180deg);
  }

  .maneuver-instruction {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 500;
    color: #333;
    line-height: 1.4;
  }

  .navigation-stats {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .stat-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    color: #666;
    background: #f8f9fa;
    padding: 0.5rem 0.75rem;
    border-radius: 8px;
  }

  .progress-indicator {
    position: relative;
    height: 4px;
    background: #e0e0e0;
    border-radius: 2px;
    overflow: hidden;
  }

  .progress-bar {
    height: 100%;
    background: #4285F4;
    transition: width 0.3s ease;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #4285F4 0%, #34A853 100%);
    transition: width 0.3s ease;
  }

  .progress-dot {
    position: absolute;
    top: -2px;
    width: 8px;
    height: 8px;
    background: #4285F4;
    border-radius: 50%;
    transition: left 0.3s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  .upcoming-turns {
    background: white;
    border-radius: 16px;
    margin: 0 1rem 1rem 1rem;
    padding: 1rem;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    pointer-events: auto;
    max-height: 200px;
    overflow-y: auto;
  }

  .turns-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
  }

  .turns-header h3 {
    margin: 0;
    font-size: 0.9rem;
    color: #666;
    font-weight: 600;
  }

  .turns-count {
    font-size: 0.8rem;
    color: #999;
    background: #f8f9fa;
    padding: 0.25rem 0.5rem;
    border-radius: 12px;
  }

  .turns-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .turn-item {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.75rem;
    border-radius: 12px;
    background: #f8f9fa;
    transition: background-color 0.2s ease;
  }

  .turn-item:hover {
    background: #e3f2fd;
  }

  .turn-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #e3f2fd;
    color: #1976d2;
    flex-shrink: 0;
  }

  .turn-info {
    flex: 1;
  }

  .turn-instruction {
    margin: 0;
    font-size: 0.9rem;
    color: #333;
    line-height: 1.3;
  }

  .turn-distance {
    font-size: 0.8rem;
    color: #666;
    margin-top: 0.25rem;
    display: block;
  }

  .arrival-notification {
    background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
    color: white;
    padding: 1rem 1.5rem;
    margin: 0 1rem;
    border-radius: 16px;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-weight: 500;
    animation: pulse 2s infinite;
    pointer-events: auto;
  }

  .arrival-icon {
    font-size: 1.5rem;
  }

  .arrival-text {
    font-size: 1rem;
  }

  @keyframes pulse {
    0% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.9; transform: scale(1.02); }
    100% { opacity: 1; transform: scale(1); }
  }

  .bottom-navigation-controls {
    margin-top: auto;
    padding: 1rem;
    pointer-events: auto;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
  }

  .stop-navigation-button {
    --padding-start: 2rem;
    --padding-end: 2rem;
    --padding-top: 1rem;
    --padding-bottom: 1rem;
    font-weight: 600;
    font-size: 1rem;
    box-shadow: 0 4px 12px rgba(244, 67, 54, 0.3);
    border-radius: 16px;
    width: 100%;
  }

  ion-icon {
    font-size: 1.2rem;
  }

  /* Maneuver-specific styles */
  .turn-icon.turn-right,
  .turn-icon.slight-right,
  .turn-icon.sharp-right {
    transform: rotate(-45deg);
  }

  .turn-icon.turn-left,
  .turn-icon.slight-left,
  .turn-icon.sharp-left {
    transform: rotate(45deg);
  }

  .turn-icon.uturn-right {
    transform: rotate(180deg);
  }

  .turn-icon.uturn-left {
    transform: rotate(180deg) scaleX(-1);
  }

  .turn-icon.roundabout-right,
  .turn-icon.roundabout-left {
    transform: rotate(90deg);
  }

  .turn-icon.merge {
    transform: rotate(45deg);
  }

  .turn-icon.fork-right {
    transform: rotate(-30deg);
  }

  .turn-icon.fork-left {
    transform: rotate(30deg);
  }

  .turn-icon.ramp-right {
    transform: rotate(-60deg);
  }

  .turn-icon.ramp-left {
    transform: rotate(60deg);
  }
</style>