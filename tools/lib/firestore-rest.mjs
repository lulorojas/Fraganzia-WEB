// Lectura de colecciones de Firestore para los scripts de build (sitemap,
// pre-render, imágenes, flyers).
//
// Por defecto va por REST con la API key web (la misma que va en el bundle), sin
// SDK ni credenciales. Pero con App Check "enforced" en Firestore, un pedido REST
// sin token es rechazado: por eso, si hay credencial de servicio disponible
// (ver credencial.mjs), se lee con firebase-admin,
// que no pasa por App Check. Sin credencial se sigue usando REST.
import { readFileSync, existsSync } from 'node:fs';
import { credencialOpcional } from './credencial.mjs';

export function leerEnv(nombre) {
  if (process.env[nombre]) return process.env[nombre];
  for (const archivo of ['.env.local', '.env']) {
    if (!existsSync(archivo)) continue;
    const linea = readFileSync(archivo, 'utf8')
      .split(/\r?\n/)
      .find((l) => l.startsWith(`${nombre}=`));
    if (linea) return linea.slice(nombre.length + 1).trim().replace(/^["']|["']$/g, '');
  }
  return undefined;
}

let adminDb; // undefined = sin probar; null = no hay credencial
async function admin() {
  if (adminDb !== undefined) return adminDb;
  const cred = credencialOpcional();
  if (!cred) return (adminDb = null);
  const { initializeApp, cert, getApps } = await import('firebase-admin/app');
  const { getFirestore } = await import('firebase-admin/firestore');
  // App con nombre propio: no choca con otros usos de firebase-admin en el mismo proceso.
  const app = getApps().find((a) => a.name === 'build-lectura') ?? initializeApp({ credential: cert(cred) }, 'build-lectura');
  return (adminDb = getFirestore(app));
}

// Misma forma que devuelve el REST: los timestamps como texto ISO.
function aPlano(valor) {
  if (valor && typeof valor.toDate === 'function') return valor.toDate().toISOString();
  if (Array.isArray(valor)) return valor.map(aPlano);
  if (valor && typeof valor === 'object') return Object.fromEntries(Object.entries(valor).map(([k, v]) => [k, aPlano(v)]));
  return valor;
}

function decodificar(valor) {
  if ('stringValue' in valor) return valor.stringValue;
  if ('integerValue' in valor) return Number(valor.integerValue);
  if ('doubleValue' in valor) return valor.doubleValue;
  if ('booleanValue' in valor) return valor.booleanValue;
  if ('timestampValue' in valor) return valor.timestampValue;
  if ('nullValue' in valor) return null;
  if ('arrayValue' in valor) return (valor.arrayValue.values ?? []).map(decodificar);
  if ('mapValue' in valor) return decodificarCampos(valor.mapValue.fields);
  return undefined;
}

function decodificarCampos(campos = {}) {
  return Object.fromEntries(Object.entries(campos).map(([k, v]) => [k, decodificar(v)]));
}

function config() {
  const apiKey = leerEnv('VITE_FIREBASE_API_KEY');
  const projectId = leerEnv('VITE_FIREBASE_PROJECT_ID') ?? 'fraganzia-e9b70';
  if (!apiKey) throw new Error('falta VITE_FIREBASE_API_KEY');
  return { apiKey, base: `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents` };
}

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

/** GET con reintentos (backoff) ante 429, errores 5xx y cortes de red
 * ("fetch failed", timeout): el REST público de Firestore a veces tira "rate
 * limit" temporal cuando varios scripts de build leen seguido, y en CI la red
 * falla de vez en cuando. Si tras todos los intentos sigue fallando, tira error. */
async function fetchConReintento(url, intentos = 6) {
  let ultimoError;
  for (let i = 0; i < intentos; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
      if (res.status !== 429 && res.status < 500) return res;
      ultimoError = new Error(`Firestore respondió ${res.status}`);
    } catch (err) {
      ultimoError = err;
    }
    if (i < intentos - 1) await esperar(3000 * (i + 1));
  }
  throw ultimoError;
}

/** Todos los documentos de una colección como objetos planos `{ id, ...campos }`. */
export async function listarColeccion(coleccion, { campos } = {}) {
  const db = await admin();
  if (db) {
    const consulta = campos ? db.collection(coleccion).select(...campos) : db.collection(coleccion);
    return (await consulta.get()).docs.map((d) => ({ id: d.id, ...aPlano(d.data()) }));
  }
  const { apiKey, base } = config();
  const mascara = campos ? campos.map((c) => `&mask.fieldPaths=${encodeURIComponent(c)}`).join('') : '';
  const docs = [];
  let pageToken = '';
  do {
    const url = `${base}/${coleccion}?pageSize=300${mascara}&key=${apiKey}${pageToken ? `&pageToken=${pageToken}` : ''}`;
    const res = await fetchConReintento(url);
    if (!res.ok) throw new Error(`Firestore respondió ${res.status} al leer ${coleccion}`);
    const data = await res.json();
    for (const doc of data.documents ?? []) {
      docs.push({ id: doc.name.split('/').pop(), ...decodificarCampos(doc.fields) });
    }
    pageToken = data.nextPageToken ?? '';
  } while (pageToken);
  return docs;
}

/** Un documento o null si no existe. */
export async function leerDocumento(ruta) {
  const db = await admin();
  if (db) {
    const doc = await db.doc(ruta).get();
    return doc.exists ? aPlano(doc.data()) : null;
  }
  const { apiKey, base } = config();
  const res = await fetchConReintento(`${base}/${ruta}?key=${apiKey}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Firestore respondió ${res.status} al leer ${ruta}`);
  return decodificarCampos((await res.json()).fields);
}
