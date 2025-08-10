// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,,
  authDomain: "agileflow-mlf18.firebaseapp.com",
  projectId: "agileflow-mlf18",
  storageBucket: "agileflow-mlf18.firebasestorage.app",
  messagingSenderId: "503172782024",
  appId: "1:503172782024:web:fac88a2658db33dc8512fd"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and Firestore
const auth = getAuth(app);
const db = getFirestore(app);

// Export the initialized services
export { auth, db };