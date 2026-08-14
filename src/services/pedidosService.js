import { collection, addDoc, getDocs, getDoc, doc, query, orderBy, serverTimestamp, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { pedidoSchema } from '../schemas/pedidoSchema';

const COLLECTION = 'pedidos';

export async function crearPedido(pedido) {
  console.log('🔵 crearPedido - INICIANDO');
  console.log('📦 Pedido recibido:', JSON.stringify(pedido, null, 2));
  
  try {
    console.log('🔵 Validando con schema...');
    const datos = pedidoSchema.parse(pedido);
    console.log('✅ Validación OK');
    
    console.log('🔵 Guardando en Firestore...');
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...datos,
      creadoEn: serverTimestamp(),
    });
    console.log('✅ GUARDADO EXITOSO - ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ ERROR EN crearPedido:', error);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error message:', error.message);
    if (error.issues) {
      console.error('❌ Zod validation errors:', error.issues);
    }
    throw error;
  }
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
