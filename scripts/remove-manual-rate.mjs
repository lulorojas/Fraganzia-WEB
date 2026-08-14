import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const sa = require('./serviceAccount.json');

initializeApp({ credential: cert(sa) });
const db = getFirestore();

await db.doc('config/general').update({ dolarBlueManual: FieldValue.delete() });
console.log('OK: dolarBlueManual eliminado — la app usará la API en vivo');
process.exit(0);
