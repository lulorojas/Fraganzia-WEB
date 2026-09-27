// scripts/audit-prices.mjs
// Audita los precios en Firestore para detectar posibles errores:
// - precioUSD faltante, cero o negativo
// - outliers estadísticos (IQR) dentro de cada marca
// - inconsistencias de volumen (un ml menor más caro que uno mayor del mismo
//   producto/línea, dentro de la misma marca)
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(readFileSync('./scripts/ServiceAccount.json', 'utf-8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const snapshot = await db.collection('perfumes').get();
const perfumes = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

console.log(`📦 Total perfumes: ${perfumes.length}\n`);

// ── 1. Sin precio / precio inválido ──
const sinPrecio = perfumes.filter((p) => !p.precioUSD || p.precioUSD <= 0);
console.log(`⚠️  Sin precioUSD válido: ${sinPrecio.length}`);
sinPrecio.forEach((p) => console.log(`   - [${p.marca}] ${p.nombre}: precioUSD=${p.precioUSD}`));

// ── 2. Estadísticas generales ──
const precios = perfumes.filter((p) => p.precioUSD > 0).map((p) => p.precioUSD).sort((a, b) => a - b);
const min = precios[0];
const max = precios[precios.length - 1];
const avg = precios.reduce((a, b) => a + b, 0) / precios.length;
const median = precios[Math.floor(precios.length / 2)];
console.log(`\n📊 precioUSD — min: $${min} | max: $${max} | promedio: $${avg.toFixed(1)} | mediana: $${median}`);

// ── 3. Outliers globales (IQR) ──
function quantile(arr, q) {
  const pos = (arr.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  return arr[base + 1] !== undefined ? arr[base] + rest * (arr[base + 1] - arr[base]) : arr[base];
}
const q1 = quantile(precios, 0.25);
const q3 = quantile(precios, 0.75);
const iqr = q3 - q1;
const lowFence = q1 - 1.5 * iqr;
const highFence = q3 + 1.5 * iqr;
console.log(`   Q1: $${q1.toFixed(1)} | Q3: $${q3.toFixed(1)} | rango normal: $${lowFence.toFixed(1)} a $${highFence.toFixed(1)}`);

const outliers = perfumes.filter((p) => p.precioUSD > 0 && (p.precioUSD < lowFence || p.precioUSD > highFence));
console.log(`\n🔎 Outliers de precioUSD (${outliers.length}):`);
outliers
  .sort((a, b) => a.precioUSD - b.precioUSD)
  .forEach((p) => console.log(`   - [${p.marca}] ${p.nombre} (${p.volumenML}ml): USD $${p.precioUSD} -> Transferencia $${p.precioTransferencia} / Efectivo $${p.precioEfectivo}`));

// ── 4. Inconsistencias de volumen dentro del mismo nombre base ──
// Agrupamos por marca + nombre "base" (sin el ml) para detectar si una
// presentación más chica cuesta más que una más grande del mismo perfume.
function nombreBase(nombre) {
  return nombre.replace(/\d+\s*ML$/i, '').trim();
}
const grupos = new Map();
for (const p of perfumes) {
  if (!p.precioUSD || !p.volumenML) continue;
  const key = `${p.marca}::${nombreBase(p.nombre)}`;
  if (!grupos.has(key)) grupos.set(key, []);
  grupos.get(key).push(p);
}

console.log(`\n🔎 Inconsistencias de volumen (mismo producto, ml menor más caro que ml mayor):`);
let inconsistencias = 0;
for (const [key, items] of grupos) {
  if (items.length < 2) continue;
  const ordenado = [...items].sort((a, b) => a.volumenML - b.volumenML);
  for (let i = 0; i < ordenado.length - 1; i++) {
    const menor = ordenado[i];
    const mayor = ordenado[i + 1];
    if (menor.volumenML < mayor.volumenML && menor.precioUSD > mayor.precioUSD) {
      inconsistencias++;
      console.log(`   - ${key}: ${menor.volumenML}ml=$${menor.precioUSD} > ${mayor.volumenML}ml=$${mayor.precioUSD}`);
    }
  }
}
if (inconsistencias === 0) console.log('   (ninguna encontrada)');

// ── 5. precioUSD duplicados exactos entre marcas distintas (posible copy-paste) ──
const porPrecio = new Map();
for (const p of perfumes) {
  if (!p.precioUSD) continue;
  if (!porPrecio.has(p.precioUSD)) porPrecio.set(p.precioUSD, []);
  porPrecio.get(p.precioUSD).push(p);
}
console.log(`\n📋 Valores de precioUSD compartidos por muchos productos (posibles precios "default" mal asignados si el grupo es muy grande y heterogéneo):`);
[...porPrecio.entries()]
  .filter(([, items]) => items.length >= 15)
  .sort((a, b) => b[1].length - a[1].length)
  .forEach(([precio, items]) => {
    const marcas = new Set(items.map((i) => i.marca));
    console.log(`   - $${precio} USD: ${items.length} productos, ${marcas.size} marcas distintas`);
  });

process.exit(0);
