import { initializeAuth, indexedDBLocalPersistence, browserLocalPersistence } from 'firebase/auth';
import { app } from './config';

// Aparte de config.js a propósito: el SDK de Auth es de lo más pesado de Firebase
// y casi nadie inicia sesión en la tienda. Solo se descarga al entrar al panel,
// al login o si el navegador ya tenía una sesión (ver AuthContext).
//
// initializeAuth en vez de getAuth: getAuth incluye el soporte de login con
// popup/redirect, que descarga un iframe de Google (gapi) en cada visita.
// Acá solo se usa email + contraseña, así que no hace falta.
export const auth = initializeAuth(app, {
  persistence: [indexedDBLocalPersistence, browserLocalPersistence],
});

// Se reexporta por nombre (en vez de importar 'firebase/auth' entero con import()
// dinámico) para que el empaquetador pueda descartar lo que no se usa.
export { onAuthStateChanged } from 'firebase/auth';
