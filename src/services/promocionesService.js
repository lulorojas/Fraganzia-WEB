import {
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';

const COLLECTION = 'promociones';

export async function listarPromocionesActivas() {
  const snap = await getDocs(
    query(collection(db, COLLECTION), where('activa', '==', true), orderBy('orden', 'asc'))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function listarTodasLasPromociones() {
  const snap = await getDocs(collection(db, COLLECTION));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
}

export async function crearPromocion(datos) {
  const ref = await addDoc(collection(db, COLLECTION), {
    ...datos,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function editarPromocion(id, datos) {
  await updateDoc(doc(db, COLLECTION, id), datos);
}

export async function eliminarPromocion(id) {
  await deleteDoc(doc(db, COLLECTION, id));
}
