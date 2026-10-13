import { doc, getDoc } from 'firebase/firestore/lite';
import { db } from './config';

/** ¿Existe el documento /admins/{uid}? (así se define quién es admin; ver firestore.rules) */
export async function esAdmin(uid) {
  const snap = await getDoc(doc(db, 'admins', uid));
  return snap.exists();
}
