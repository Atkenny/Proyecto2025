// Importa las funciones necesarias
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  enableIndexedDbPersistence,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Configuración de Firebase usando variables de entorno
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Inicializa Firebase
const appfirebase = initializeApp(firebaseConfig);

// Inicializa Storage
const storage = getStorage(appfirebase);

// Inicializa Auth
const auth = getAuth(appfirebase);

// Inicializa Firestore con persistencia local
let db;
try {
  db = initializeFirestore(appfirebase, {
    localCache: persistentLocalCache({
      cacheSizeBytes: 100 * 1024 * 1024, // 100 MB
    }),
  });
  console.log("Firestore inicializado con persistencia local (IndexedDB).");
} catch (error) {
  console.error("Error al inicializar Firestore con persistencia:", error);
  // Fallback para navegadores que no soportan initializeFirestore
  db = getFirestore(appfirebase);
}

// También intentar habilitar manualmente la persistencia
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === "failed-precondition") {
    console.warn("La persistencia solo está disponible en una pestaña a la vez.");
  } else if (err.code === "unimplemented") {
    console.warn("El navegador no soporta persistencia offline.");
  }
});

export { appfirebase, db, auth, storage };
