// Credencial de servicio de Firebase (llave de administrador de Firestore) para
// los scripts de tools/. Da acceso total a la base: no debe vivir en una carpeta
// que se sincronice a la nube (OneDrive) ni subirse a git.
//
// Orden de búsqueda:
//   1. FIREBASE_SERVICE_ACCOUNT (el JSON completo; así lo usa GitHub Actions)
//   2. FIREBASE_SERVICE_ACCOUNT_FILE (ruta al archivo)
//   3. <carpeta del usuario>/.fraganzia/serviceAccount.json (fuera de OneDrive)
//   4. C:/credenciales/fraganzia-serviceAccount.json
//   5. tools/serviceAccount.json (lugar histórico, dentro del repo: evitarlo)
import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

function rutasPosibles() {
  return [
    process.env.FIREBASE_SERVICE_ACCOUNT_FILE,
    join(homedir(), '.fraganzia', 'serviceAccount.json'),
    'C:/credenciales/fraganzia-serviceAccount.json',
    join(RAIZ, 'tools', 'serviceAccount.json'),
  ].filter(Boolean);
}

/** La credencial o null si no hay ninguna disponible. */
export function credencialOpcional() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  const ruta = rutasPosibles().find((r) => existsSync(r));
  return ruta ? JSON.parse(readFileSync(ruta, 'utf8')) : null;
}

/** La credencial o un error que explica dónde buscarla. */
export function credencial() {
  const c = credencialOpcional();
  if (!c) {
    throw new Error(`falta la credencial de Firebase: definí FIREBASE_SERVICE_ACCOUNT o guardala en ${rutasPosibles().slice(1, 3).join(' o ')}`);
  }
  return c;
}
