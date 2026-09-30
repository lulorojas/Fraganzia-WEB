// Lectura de colecciones públicas de Firestore por REST, sin SDK ni
// credenciales de servicio: solo la API key web (la misma que va en el bundle).
// Lo usan los scripts de build (sitemap, pre-render).
import { readFileSync, existsSync } from 'node:fs';

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

/** Todos los documentos de una colección como objetos planos `{ id, ...campos }`. */
export async function listarColeccion(coleccion, { campos } = {}) {
  const { apiKey, base } = config();
  const mascara = campos ? campos.map((c) => `&mask.fieldPaths=${encodeURIComponent(c)}`).join('') : '';
  const docs = [];
  let pageToken = '';
  do {
    const url = `${base}/${coleccion}?pageSize=300${mascara}&key=${apiKey}${pageToken ? `&pageToken=${pageToken}` : ''}`;
    const res = await fetch(url);
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
  const { apiKey, base } = config();
  const res = await fetch(`${base}/${ruta}?key=${apiKey}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Firestore respondió ${res.status} al leer ${ruta}`);
  return decodificarCampos((await res.json()).fields);
}
