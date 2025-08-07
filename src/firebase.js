// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getInstallations } from "firebase/installations"; // Import Installations SDK
import { getStorage } from "firebase/storage"; // Import Storage SDK
import { getMessaging } from "firebase/messaging"; // Import Cloud Messaging SDK
import { getRemoteConfig } from "firebase/remote-config"; // Import Remote Config SDKimport { getInstallations } from "firebase/installations"; // Import Installations SDK
import { getAuth } from "firebase/auth"; // Import Authentication SDK

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyASpq9jPniTZ57woD0_7imptyJqwiP_JRc",
  authDomain: "agileflow-mlf18.firebaseapp.com",
  projectId: "agileflow-mlf18",
  storageBucket: "agileflow-mlf18.firebasestorage.app",
  messagingSenderId: "503172782024",
  appId: "1:503172782024:web:fac88a2658db33dc8512fd"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Storage and get a reference to the service
const storage = getStorage(app);

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);

// Initialize Firebase Cloud Messaging and get a reference to the service
const messaging = getMessaging(app);

// Initialize Firebase Installations and get a reference to the service
const installations = getInstallations(app);

// Initialize Firebase Remote Config and get a reference to the service
const remoteConfig = getRemoteConfig(app);

export { app, storage, auth, messaging, remoteConfig };