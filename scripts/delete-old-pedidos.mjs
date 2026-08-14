import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDVaBH9oq9BrFWZN_q_1R4wO9xREWy2phs",
  authDomain: "fraganzia-e9b70.firebaseapp.com",
  projectId: "fraganzia-e9b70",
  storageBucket: "fraganzia-e9b70.firebasestorage.app",
  messagingSenderId: "612943881334",
  appId: "1:612943881334:web:a42a3bbde8f9bdbe36bdd5"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function deleteOldPedidos() {
  console.log('🔍 Buscando pedidos viejos con createdAt...\n');
  
  const pedidosRef = collection(db, 'pedidos');
  const snapshot = await getDocs(pedidosRef);
  
  let deletedCount = 0;
  let keptCount = 0;
  
  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    
    // Si tiene createdAt (viejo) pero NO tiene creadoEn (nuevo), borrar
    if (data.createdAt && !data.creadoEn) {
      console.log(`❌ Borrando pedido viejo: ${docSnap.id}`);
      console.log(`   Cliente: ${data.clienteNombre || 'Sin nombre'}`);
      console.log(`   Total: $${data.totalARS || 0}`);
      console.log(`   Fecha: ${data.createdAt?.toDate?.() || 'N/A'}\n`);
      
      await deleteDoc(doc(db, 'pedidos', docSnap.id));
      deletedCount++;
    } else if (data.creadoEn) {
      console.log(`✅ Pedido nuevo OK: ${docSnap.id} (con creadoEn)`);
      keptCount++;
    } else {
      console.log(`⚠️  Pedido raro: ${docSnap.id} (no tiene ni createdAt ni creadoEn)`);
    }
  }
  
  console.log('\n📊 Resumen:');
  console.log(`   Pedidos borrados (viejos): ${deletedCount}`);
  console.log(`   Pedidos mantenidos (nuevos): ${keptCount}`);
  console.log(`   Total procesados: ${snapshot.docs.length}`);
}

deleteOldPedidos()
  .then(() => {
    console.log('\n✅ Limpieza completada!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Error:', err);
    process.exit(1);
  });
