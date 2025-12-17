// ⚠️ CONFIGURAZIONE FIREBASE
// Sostituisci questi valori con quelli del tuo progetto Firebase
// Li trovi in: Firebase Console > Impostazioni Progetto > Le tue app

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyD3sB4GmmbFvVjUKsa6c0TxEItHU7lvE4M",
  authDomain: "mymusic-pwa.firebaseapp.com",
  projectId: "mymusic-pwa",
  storageBucket: "mymusic-pwa.firebasestorage.app",
  messagingSenderId: "359509559806",
  appId: "1:359509559806:web:57090127f1eda6e0ce98af"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// ⚠️ IMPORTANTE: Non committare questo file con le tue credenziali reali!
// Aggiungi firebase-config.js al .gitignore se necessario
