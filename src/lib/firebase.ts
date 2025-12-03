import { initializeApp, FirebaseApp } from "firebase/app";
import { getMessaging, getToken, onMessage, Messaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBZtR1gWq_i2U5kioMaV5Bnp_UUD9o-uqQ",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "auren-c779f.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "auren-c779f",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "auren-c779f.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "613768445838",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:613768445838:web:f4cf52f61e1968f348aedf"
};

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || 'BL7G0G1tn5Z9kPfdovAfnneMuHm_Ba0yVSCRbN4LLx180Q9X-_flTqi2yhC6UrFxPCCRvf8lOuOwipAXmxhNeJw';

const app: FirebaseApp = initializeApp(firebaseConfig);

let messaging: Messaging | null = null;

try {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    messaging = getMessaging(app);
  }
} catch (error) {
  if (import.meta.env.DEV) {
    console.error('Firebase messaging initialization error:', error);
  }
}

export { app, messaging };

export const requestNotificationPermission = async (): Promise<string | null> => {
  try {
    if (!messaging) {
      if (import.meta.env.DEV) {
        console.warn('Firebase messaging not available');
      }
      return null;
    }

    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY
      });
      
      return token;
    } else {
      return null;
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Error getting notification permission:', error);
    }
    return null;
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    if (!messaging) {
      resolve(null);
      return;
    }
    
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });
