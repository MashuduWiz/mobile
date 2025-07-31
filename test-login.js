// Test script to add a test user to Firebase database
// Run this script once to create a test user for login

import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set } from 'firebase/database';

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
const db = getDatabase(app);

// Test user data
const testUser = {
  email: "test@example.com",
  firstName: "Test",
  lastName: "User",
  company: "Test Company",
  role: "ADMIN",
  permissions: ["read", "write", "delete"],
  isVerified: true
};

// Test employee data
const testEmployee = {
  uid: "test-employee-001",
  email: "employee@example.com",
  password: "password123",
  firstName: "John",
  lastName: "Doe",
  company: "Test Company",
  role: "EMPLOYEE",
  permissions: ["read", "scan"]
};

async function createTestUsers() {
  try {
    // Create test user in user table
    await set(ref(db, 'user/test-user-001'), testUser);
    console.log('✅ Test user created successfully');
    
    // Create test employee in employees table
    await set(ref(db, 'employees/test-employee-001'), testEmployee);
    console.log('✅ Test employee created successfully');
    
    console.log('\n📋 Test Credentials:');
    console.log('Manager/Admin Login:');
    console.log('  Email: test@example.com');
    console.log('  Password: (you need to create this user in Firebase Auth)');
    console.log('\nEmployee Login:');
    console.log('  Email: employee@example.com');
    console.log('  Password: password123');
    
  } catch (error) {
    console.error('❌ Error creating test users:', error);
  }
}

createTestUsers(); 