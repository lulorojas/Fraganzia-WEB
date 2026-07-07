import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

const CONFIG_DOC_ID = 'general';

export async function obtenerConfig() {
  const snap = await getDoc(doc(db, 'config', CONFIG_DOC_ID));
  return snap.exists() ? snap.data() : null;
}

export async function actualizarConfig(datos) {
  await setDoc(
    doc(db, 'config', CONFIG_DOC_ID),
    { ...datos, updatedAt: serverTimestamp() },
    { merge: true }
  );
}
