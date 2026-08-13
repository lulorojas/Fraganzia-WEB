import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

const COLLECTION = 'socios';

export async function listarSocios() {
  const snap = await getDocs(collection(db, COLLECTION));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
