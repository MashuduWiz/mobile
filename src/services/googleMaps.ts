import type { 
    LatLng, 
    GeocodeResult 
  } from '../types/maps';
  
  class GoogleMapsService {
    private static instance: GoogleMapsService;
    private geocoder: google.maps.Geocoder | null = null;
  
    private constructor() {
      if (window.google?.maps) {
        this.geocoder = new google.maps.Geocoder();
      }
    }
  
    public static getInstance(): GoogleMapsService {
      if (!GoogleMapsService.instance) {
        GoogleMapsService.instance = new GoogleMapsService();
      }
      return GoogleMapsService.instance;
    }
  
    public async geocodeAddress(address: string): Promise<GeocodeResult> {
      if (!this.geocoder) {
        throw new Error('Geocoder not initialized');
      }
  
      return new Promise((resolve, reject) => {
        this.geocoder!.geocode({ address }, (results, status) => {
          if (status === 'OK' && results?.[0]) {
            const location = results[0].geometry.location;
            resolve({
              address: results[0].formatted_address,
              location: {
                lat: location.lat(),
                lng: location.lng()
              },
              placeId: results[0].place_id
            });
          } else {
            reject(new Error(`Geocoding failed: ${status}`));
          }
        });
      });
    }
  
    public async reverseGeocode(latLng: LatLng): Promise<string> {
      if (!this.geocoder) {
        throw new Error('Geocoder not initialized');
      }
  
      return new Promise((resolve, reject) => {
        this.geocoder!.geocode({ location: latLng }, (results, status) => {
          if (status === 'OK' && results?.[0]) {
            resolve(results[0].formatted_address);
          } else {
            reject(new Error(`Reverse geocoding failed: ${status}`));
          }
        });
      });
    }
  
    public calculateDistance(origin: LatLng, destination: LatLng): Promise<number> {
      return new Promise((resolve) => {
        const service = new google.maps.DistanceMatrixService();
        service.getDistanceMatrix(
          {
            origins: [origin],
            destinations: [destination],
            travelMode: google.maps.TravelMode.DRIVING
          },
          (response) => {
            if (response?.rows?.[0]?.elements?.[0]?.distance?.value) {
              resolve(response.rows[0].elements[0].distance.value);
            } else {
              resolve(0);
            }
          }
        );
      });
    }
  }
  
  export const googleMapsService = GoogleMapsService.getInstance(); 