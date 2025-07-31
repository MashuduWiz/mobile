import { ScanbotBarcodeSDK } from 'capacitor-plugin-scanbot-barcode-scanner-sdk';

class ScanbotService {
  private isInitialized = false;
  private licenseValid = false;

  async initialize(): Promise<boolean> {
    try {
      // Initialize the SDK with license key
      const LICENSE_KEY = "SRz0UoOsYgqqL4Hc56FNUqESgp5oEo" +
        "1cGNembcEwN1zdco/ul/UU5JKS00Tj" +
        "CEW+stVS4Gd20LXHmru9xW9VcK91aW" +
        "K9WIt0Y0K8MAY2jCa3r1tWZaxojttB" +
        "3vawcv4hvAKogOAthtaTkh+oK5vwDv" +
        "tcDBRii71MdJx9HmnT7PZOYGz/nDKF" +
        "eLtfhuKIQQcuUDM5A0XLKTNiLZltCn" +
        "5u3i4niHukT0SVyU9o+gGr97B8uK96" +
        "6Kh6SKfOeTL3Rrz410et5a9FSDGwqq" +
        "Cn+2PnPjNuYA5rSJ7PaDyYFeKTBKGz" +
        "B+aZxDOEknZgRpKLkz1gpN6zguyhGE" +
        "XLnpRLE1obKA==\nU2NhbmJvdFNESw" +
        "pjb20ubW9iaWxlaW52ZW50b3J5LmFw" +
        "cAoxNzUzMjI4Nzk5CjgzODg2MDcKMT" +
        "k=\n";

      const result = await ScanbotBarcodeSDK.initializeSdk({
        licenseKey: LICENSE_KEY
      });
      
      this.isInitialized = true;
      
      // Check license status
      const licenseInfo = await ScanbotBarcodeSDK.getLicenseInfo();
      this.licenseValid = licenseInfo.isLicenseValid;
      
      console.log('Scanbot SDK initialized:', this.isInitialized);
      console.log('License valid:', this.licenseValid);
      console.log('Initialization result:', result);
      
      return this.licenseValid;
    } catch (error) {
      console.error('Failed to initialize Scanbot SDK:', error);
      this.isInitialized = false;
      this.licenseValid = false;
      return false;
    }
  }

  async checkLicense(): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        return await this.initialize();
      }
      
      const licenseInfo = await ScanbotBarcodeSDK.getLicenseInfo();
      this.licenseValid = licenseInfo.isLicenseValid;
      return this.licenseValid;
    } catch (error) {
      console.error('Failed to check license:', error);
      this.licenseValid = false;
      return false;
    }
  }

  async resetLicense(): Promise<void> {
    this.isInitialized = false;
    this.licenseValid = false;
  }

  isReady(): boolean {
    return this.isInitialized && this.licenseValid;
  }

  getSDK() {
    return ScanbotBarcodeSDK;
  }
}

// Export a singleton instance
export const scanbotService = new ScanbotService(); 