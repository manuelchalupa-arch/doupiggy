// firebase/firebaseConfig.js
// Inicialización central de Firebase. Toda la app importa `db`, `auth` y `functions`
// desde este único módulo para evitar múltiples instancias.

import { initializeApp } from "firebase/app";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  CACHE_SIZE_UNLIMITED,
} from "firebase/firestore";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";

// Las variables se inyectan vía entorno (local: archivo .env / .env.local;
// en Netlify: Site settings > Environment variables). Nunca hardcodear
// credenciales en el repositorio. Con Vite, las variables expuestas al
// cliente deben empezar con el prefijo VITE_.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

// --- Firestore offline-first ---
// persistentLocalCache habilita IndexedDB como caché local persistente.
// persistentMultipleTabManager permite mantener la sincronización si el usuario
// tiene la app abierta en varias pestañas simultáneamente.
//
// En Safari modo privado (o con Smart Tracking Prevention agresivo) IndexedDB
// puede estar bloqueado o ser volátil y initializeFirestore con caché persistente
// lanza una excepción al arrancar. Se intenta la caché persistente y, si no
// arranca, se cae a caché en memoria (la app sigue funcionando normalmente).
export const db = (() => {
  try {
    return initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
        cacheSizeBytes: CACHE_SIZE_UNLIMITED,
      }),
    });
  } catch (error) {
    console.warn("IndexedDB no disponible (modo privado/Safari?). Uso caché en memoria:", error);
    return initializeFirestore(app);
  }
})();

// --- Auth ---
export const auth = getAuth(app);

// Persistencia local: la sesión (incluida la anónima) sobrevive a cierres de pestaña/navegador.
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("No se pudo establecer la persistencia de auth:", error);
});

export default app;
