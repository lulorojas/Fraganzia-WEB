// scripts/seed.js
// Script de seed para poblar Firestore con datos iniciales de Fraganzia.
// Requiere: scripts/serviceAccount.json (descargado de Firebase Console → Project Settings → Service accounts)
// Uso: node scripts/seed.js

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync(join(__dirname, 'serviceAccount.json'), 'utf8'));
} catch {
  console.error('❌ No se encontró scripts/serviceAccount.json');
  console.error('   Descargalo desde Firebase Console → Project Settings → Service accounts → Generate new private key');
  process.exit(1);
}

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const ADMIN_UID  = 'hWsTYA5cWse2TpmziUKxyAiHJ9O2';
const ADMIN_EMAIL = 'lulorojas11@gmail.com';

const PERFUMES = [
  {
    nombre: 'Asad',
    marca: 'Lattafa',
    genero: 'Masculino',
    familiaOlfativa: 'Amaderado',
    descripcion: 'Una fragancia oriental amaderada con notas de cuero y oud. Intensa, cálida y duradera. Ideal para ocasiones especiales.',
    notasSalida: ['Bergamota', 'Canela'],
    notasCorazon: ['Oud', 'Rosa'],
    notasFondo: ['Sándalo', 'Almizcle', 'Ámbar'],
    precioUSD: 18,
    volumenML: 100,
    imagenes: ['https://images.unsplash.com/photo-1594035910387-fea47794261f?w=400&q=80'],
    destacado: true,
    disponible: true,
    activo: true,
  },
  {
    nombre: 'Bade\'e Al Oud Amethyst',
    marca: 'Lattafa',
    genero: 'Unisex',
    familiaOlfativa: 'Oriental',
    descripcion: 'Una composición oriental exótica con oud y flores. Sofisticada y misteriosa, perfecta para la noche.',
    notasSalida: ['Azafrán', 'Bergamota'],
    notasCorazon: ['Oud', 'Jazmín', 'Patchouli'],
    notasFondo: ['Vainilla', 'Almizcle'],
    precioUSD: 22,
    volumenML: 100,
    imagenes: ['https://images.unsplash.com/photo-1541643600914-78b084683702?w=400&q=80'],
    destacado: true,
    disponible: true,
    activo: true,
  },
  {
    nombre: 'Asdaaf Andaleeb',
    marca: 'Lattafa',
    genero: 'Femenino',
    familiaOlfativa: 'Floral',
    descripcion: 'Una fragancia floral suave con notas de rosa y jazmín. Delicada y romántica, ideal para el día a día.',
    notasSalida: ['Bergamota', 'Durazno'],
    notasCorazon: ['Rosa', 'Jazmín', 'Iris'],
    notasFondo: ['Almizcle blanco', 'Cedro'],
    precioUSD: 16,
    volumenML: 100,
    imagenes: ['https://images.unsplash.com/photo-1588776814546-1ffbb2ca5b59?w=400&q=80'],
    destacado: false,
    disponible: true,
    activo: true,
  },
  {
    nombre: 'Oud Mood Elixir',
    marca: 'Lattafa',
    genero: 'Masculino',
    familiaOlfativa: 'Especiado',
    descripcion: 'Un elixir especiado con corazón de oud y especias orientales. Poderoso y seductor, para quienes buscan destacar.',
    notasSalida: ['Cardamomo', 'Pimienta negra'],
    notasCorazon: ['Oud', 'Cuero', 'Especias'],
    notasFondo: ['Ámbar', 'Sándalo', 'Vetiver'],
    precioUSD: 25,
    volumenML: 100,
    imagenes: ['https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=400&q=80'],
    destacado: true,
    disponible: true,
    activo: true,
  },
  {
    nombre: 'Raghba Wood Intense',
    marca: 'Lattafa',
    genero: 'Femenino',
    familiaOlfativa: 'Amaderado',
    descripcion: 'Una fragancia amaderada intensa con notas de rosa y sándalo. Cálida y envolvente, perfecta para el otoño.',
    notasSalida: ['Mandarina', 'Rosa'],
    notasCorazon: ['Sándalo', 'Jazmín'],
    notasFondo: ['Vainilla', 'Almizcle', 'Oud'],
    precioUSD: 20,
    volumenML: 100,
    imagenes: ['https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=400&q=80'],
    destacado: false,
    disponible: true,
    activo: true,
  },
];

async function seed() {
  console.log('🌱 Iniciando seed de Fraganzia...\n');

  // 1. Documento admins/{uid}
  await db.doc(`admins/${ADMIN_UID}`).set({
    email: ADMIN_EMAIL,
    nombre: 'Admin',
    createdAt: Timestamp.now(),
  });
  console.log(`✅ admins/${ADMIN_UID} creado`);

  // 2. config/general
  await db.doc('config/general').set({
    dolarBlueManual: 1230,
    whatsappNumero: '5491130097370',
    updatedAt: Timestamp.now(),
  });
  console.log('✅ config/general creado (dolarBlueManual: 1230, whatsappNumero: 5491130097370)');

  // 3. Perfumes de prueba
  for (const perfume of PERFUMES) {
    const ref = await db.collection('perfumes').add({
      ...perfume,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    console.log(`✅ Perfume creado: ${perfume.nombre} (${ref.id})`);
  }

  console.log(`\n🎉 Seed completado. ${PERFUMES.length} perfumes, 1 admin, 1 config.`);
  console.log('\nPróximo paso: npm run dev y abrí http://localhost:5173');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Error en el seed:', err.message);
  process.exit(1);
});
