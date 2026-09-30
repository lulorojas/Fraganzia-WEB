// cache-precios-ars.mjs
// Calcula precios ARS redondeados a miles y los guarda en cada documento de Firestore.
// Usar con: node scripts/cache-precios-ars.mjs [tasa_manual]
// Ejemplo:   node scripts/cache-precios-ars.mjs 1525

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sa = JSON.parse(readFileSync(join(__dirname, 'serviceAccount.json'), 'utf8'));
initializeApp({ credential: cert(sa) });
const db = getFirestore();

// ── 1. Dólar blue actual ──────────────────────────────────────────────────
let dolarMedio;
const manualArg = parseFloat(process.argv[2]);
if (manualArg && manualArg > 100) {
  dolarMedio = manualArg;
  console.log(`💵 Dólar blue (manual): $${dolarMedio}\n`);
} else {
  try {
    const res = await fetch('https://dolarapi.com/v1/dolares/blue');
    const data = await res.json();
    dolarMedio = (data.compra + data.venta) / 2;
    console.log(`💵 Dólar blue (API): compra $${data.compra} | venta $${data.venta} | medio $${dolarMedio.toFixed(2)}\n`);
  } catch (e) {
    console.error('❌ No se pudo obtener el dólar blue. Pasá la tasa manualmente:');
    console.error('   node scripts/cache-precios-ars.mjs 1525');
    process.exit(1);
  }
}

function redondearMiles(n) {
  return Math.round(n / 1000) * 1000;
}

// ── 2. Actualizar cada producto ───────────────────────────────────────────
const snap = await db.collection('perfumes').get();
let ok = 0, skip = 0;

const batch = db.batch();

snap.forEach(doc => {
  const d = doc.data();
  const usd = d.precioUSD;
  if (!usd || usd <= 0) { skip++; return; }

  const base             = usd * dolarMedio;
  const precioTransferencia = redondearMiles(base * 1.40);
  const precioEfectivo      = redondearMiles(base * 1.35);

  batch.update(doc.ref, {
    precioTransferencia,
    precioEfectivo,
    dolarReferencia: Math.round(dolarMedio),
    preciosActualizadoAt: new Date().toISOString(),
  });

  console.log(
    `  ${d.nombre}\n` +
    `    USD $${usd}  →  Transf $${precioTransferencia.toLocaleString('es-AR')}  |  Efec $${precioEfectivo.toLocaleString('es-AR')}`
  );
  ok++;
});

await batch.commit();

// ── 3. Guardar dolarBlueManual en config para que el frontend lo use ─────
try {
  const configRef = db.collection('config').doc('general');
  await configRef.set({ dolarBlueManual: Math.round(dolarMedio), updatedAt: new Date().toISOString() }, { merge: true });
  console.log(`\n💾 dolarBlueManual guardado en config: $${Math.round(dolarMedio)}`);
} catch (e) {
  console.warn('⚠️  No se pudo guardar dolarBlueManual en config:', e.message);
}

console.log(`\n✅ ${ok} productos actualizados (${skip} saltados sin precioUSD)`);
console.log(`📅 Dólar de referencia: $${Math.round(dolarMedio)}`);
process.exit(0);
