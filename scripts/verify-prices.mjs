// verify-prices.mjs — Verifica que los precios coincidan con la fórmula del PDF 27-07

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { readFileSync } from 'fs';

// Cargar configuración de Firebase
const serviceAccount = JSON.parse(readFileSync('./scripts/ServiceAccount.json', 'utf-8'));
const firebaseConfig = {
  apiKey: serviceAccount.project_id,
  projectId: serviceAccount.project_id,
  storageBucket: `${serviceAccount.project_id}.appspot.com`,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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
    transferencia: redondearMiles(precioBase * 1.40), // +40%
    efectivo: redondearMiles(precioBase * 1.35)       // +35%
  };
}

async function main() {
  console.log('🔍 Verificando precios contra fórmula del PDF 27-07\n');
  console.log('📐 Fórmula: Precio PDF (USD) × Dólar Medio × Factor');
  console.log('   - Transferencia: +40% (factor 1.40)');
  console.log('   - Efectivo: +35% (factor 1.35)');
  console.log('   - Redondeo: a miles\n');
  
  // Obtener dólar blue
  const dolarMedio = await getDolarBlue();
  
  // Obtener perfumes de Firestore
  const snapshot = await getDocs(collection(db, 'perfumes'));
  const perfumes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  console.log(`📦 Total de perfumes: ${perfumes.length}\n`);
  console.log('='.repeat(100));
  
  const discrepancias = [];
  let correctos = 0;
  let sinPrecio = 0;
  
  for (const perfume of perfumes) {
    if (!perfume.precioUSD) {
      sinPrecio++;
      continue;
    }
    
    // Calcular precios esperados
    const esperados = calcularPreciosEsperados(perfume.precioUSD, dolarMedio);
    
    // Comparar con precios en Firestore
    const transferenciaMatch = perfume.precioTransferencia === esperados.transferencia;
    const efectivoMatch = perfume.precioEfectivo === esperados.efectivo;
    
    if (transferenciaMatch && efectivoMatch) {
      correctos++;
    } else {
      discrepancias.push({
        id: perfume.id,
        marca: perfume.marca,
        nombre: perfume.nombre,
        precioUSD: perfume.precioUSD,
        actual: {
          transferencia: perfume.precioTransferencia || 'N/A',
          efectivo: perfume.precioEfectivo || 'N/A'
        },
        esperado: esperados,
        diferencia: {
          transferencia: (perfume.precioTransferencia || 0) - esperados.transferencia,
          efectivo: (perfume.precioEfectivo || 0) - esperados.efectivo
        }
      });
    }
  }
  
  // Mostrar discrepancias
  if (discrepancias.length > 0) {
    console.log(`\n❌ DISCREPANCIAS ENCONTRADAS: ${discrepancias.length} perfumes\n`);
    
    discrepancias.forEach((d, index) => {
      console.log(`${index + 1}. ${d.marca} - ${d.nombre}`);
      console.log(`   ID: ${d.id}`);
      console.log(`   Precio USD: $${d.precioUSD}`);
      console.log(`   Base (USD × ${dolarMedio}): $${(d.precioUSD * dolarMedio).toFixed(2)}`);
      console.log(`   
   Transferencia:
      Actual:   $${d.actual.transferencia}
      Esperado: $${d.esperado.transferencia}
      Diferencia: $${d.diferencia.transferencia}
      
   Efectivo:
      Actual:   $${d.actual.efectivo}
      Esperado: $${d.esperado.efectivo}
      Diferencia: $${d.diferencia.efectivo}
`);
      console.log('-'.repeat(100));
    });
  }
  
  // Resumen
  console.log('\n' + '='.repeat(100));
  console.log('📊 RESUMEN:');
  console.log(`   Total perfumes: ${perfumes.length}`);
  console.log(`   ✅ Precios correctos: ${correctos}`);
  console.log(`   ❌ Con discrepancias: ${discrepancias.length}`);
  console.log(`   ⚠️  Sin precio USD: ${sinPrecio}`);
  console.log('='.repeat(100));
  
  // Sugerencia de corrección
  if (discrepancias.length > 0) {
    console.log('\n💡 Para corregir los precios, puedes ejecutar:');
    console.log('   node scripts/fix-prices.mjs');
  }
}

main().catch(console.error);
