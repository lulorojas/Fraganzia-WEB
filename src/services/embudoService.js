import { collection, doc, getDocs, setDoc, increment, serverTimestamp, query, orderBy, limit } from 'firebase/firestore/lite';
import { db } from '../firebase/config';
import { yaRegistradoEnSesion } from '../utils/sesion';

const COLLECTION = 'embudo';

/**
 * Embudo de compra por día y por fuente (Instagram, directo, etc.): cuántas
 * sesiones llegaron a cada paso. Un documento por día + fuente
 * (`2026-10-13_ig`) con contadores que suben de a 1, escritos desde el
 * navegador (sin backend, como `estadisticas`). Cada paso cuenta una vez por
 * sesión. Anónimo: no se guarda nada de la persona.
 */
export const PASOS = ['sesiones', 'catalogo', 'ficha', 'carrito', 'checkout', 'pedidos'];

const fuenteDeLaSesion = () => {
  try {
    return sessionStorage.getItem('fuente') || 'directo';
  } catch {
    return 'directo';
  }
};

/** Guarda la fuente de la sesión la primera vez (la usan visitas y embudo). */
export function recordarFuente(fuente) {
  try {
    if (!sessionStorage.getItem('fuente')) sessionStorage.setItem('fuente', fuente);
  } catch {
    // sin storage: se usa "directo"
  }
}

// Fire-and-forget: la analítica nunca rompe la experiencia de compra.
export function registrarPaso(paso) {
  try {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') return Promise.resolve();
    const ua = navigator.userAgent || '';
    if (navigator.webdriver || /bot|crawl|spider|headless|lighthouse/i.test(ua)) return Promise.resolve();
    if (!PASOS.includes(paso) || yaRegistradoEnSesion(`embudo:${paso}`)) return Promise.resolve();

    const fuente = fuenteDeLaSesion().replace(/[^a-z0-9._-]/gi, '').slice(0, 40) || 'directo';
    const fecha = new Date().toISOString().slice(0, 10);
    return setDoc(
      doc(db, COLLECTION, `${fecha}_${fuente}`),
      { fecha, fuente, [paso]: increment(1), updatedAt: serverTimestamp() },
      { merge: true }
    ).catch(() => {});
  } catch {
    return Promise.resolve();
  }
}

// ─── Admin ───────────────────────────────────────────────────────────────────

export async function listarEmbudo(max = 400) {
  const snap = await getDocs(query(collection(db, COLLECTION), orderBy('fecha', 'desc'), limit(max)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
