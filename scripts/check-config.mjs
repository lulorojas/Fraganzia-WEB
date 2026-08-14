import admin from 'firebase-admin';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(readFileSync('./fraganzia-e9b70-firebase-adminsdk-lozn6-f4cddcebf6.json', 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkConfig() {
  console.log('🔍 Verificando configuración en Firebase...\n');
  
  const configSnapshot = await db.collection('config').get();
  
  if (configSnapshot.empty) {
    console.log('❌ No hay documentos en la colección config');
  } else {
    configSnapshot.forEach(doc => {
      console.log('📄 Documento ID:', doc.id);
      console.log('📱 WhatsApp número:', doc.data().whatsappNumero);
      console.log('💰 Dólar blue:', doc.data().dolarBlue);
      console.log('\nDatos completos:', JSON.stringify(doc.data(), null, 2));
    });
  }
  
  await admin.app().delete();
  process.exit(0);
}

checkConfig().catch(error => {
  console.error('💥 Error:', error);
  process.exit(1);
});
