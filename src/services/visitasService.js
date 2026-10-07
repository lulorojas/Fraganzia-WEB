import {
  collection, doc, setDoc, getDocs, query, orderBy, limit, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { yaRegistradoEnSesion } from '../utils/sesion';

const COLLECTION = 'visitas';
const MAX_VISITAS = 500;

// Fuente de la visita: parámetro utm_source o dominio de origen. Se guarda
// solo el dominio (nunca la URL completa) para no arrastrar datos personales.
function detectarFuente() {
  const utm = new URLSearchParams(window.location.search).get('utm_source');
  if (utm) return utm.toLowerCase().slice(0, 40);
  try {
    if (!document.referrer) return 'directo';
    const host = new URL(document.referrer).hostname.replace(/^www\./, '');
    if (host === window.location.hostname) return 'directo';
    return host.slice(0, 60);
  } catch {
    return 'directo';
  }
}

function detectarDispositivo(ua) {
  if (/ipad|tablet/i.test(ua)) return 'tablet';
  if (/mobi|android|iphone/i.test(ua)) return 'móvil';
  return 'escritorio';
}

function detectarNavegador(ua) {
  if (/edg\//i.test(ua)) return 'Edge';
  if (/opr\/|opera/i.test(ua)) return 'Opera';
  if (/instagram/i.test(ua)) return 'Instagram';
  if (/fban|fbav/i.test(ua)) return 'Facebook';
  if (/chrome|crios/i.test(ua)) return 'Chrome';
  if (/firefox|fxios/i.test(ua)) return 'Firefox';
  if (/safari/i.test(ua)) return 'Safari';
  return 'Otro';
}

function detectarSO(ua) {
  if (/android/i.test(ua)) return 'Android';
  if (/iphone|ipad|ios/i.test(ua)) return 'iOS';
  if (/windows/i.test(ua)) return 'Windows';
  if (/mac os/i.test(ua)) return 'macOS';
  if (/linux/i.test(ua)) return 'Linux';
  return 'Otro';
}

/**
 * Registra una visita anónima por sesión del navegador (1 escritura, 0 lecturas).
 * No identifica a nadie: guarda página de entrada, fuente, dispositivo y
 * navegador. Fire-and-forget: la analítica nunca rompe la experiencia.
 */
export function registrarVisita() {
  try {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') return Promise.resolve();
    const ua = navigator.userAgent || '';
    if (navigator.webdriver || /bot|crawl|spider|headless|lighthouse/i.test(ua)) return Promise.resolve();
    if (yaRegistradoEnSesion('visita')) return Promise.resolve();

    const id = crypto.randomUUID();
    return setDoc(doc(db, COLLECTION, id), {
      ruta: window.location.pathname.slice(0, 120),
      fuente: detectarFuente(),
      dispositivo: detectarDispositivo(ua),
      navegador: detectarNavegador(ua),
      so: detectarSO(ua),
      idioma: (navigator.language || '').slice(0, 10),
      createdAt: serverTimestamp(),
    }).catch(() => {});
  } catch {
    return Promise.resolve();
  }
}

// ─── Admin ───────────────────────────────────────────────────────────────────

export async function listarVisitas() {
  const snap = await getDocs(query(collection(db, COLLECTION), orderBy('createdAt', 'desc'), limit(MAX_VISITAS)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
