export interface Stop {
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