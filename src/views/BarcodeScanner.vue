<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar class="main-toolbar">
        <ion-buttons slot="start">
          <ion-back-button default-href="/dashboard"></ion-back-button>
        </ion-buttons>
        <ion-title>
          <div class="logo-container">
            <ion-icon :icon="scanOutline" class="logo-icon"></ion-icon>
            <span class="logo-text">Barcode Scanner</span>
          </div>
        </ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="scanner-container">
        <!-- Welcome Section -->
        <div class="welcome-section">
          <h1>Barcode Scanner</h1>
          <p>Scan barcodes to quickly identify products and manage inventory</p>
        </div>

        <!-- Scanner Options -->
        <div class="scanner-options">
          <ion-card class="scanner-card" @click="startSingleBarcodeScan">
            <ion-card-content>
              <ion-icon :icon="scanOutline" class="scanner-icon single"></ion-icon>
              <h2>Single Barcode Scan</h2>
              <p>Scan one barcode at a time</p>
            </ion-card-content>
          </ion-card>

          <ion-card class="scanner-card" @click="startMultiBarcodeScan">
            <ion-card-content>
              <ion-icon :icon="scanOutline" class="scanner-icon multiple"></ion-icon>
              <h2>Multiple Barcode Scan</h2>
              <p>Scan multiple barcodes in one session</p>
            </ion-card-content>
          </ion-card>
        </div>

        <!-- Recent Scans -->
        <div v-if="recentScans.length > 0" class="recent-scans">
          <h3>Recent Scans</h3>
          <ion-list>
            <ion-item v-for="(scan, index) in recentScans" :key="index">
              <ion-icon :icon="scanOutline" slot="start" class="scan-icon"></ion-icon>
              <ion-label>
                <h4>{{ scan.text }}</h4>
                <p>Type: {{ scan.format }} | Time: {{ scan.timestamp }}</p>
              </ion-label>
            </ion-item>
          </ion-list>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton, IonCard, IonCardContent, IonIcon, IonList, IonItem, IonLabel } from '@ionic/vue';
import { scanOutline } from 'ionicons/icons';
import { BarcodeScannerScreenConfiguration, SingleScanningMode, MultipleScanningMode } from 'capacitor-plugin-scanbot-barcode-scanner-sdk/dist/esm/ui_v2';
import { scanbotService } from '../services/scanbotService';

interface ScanResult {
  text: string;
  format: string;
  timestamp: string;
}

const recentScans = ref<ScanResult[]>([]);
const isReady = ref(false);

// Initialize the SDK when component mounts
onMounted(async () => {
  await initializeScanner();
});

const initializeScanner = async () => {
  try {
    isReady.value = await scanbotService.initialize();
    if (!isReady.value) {
      console.warn('Scanner not ready - license may be invalid');
    }
  } catch (error) {
    console.error('Failed to initialize scanner:', error);
    isReady.value = false;
  }
};

const addToRecentScans = (text: string, format: string) => {
  const newScan: ScanResult = {
    text,
    format,
    timestamp: new Date().toLocaleTimeString()
  };
  recentScans.value.unshift(newScan);
  // Keep only last 10 scans
  if (recentScans.value.length > 10) {
    recentScans.value = recentScans.value.slice(0, 10);
  }
};

const startSingleBarcodeScan = async () => {
  try {
    // Check if scanner is ready
    if (!scanbotService.isReady()) {
      const licenseValid = await scanbotService.checkLicense();
      if (!licenseValid) {
        alert('Scanner is not ready. Please try again or check your license configuration.');
        return;
      }
    }
    
    const sdk = scanbotService.getSDK();
    const config = new BarcodeScannerScreenConfiguration();
    config.useCase = new SingleScanningMode();
    const result = await sdk.startBarcodeScanner(config);
    
    if (result.data && result.data.items && result.data.items.length > 0) {
      const barcode = result.data.items[0].barcode;
      addToRecentScans(barcode.text, barcode.format);
      alert(
        'Barcode Scanning successfully!\n' +
        `Value: ${barcode.text} \n` +
        `Type: ${barcode.format}`
      );
    }
  } catch (e: any) {
    console.error('An error has occurred while running Barcode Scanner', e.message);
    
    // If there's a license error, reset and try to reinitialize
    if (e.message && (e.message.includes('license') || e.message.includes('License'))) {
      await scanbotService.resetLicense();
      alert('License error detected. Please try scanning again.');
    } else {
      alert('Scanning failed. Please try again.');
    }
  }
};

