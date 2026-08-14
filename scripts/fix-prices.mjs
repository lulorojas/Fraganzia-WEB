// fix-prices.mjs — Corrige los precios según fórmula PDF + 40% (35% efectivo)

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

// Cargar configuración de Firebase Admin
const serviceAccount = JSON.parse(readFileSync('./scripts/ServiceAccount.json', 'utf-8'));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

// Obtener dólar blue
async function getDolarBlue() {
  try {
    const res = await fetch('https://dolarapi.com/v1/dolares/blue');
    const data = await res.json();
    const medio = (data.compra + data.venta) / 2;
    console.log(`💵 Dólar Blue: Compra ${data.compra} | Venta ${data.venta} | Medio: ${medio}\n`);
    return medio;
  } catch (error) {
    console.error('Error obteniendo dólar:', error.message);
    process.exit(1);
  }
}

// Redondear a miles
function redondearMiles(n) {
  return Math.round(n / 1000) * 1000;
}

// Calcular precios según fórmula
function calcularPreciosEsperados(precioUSD, dolarMedio) {
  const precioBase = precioUSD * dolarMedio;
  return {
    precioTransferencia: redondearMiles(precioBase * 1.40), // +40%
    precioEfectivo: redondearMiles(precioBase * 1.35)       // +35%
  };
}

async function main() {
  console.log('🔧 Corrigiendo precios según fórmula del PDF 27-07\n');
  console.log('📐 Fórmula: Precio PDF (USD) × Dólar Medio × Factor');
  console.log('   - Transferencia: +40% (factor 1.40)');
  console.log('   - Efectivo: +35% (factor 1.35)');
  console.log('   - Redondeo: a miles\n');
  
  // Obtener dólar blue
  const dolarMedio = await getDolarBlue();
  
  // Obtener perfumes de Firestore
  const snapshot = await db.collection('perfumes').get();
  const perfumes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  console.log(`📦 Total de perfumes: ${perfumes.length}\n`);
  console.log('🔄 Procesando...\n');
  
  let actualizados = 0;
  let sinCambios = 0;
  let sinPrecio = 0;
  let errores = 0;
  
  for (const perfume of perfumes) {
    if (!perfume.precioUSD) {
      sinPrecio++;
      console.log(`⚠️  ${perfume.marca} - ${perfume.nombre}: Sin precio USD`);
      continue;
    }
    
    // Calcular precios esperados
    const nuevos = calcularPreciosEsperados(perfume.precioUSD, dolarMedio);
    
    // Verificar si necesita actualización
    const necesitaActualizacion = 
      perfume.precioTransferencia !== nuevos.precioTransferencia ||
      perfume.precioEfectivo !== nuevos.precioEfectivo;
    
    if (!necesitaActualizacion) {
      sinCambios++;
      continue;
    }
    
    // Actualizar en Firestore
    try {
      const perfumeRef = db.collection('perfumes').doc(perfume.id);
      await perfumeRef.update({
        precioTransferencia: nuevos.precioTransferencia,
        precioEfectivo: nuevos.precioEfectivo,
        ultimaActualizacionPrecios: new Date().toISOString()
      });
      
      actualizados++;
      console.log(`✅ ${perfume.marca} - ${perfume.nombre}`);
      console.log(`   USD: $${perfume.precioUSD}`);
      console.log(`   Transferencia: $${perfume.precioTransferencia} → $${nuevos.precioTransferencia} (${nuevos.precioTransferencia - perfume.precioTransferencia >= 0 ? '+' : ''}${nuevos.precioTransferencia - perfume.precioTransferencia})`);
      console.log(`   Efectivo: $${perfume.precioEfectivo} → $${nuevos.precioEfectivo} (${nuevos.precioEfectivo - perfume.precioEfectivo >= 0 ? '+' : ''}${nuevos.precioEfectivo - perfume.precioEfectivo})`);
      console.log('');
      
    } catch (error) {
      errores++;
      console.log(`❌ Error actualizando ${perfume.marca} - ${perfume.nombre}: ${error.message}`);
    }
  }
  
  // Resumen
  console.log('\n' + '='.repeat(80));
  console.log('📊 RESUMEN:');
  console.log(`   Total perfumes: ${perfumes.length}`);
  console.log(`   ✅ Actualizados: ${actualizados}`);
  console.log(`   ➖ Sin cambios: ${sinCambios}`);
  console.log(`   ⚠️  Sin precio USD: ${sinPrecio}`);
  console.log(`   ❌ Errores: ${errores}`);
  console.log('='.repeat(80));
  
  if (actualizados > 0) {
    console.log(`\n✨ Se actualizaron ${actualizados} perfumes con la fórmula correcta.`);
  }
}

main().catch(console.error);
