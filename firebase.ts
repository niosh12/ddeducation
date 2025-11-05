
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration from the prompt
const firebaseConfig = {
  apiKey: "AIzaSyB6ZZmfFUVJNYjhS1yDCJtCoO3u2lijEJs",
  authDomain: "ddeducationnios.firebaseapp.com",
  projectId: "ddeducationnios",
  storageBucket: "ddeducationnios.firebasestorage.app",
  messagingSenderId: "495117354751",
  appId: "1:495117354751:web:ba886f38f6230844882eca",
  measurementId: "G-TQ8WW0M5E8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