const startMultiBarcodeScan = async () => {
  try {
    // Check if scanner is ready
    if (!scanbotService.isReady()) {
      const licenseValid = await scanbotService.checkLicense();
      if (!licenseValid) {
        alert('Scanner is not ready. Please try again or check your license configuration.');
        return;
      }
    }
    
    const sdk = scanbotService.getSDK();
    const config = new BarcodeScannerScreenConfiguration();
    config.useCase = new MultipleScanningMode();
    const result = await sdk.startBarcodeScanner(config);
    
    if (result.data && result.data.items && result.data.items.length > 0) {
      const scannedBarcodes = result.data.items.map((item: any) => item.barcode);
      scannedBarcodes.forEach(barcode => {
        addToRecentScans(barcode.text, barcode.format);
      });
      alert(
        'Barcode Scanning successfully!\n' +
        scannedBarcodes.map((barcode: any) =>
          `Barcode value: ${barcode.text} and type: ${barcode.format}`
        ).join("\n")
      );
    }
  } catch (e: any) {
    console.error('An error has occurred while running Barcode Scanner', e.message);
    
    // If there's a license error, reset and try to reinitialize
    if (e.message && (e.message.includes('license') || e.message.includes('License'))) {
      await scanbotService.resetLicense();
      alert('License error detected. Please try scanning again.');
    } else {
      alert('Scanning failed. Please try again.');
    }
  }
};
</script>

<style scoped>
.scanner-container {
  padding: 1rem;
  background-color: #f8f9fa;
  min-height: 100%;
}

/* Header Styling */
.main-toolbar {
  --background: #ffffff;
  --color: #333333;
  --border-color: transparent;
  --padding-top: 0.5rem;
  --padding-bottom: 0.5rem;
}

.logo-container {
  display: flex;
  align-items: center;
}

.logo-icon {
  font-size: 1.5rem;
  color: #2196f3;
  margin-right: 0.5rem;
}

.logo-text {
  font-weight: 700;
  font-size: 1.2rem;
  color: #2196f3;
}

/* Welcome Section */
.welcome-section {
  background: linear-gradient(135deg, #2196f3 0%, #21cbf3 100%);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  color: white;
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.2);
}

.welcome-section h1 {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
}

.welcome-section p {
  font-size: 0.95rem;
  margin: 0;
  opacity: 0.9;
}

/* Scanner Options */
.scanner-options {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  margin-bottom: 2rem;
}

.scanner-card {
  margin: 0;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  overflow: hidden;
  background: white;
}

.scanner-card:active {
  transform: scale(0.98);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.scanner-card ion-card-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  text-align: center;
}

.scanner-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.scanner-icon.single {
  color: #4caf50;
}

.scanner-icon.multiple {
  color: #ff9800;
}

.scanner-card h2 {
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: #333;
}

.scanner-card p {
  font-size: 0.9rem;
  margin: 0;
  color: #666;
}

/* Recent Scans */
.recent-scans {
  background: white;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.recent-scans h3 {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
  color: #333;
}

.scan-icon {
  color: #2196f3;
  font-size: 1.2rem;
}

ion-item h4 {
  font-weight: 600;
  margin: 0 0 0.25rem 0;
  color: #333;
}

ion-item p {
  font-size: 0.8rem;
  margin: 0;
  color: #666;
}

/* Tablet and larger screens */
@media (min-width: 768px) {
  .scanner-options {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .welcome-section h1 {
    font-size: 1.8rem;
  }
  
  .welcome-section p {
    font-size: 1.1rem;
  }
}
</style> 