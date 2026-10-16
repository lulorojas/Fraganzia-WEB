import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore/lite';
import { activarAppCheck } from '@app-check';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);

// App Check (reCAPTCHA v3): solo se activa si hay site key configurada. Con el
// enforcement prendido en la consola, Firestore rechaza pedidos que no vengan
// de esta web (bots, scripts). Costo: carga el script de reCAPTCHA en cada
// visita, lo que resta algo de puntaje en PageSpeed. Ver README.
// Se inicializa antes de getFirestore() para que ninguna lectura salga sin token.
activarAppCheck(app);

export const db = getFirestore(app);
