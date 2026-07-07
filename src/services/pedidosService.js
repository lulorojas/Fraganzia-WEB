import { collection, addDoc, getDocs, getDoc, doc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { pedidoSchema } from '../schemas/pedidoSchema';

const COLLECTION = 'pedidos';

export async function crearPedido(pedido) {
  const datos = pedidoSchema.parse(pedido);
  const docRef = await addDoc(collection(db, COLLECTION), {
    ...datos,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function listarPedidos() {
  const snap = await getDocs(query(collection(db, COLLECTION), orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function obtenerPedidoPorId(id) {
  const snap = await getDoc(doc(db, COLLECTION, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}
