import { ref as dbRef, get } from 'firebase/database';
import { Database } from 'firebase/database';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { Permissions } from '@capacitor/permissions';

// Define the structure of employee data
interface Employee {
    uid: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    company: string;
    permissions?: string[];
    role: string;
}

// Example function that retrieves employee data
export const getEmployeeData = async (db: Database): Promise<Employee[]> => {
    const employeesRef = dbRef(db, 'employees');
    const snapshot = await get(employeesRef);
    
    if (snapshot.exists()) {
        const employees: Record<string, Employee> = snapshot.val(); // Cast to Record<string, Employee>
        return Object.values(employees); // Return as an array of Employee
    }
    return [];
};

// Function to get user permissions based on their role
export const getUserPermissions = async (db: Database, user: Employee): Promise<string[]> => {
    if (!user || !user.role) return [];
    
    const rolePermissionsRef = dbRef(db, `role_permissions/${user.role}`);
    const snapshot = await get(rolePermissionsRef);
    
    if (snapshot.exists()) {
        return snapshot.val(); // Assuming this returns an array of permission strings
    }
    
    return [];
};

export const validateEmployeeCredentials = async (
  email: string,
  password: string,
  db: Database
): Promise<{ success: boolean; error?: string; employee?: Employee }> => {
  try {
    console.log('validateEmployeeCredentials: Starting validation for email:', email);
    
    if (!email || !password) {
      console.log('validateEmployeeCredentials: Missing email or password');
      return { 
        success: false, 
        error: 'Email and password are required' 
      };
    }

    const employees = await getEmployeeData(db);
    console.log('validateEmployeeCredentials: Retrieved employees:', employees.length);
    
    const employee = employees.find(emp => emp.email === email && emp.password === password);
    console.log('validateEmployeeCredentials: Found employee:', employee ? 'Yes' : 'No');
    
    if (employee) {
      console.log('validateEmployeeCredentials: Employee found, storing in localStorage');
      
      // Store employee data in localStorage
      const userData = {
        uid: employee.uid,
        email: employee.email,
        firstName: employee.firstName,
        lastName: employee.lastName,
        company: employee.company,
        companyId: employee.company,
        role: employee.role,
        permissions: employee.permissions || [],
        isVerified: true
      };
      
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('currentUser', JSON.stringify(userData));
      
      console.log('validateEmployeeCredentials: Stored user data:', userData);

      return { success: true, employee };
    }
    
    console.log('validateEmployeeCredentials: No matching employee found');
    return { 
      success: false, 
      error: 'Invalid email or password' 
    };
  } catch (error) {
    console.error('Error during employee validation:', error);
    return { 
      success: false, 
      error: 'Login failed. Please try again.' 
    };
  }
}; 

export class LocationService {
  static async requestLocationPermission(): Promise<boolean> {
    try {
      if (Capacitor.isNativePlatform()) {
        // For mobile devices, use Capacitor permissions
        const permission = await Permissions.query({ name: 'geolocation' });
        
        if (permission.state === 'granted') {
          return true;
        } else if (permission.state === 'prompt') {
          const result = await Geolocation.requestPermissions();
          return result.location === 'granted';
        } else {
          // Permission denied, show instructions
          console.warn('Location permission denied. User needs to enable it in device settings.');
          return false;
        }
      } else {
        // For web browsers
        return new Promise((resolve) => {
          navigator.permissions.query({ name: 'geolocation' }).then((result) => {
            if (result.state === 'granted') {
              resolve(true);
            } else if (result.state === 'prompt') {
              navigator.geolocation.getCurrentPosition(
                () => resolve(true),
                () => resolve(false)
              );
            } else {
              resolve(false);
            }
          });
        });
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    }
  }

  static async getCurrentPosition(): Promise<{ lat: number; lng: number } | null> {
    try {
      if (Capacitor.isNativePlatform()) {
        // Use Capacitor Geolocation for better mobile performance
        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 15000
        });
        
        return {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
      } else {
        // Fallback to web geolocation
        return new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              resolve({
                lat: position.coords.latitude,
                lng: position.coords.longitude
              });
            },
            () => resolve(null),
            {
              enableHighAccuracy: true,
              timeout: 15000,
              maximumAge: 1000
            }
          );
        });
      }
    } catch (error) {
      console.error('Error getting current position:', error);
      return null;
    }
  }

  static async watchPosition(
    callback: (position: { lat: number; lng: number }) => void,
    errorCallback?: (error: any) => void
  ): Promise<string | null> {
    try {
      if (Capacitor.isNativePlatform()) {
        // Use Capacitor Geolocation for better mobile performance
        const watchId = await Geolocation.watchPosition(
          {
            enableHighAccuracy: true,
            timeout: 15000
          },
          (position) => {
            callback({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
          }
        );
        
        return watchId;
      } else {
        // Fallback to web geolocation
        const watchId = navigator.geolocation.watchPosition(
          (position) => {
            callback({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
          },
          errorCallback,
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 1000
          }
        );
        
        return watchId.toString();
      }
    } catch (error) {
      console.error('Error watching position:', error);
      if (errorCallback) errorCallback(error);
      return null;
    }
  }

  static async clearWatch(watchId: string): Promise<void> {
    try {
      if (Capacitor.isNativePlatform()) {
        await Geolocation.clearWatch({ id: watchId });
      } else {
        navigator.geolocation.clearWatch(parseInt(watchId));
      }
    } catch (error) {
      console.error('Error clearing watch:', error);
    }
  }
} 