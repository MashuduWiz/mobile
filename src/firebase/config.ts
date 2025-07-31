import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getDatabase, ref, set, get, child, onValue } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyCZ1_TOsrKMDvSgaee2JIBZsOD_Le29pbs",
  authDomain: "inventoryplatform-66aa5.firebaseapp.com",
  databaseURL: "https://inventoryplatform-66aa5-default-rtdb.firebaseio.com",
  projectId: "inventoryplatform-66aa5",
  storageBucket: "inventoryplatform-66aa5.appspot.com",
  messagingSenderId: "264173436393",
  appId: "1:264173436393:web:8a52d71fee9590efc85f78",
  measurementId: "G-BH4XHD7437"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);

// Function to write data to the database
export const writeData = async (path: string, data: any) => {
    try {
        await set(ref(db, path), data);
        console.log('Data written successfully!');
    } catch (error) {
        console.error('Error writing data:', error);
    }
};

// Function to read data from the database
export const readData = async (path: string) => {
    const dbRef = ref(db);
    try {
        const snapshot = await get(child(dbRef, path));
        if (snapshot.exists()) {
            console.log('Data retrieved:', snapshot.val());
            return snapshot.val();
        } else {
            console.log('No data available');
        }
    } catch (error) {
        console.error('Error reading data:', error);
    }
};

// Function to listen for real-time updates
export const listenForUpdates = (path: string, callback: (data: any) => void) => {
    const dbRef = ref(db, path);
    onValue(dbRef, (snapshot) => {
        const data = snapshot.val();
        callback(data);
    });
};

const loginUser = async (email: string, password: string) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Fetch user details from the database
        const userRef = ref(db, `user/${user.uid}`);
        const userSnapshot = await get(userRef);

        if (userSnapshot.exists()) {
            const userData = userSnapshot.val();
            // Ensure the user data is correctly structured
            const currentUser = {
                uid: user.uid,
                email: userData.email,
                firstName: userData.firstName || '', // Default to empty string if null
                lastName: userData.lastName || '', // Default to empty string if null
                company: userData.company || '', // Default to empty string if null
                role: userData.role || 'USER', // Default to 'USER' if null
                permissions: userData.permissions || [], // Default to empty array if null
                isVerified: userData.isVerified || false // Default to false if null
            };

            // Store user session data
            localStorage.setItem('isAuthenticated', 'true');
            localStorage.setItem('currentUser', JSON.stringify(currentUser));

            // Redirect to dashboard or appropriate page
            console.log('User logged in successfully:', currentUser);
        } else {
            console.error('User does not exist in the database');
        }
    } catch (error) {
        console.error('Error logging in user:', error);
        // Handle error (e.g., show error message)
    }
};

export { loginUser };

export default app; 