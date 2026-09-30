import { collection, addDoc, getDocs, getDoc, doc, query, orderBy, serverTimestamp, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { pedidoSchema } from '../schemas/pedidoSchema';

const COLLECTION = 'pedidos';

export async function crearPedido(pedido) {
  const datos = pedidoSchema.parse(pedido);
  const docRef = await addDoc(collection(db, COLLECTION), {
    ...datos,
    creadoEn: serverTimestamp(),
  });
  return docRef.id;
}

export async function listarPedidos() {
  const snap = await getDocs(query(collection(db, COLLECTION), orderBy('creadoEn', 'desc')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function obtenerPedidoPorId(id) {
  const snap = await getDoc(doc(db, COLLECTION, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function actualizarEstadoPedido(id, estado) {
  await updateDoc(doc(db, COLLECTION, id), { estado });
}

export async function eliminarPedido(id) {
  await deleteDoc(doc(db, COLLECTION, id));
}
