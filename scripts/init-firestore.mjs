import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

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

async function initFirestore() {
  console.log('🚀 Inicializando Firestore con colecciones base...\n');

  try {
    // 1. Crear colección de pedidos (con documento dummy que se puede borrar después)
    console.log('📦 Creando colección de pedidos...');
    await addDoc(collection(db, 'pedidos'), {
      _dummy: true,
      _nota: 'Este es un documento dummy para inicializar la colección. Se puede borrar.',
      creadoEn: serverTimestamp()
    });
    console.log('✅ Colección "pedidos" creada\n');

    // 2. Crear colección de promociones (con promo dummy)
    console.log('🎉 Creando colección de promociones...');
    await addDoc(collection(db, 'promociones'), {
      _dummy: true,
      _nota: 'Este es un documento dummy para inicializar la colección. Se puede borrar.',
      tipo: 'descuento',
      activo: false,
      titulo: 'Promoción inicial',
      descripcion: 'Documento de inicialización',
      descuentoPorcentaje: 0,
      fechaInicio: serverTimestamp(),
      fechaFin: serverTimestamp()
    });
    console.log('✅ Colección "promociones" creada\n');

    console.log('✨ ¡Inicialización completa!');
    console.log('\n📋 Colecciones creadas:');
    console.log('   • pedidos');
    console.log('   • promociones');
    console.log('\n💡 Ahora podés:');
    console.log('   1. Hacer un pedido desde la web');
    console.log('   2. Crear promociones desde el admin');
    console.log('   3. Ver pedidos en el dashboard');
    console.log('\n🗑️  Los documentos dummy se pueden borrar desde Firebase Console si querés.');
    
  } catch (error) {
    console.error('\n❌ Error al inicializar Firestore:', error);
    process.exit(1);
  }

  process.exit(0);
}

initFirestore();
