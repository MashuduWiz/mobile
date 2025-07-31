import { ref, onMounted } from 'vue';
import { useRouter, Router, RouteLocationNormalized, NavigationGuardNext } from 'vue-router';
import { auth } from '../firebase/config';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { getDatabase, ref as dbRef, get } from 'firebase/database';

interface UserData {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  company: string;
  companyId: string;
  role: string;
  permissions: string[];
  isVerified: boolean;
}

// Create a reactive user state
const currentUser = ref<User | null>(null);
const isAuthenticated = ref(false);
const userData = ref<UserData | null>(null);

// Initialize the auth state
export const initAuth = () => {
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    currentUser.value = user;
    
    // Check localStorage first for employee login
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        isAuthenticated.value = true;
        userData.value = userData;
        return;
      } catch (error) {
        console.error('Error parsing stored user data:', error);
      }
    }
    
    // If no stored user, check Firebase auth
    if (user) {
      try {
        // Get user data from database
        const db = getDatabase();
        const userRef = dbRef(db, `user/${user.uid}`);
        const snapshot = await get(userRef);
        
        if (snapshot.exists()) {
          const data = snapshot.val();
          userData.value = {
            uid: user.uid,
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            company: data.company,
            companyId: data.company,
            role: data.role || 'USER',
            permissions: data.permissions || [],
            isVerified: data.isVerified || false
          };
          
          // Store in localStorage
          localStorage.setItem('isAuthenticated', 'true');
          localStorage.setItem('currentUser', JSON.stringify(userData.value));
          isAuthenticated.value = true;
        } else {
          // If no user data in database, clear everything
          await handleSignOut();
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        await handleSignOut();
      }
    } else {
      await handleSignOut();
    }
  });

  return unsubscribe;
};

// Helper function to handle auth failures (commented out as it's not currently used)
// const handleAuthFailure = () => {
//   currentUser.value = null;
//   isAuthenticated.value = false;
//   localStorage.removeItem('isAuthenticated');
//   localStorage.removeItem('currentUser');
// };

// Handle sign out
const handleSignOut = async () => {
  try {
    await signOut(auth);
    userData.value = null;
    currentUser.value = null;
    isAuthenticated.value = false;
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('currentUser');
    sessionStorage.clear();
  } catch (error) {
    console.error('Sign out error:', error);
  }
};

// Get current user data - Always fetch fresh from localStorage
export const getUserData = () => {
  console.log('getUserData: Checking for user data...');
  
  // First check if we have it in memory
  if (userData.value) {
    console.log('getUserData: Returning cached user data:', userData.value);
    return userData.value;
  }
  
  // Check localStorage
  const storedData = localStorage.getItem('currentUser');
  const isAuthenticated = localStorage.getItem('isAuthenticated');
  console.log('getUserData: Stored data from localStorage:', storedData);
  console.log('getUserData: isAuthenticated from localStorage:', isAuthenticated);
  
  if (storedData && isAuthenticated === 'true') {
    try {
      const parsedData = JSON.parse(storedData);
      
      // Validate that the parsed data has required fields
      if (parsedData && parsedData.email && (parsedData.uid || parsedData.email)) {
        userData.value = parsedData;
        console.log('getUserData: Successfully parsed and set user data:', parsedData);
        return userData.value;
      } else {
        console.error('getUserData: Invalid user data structure:', parsedData);
        // Clear invalid data
        localStorage.removeItem('currentUser');
        localStorage.removeItem('isAuthenticated');
        return null;
      }
    } catch (error) {
      console.error('Error parsing stored user data:', error);
      // Clear corrupted data
      localStorage.removeItem('currentUser');
      localStorage.removeItem('isAuthenticated');
      return null;
    }
  }
  
  console.log('getUserData: No valid user data found');
  return null;
};

// Check if user is authenticated
export const checkAuth = () => {
  const storedAuth = localStorage.getItem('isAuthenticated');
  const storedUser = localStorage.getItem('currentUser');
  const isAuth = storedAuth === 'true' && storedUser !== null;
  
  console.log('checkAuth: Authentication check:', {
    storedAuth,
    hasStoredUser: !!storedUser,
    isAuthenticated: isAuth
  });
  
  return isAuth;
};

// Refresh authentication state - useful after app resume
export const refreshAuthState = () => {
  console.log('refreshAuthState: Refreshing authentication state...');
  
  // Clear in-memory state
  userData.value = null;
  isAuthenticated.value = false;
  
  // Re-check localStorage
  const storedAuth = localStorage.getItem('isAuthenticated');
  const storedUser = localStorage.getItem('currentUser');
  
  if (storedAuth === 'true' && storedUser) {
    try {
      const parsedData = JSON.parse(storedUser);
      if (parsedData && parsedData.email && (parsedData.uid || parsedData.email)) {
        userData.value = parsedData;
        isAuthenticated.value = true;
        console.log('refreshAuthState: Successfully refreshed auth state');
        return true;
      }
    } catch (error) {
      console.error('refreshAuthState: Error parsing stored user data:', error);
    }
  }
  
  // Clear invalid data
  localStorage.removeItem('currentUser');
  localStorage.removeItem('isAuthenticated');
  isAuthenticated.value = false;
  userData.value = null;
  
  console.log('refreshAuthState: Authentication state cleared');
  return false;
};

// Sign out function
export const signOutUser = handleSignOut;

// Navigation guard for protected routes
export function setupAuthGuard(router: Router) {
  router.beforeEach(async (to: RouteLocationNormalized, _from: RouteLocationNormalized, next: NavigationGuardNext) => {
    console.log('Auth guard checking route:', to.path);
    
    // Public routes that don't require authentication
    const publicRoutes = ['/home', '/login', '/forgot-password'];
    
    if (publicRoutes.includes(to.path)) {
      console.log(`Allowing access to public route: ${to.path}`);
      return next();
    }
    
    const isAuth = checkAuth();
    console.log('Is authenticated:', isAuth);
    
    if (!isAuth && !publicRoutes.includes(to.path)) {
      console.log(`Redirecting unauthenticated user from ${to.path} to /login`);
      return next('/login');
    }

    // Special handling for delivery completion route
    if (to.name === 'delivery-completion') {
      console.log('Delivery completion route detected');
      if (!to.params.deliveryId || !to.params.waybillNumber) {
        console.log('Missing required parameters, redirecting to delivery list');
        return next('/delivery-list');
      }
    }
    
    console.log(`Proceeding to ${to.path}`);
    next();
  });
}

// Composable for components that need auth state
export const useAuth = () => {
  const router = useRouter();
  
  onMounted(() => {
    if (!checkAuth()) {
      router.push('/login');
    }
  });
  
  return {
    currentUser,
    isAuthenticated,
    getUserData,
    signOutUser
  };
};