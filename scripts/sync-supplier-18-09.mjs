// scripts/sync-supplier-18-09.mjs
// Parsea "CATALOGO ARABES MAYORISTA 18-09.pdf" (Franzebi Imports), lo compara
// contra el catálogo actual en Firestore y reporta altas + cambios de precio.
//
// Uso:
//   node scripts/sync-supplier-18-09.mjs            -> dry-run (solo reporte, no escribe nada)
//   node scripts/sync-supplier-18-09.mjs --commit    -> aplica los cambios en Firestore

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMMIT = process.argv.includes('--commit');

const serviceAccount = JSON.parse(readFileSync(join(__dirname, 'serviceAccount.json'), 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// ── Marcas conocidas (más largas primero, para matchear "AL HARAMAIN" antes que nada) ──
const MARCAS = [
  'AL HARAMAIN', 'AL WATANIAH', 'MAISON ALHAMBRA', 'FRAGRANCE WORLD',
  'FRENCH AVENUE', 'PARIS CORNER', 'PENDORA SCENTS', "L'AFFAIR",
  'AFNAN', 'ANFAR', 'ARMAF', 'BHARARA', 'DUMONT', 'EMPER', 'KHADLAJ',
  'LATTAFA', 'NAUTICA', 'ORIENTICA', 'RASASI', 'RAVE', 'RAYHAAN',
  'RIIFFS', 'ZIMAYA', 'GRANDEUR',
];

function detectarMarca(nombre) {
  const upper = nombre.toUpperCase();
  for (const marca of MARCAS) {
    if (upper.startsWith(marca)) return marca;
  }
  return null;
}

// Heurística simple de familia olfativa por palabras clave del nombre
const FAMILIA_KEYWORDS = [
  [/OUD|AMBER|BOURBON|ELIXIR|ROYAL|IMPERIAL|SULTAN|KHAMRAH/i, 'Oriental'],
  [/AQUA|BLUE|MARINE|OCEAN|ICE|FRESH|BREEZE/i, 'Acuático'],
  [/CITRUS|LIMONI|MANGO|LEMON|MANDARIN|ORANGE/i, 'Cítrico'],
  [/ROSE|ROSA|FLEUR|FLORAL|JASMIN|PEONY|VELVET/i, 'Floral'],
  [/VANILLA|CHOCOLATE|CARAMEL|COOKIE|CANDY|SUGAR|CHEESECAKE|TIRAMISU|BISCUIT|MERINGUE|CHOCOLAT|COCO\b/i, 'Gourmand'],
  [/SPICE|SPICY|CARDAMOM|SAFFRON|PEPPER/i, 'Especiado'],
  [/WOOD|CEDAR|VETIVER|SANDAL|LEATHER|NOIR|BLACK/i, 'Amaderado'],
  [/GREEN|VERDE|LEAF/i, 'Verde'],
];

function inferirFamilia(nombre) {
  for (const [regex, familia] of FAMILIA_KEYWORDS) {
    if (regex.test(nombre)) return familia;
  }
  return 'Amaderado'; // default conservador, revisar manualmente
}

function normalizarClave(marca, nombreSinVolumen) {
  return `${marca}|${nombreSinVolumen}`.toUpperCase().replace(/\s+/g, ' ').trim();
}

// ── Parseo del texto extraído del PDF ──
const JUNK_LINE = /^(MODELO\s*PRECIO|MODELO$|PRECIO$|IMAGEN\b.*|@Franzebi\.imports.*|Franzebi Imports$|11\s?2872\s?0954$|--\s*\d+\s*of\s*\d+\s*--$)$/i;
const GENDER_MARK = {
  'FRAGANCIAS MASCULINAS': 'Masculino',
  'FRAGANCIAS FEMENINAS': 'Femenino',
  'FRAGANCIAS KIDS': 'Kids',
};

// El marcador de género (FRAGANCIAS MASCULINAS/FEMENINAS/KIDS) aparece en
// cualquier parte del texto extraído de CADA página (a veces arriba, a veces
// como sidebar al final), pero siempre describe a ESA MISMA página — nunca a
// la siguiente. Por eso el parseo se hace página por página (separadas por
// "-- N of 53 --"), detectando el género de cada página completa antes de
// parsear sus productos.
function parsearCatalogo(text) {
  const paginas = text.split(/--\s*\d+\s*of\s*\d+\s*--/i);
  const productos = [];
  let currentGender = 'Masculino'; // el catálogo arranca en masculinos

  for (const pagina of paginas) {
    const lines = pagina.split('\n').map((l) => l.trim());

    // Determinar el género de esta página completa
    for (const l of lines) {
      const clean = l.replace(/\t/g, ' ').replace(/\s+/g, ' ').trim();
      if (GENDER_MARK[clean]) { currentGender = GENDER_MARK[clean]; break; }
    }

    let buffer = [];
    for (const rawLine of lines) {
      const line = rawLine.replace(/\t/g, ' ').replace(/\s+/g, ' ').trim();
      if (!line) { buffer = []; continue; }
      if (GENDER_MARK[line] || JUNK_LINE.test(line)) { buffer = []; continue; }

      if (/\bUSD\b/i.test(line)) {
        const combined = [...buffer, line].join(' ').replace(/\s+/g, ' ').trim();
        const m = combined.match(/^(.*?)\s*(\d+)\s*ML\s+(\d+)\s*USD$/i);
        buffer = [];
        if (!m) continue;
        const [, nombreBase, volumenML, precioUSD] = m;
        const nombreCompleto = `${nombreBase.trim()} ${volumenML}ML`;
        const marca = detectarMarca(nombreBase.trim());
        productos.push({
          marca: marca || nombreBase.trim().split(' ')[0],
          nombre: nombreCompleto,
          nombreBase: nombreBase.trim(),
          genero: currentGender,
          volumenML: Number(volumenML),
          precioUSD: Number(precioUSD),
        });
      } else {
        buffer.push(line);
      }
    }
  }
  return productos;
}

const text = readFileSync(join(__dirname, 'pdf-text-18-09.txt'), 'utf8');
const productosProveedor = parsearCatalogo(text);

console.log(`📦 Productos parseados del PDF del proveedor: ${productosProveedor.length}\n`);

// ── Comparar contra Firestore ──
const snap = await db.collection('perfumes').get();
const catalogoActual = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

const indiceActual = new Map();
for (const p of catalogoActual) {
  if (!p.marca || !p.nombre) continue;
  const nombreSinVol = p.nombre.replace(/\s*\d+ML$/i, '').trim();
  indiceActual.set(normalizarClave(p.marca, nombreSinVol), p);
}

const nuevos = [];
const actualizarPrecio = [];
const sinCambios = [];
const sinMarcaDetectada = [];

for (const prod of productosProveedor) {
  if (!detectarMarca(prod.nombreBase)) sinMarcaDetectada.push(prod);

  const clave = normalizarClave(prod.marca, prod.nombreBase);
  const existente = indiceActual.get(clave);

  if (!existente) {
    nuevos.push(prod);
  } else if (Number(existente.precioUSD) !== prod.precioUSD) {
    actualizarPrecio.push({ prod, existente, precioAnterior: existente.precioUSD });
  } else {
    sinCambios.push(prod);
  }
}

console.log(`🆕 Nuevos para agregar: ${nuevos.length}`);
console.log(`💲 Con precio distinto (a actualizar): ${actualizarPrecio.length}`);
console.log(`✅ Sin cambios: ${sinCambios.length}`);
if (sinMarcaDetectada.length) {
  console.log(`⚠️  Sin marca reconocida (revisar): ${sinMarcaDetectada.length}`);
}

writeFileSync(join(__dirname, 'supplier-18-09-nuevos.json'), JSON.stringify(nuevos, null, 2), 'utf8');
writeFileSync(join(__dirname, 'supplier-18-09-precios.json'), JSON.stringify(actualizarPrecio, null, 2), 'utf8');
console.log('\n📝 Guardado: scripts/supplier-18-09-nuevos.json y scripts/supplier-18-09-precios.json');

if (!COMMIT) {
  console.log('\n(Dry-run, no se escribió nada en Firestore. Ejecutá con --commit para aplicar los cambios.)');
  process.exit(0);
}

// ── Aplicar cambios ──
let creados = 0;
for (const prod of nuevos) {
  await db.collection('perfumes').add({
    nombre: prod.nombre,
    marca: prod.marca,
    genero: prod.genero,
    familiaOlfativa: inferirFamilia(prod.nombreBase),
    descripcion: '',
    notasSalida: [],
    notasCorazon: [],
    notasFondo: [],
    precioUSD: prod.precioUSD,
    volumenML: prod.volumenML,
    imagenes: [],
    destacado: false,
    disponible: true,
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  creados++;
}

let actualizados = 0;
for (const { existente, prod } of actualizarPrecio) {
  await db.collection('perfumes').doc(existente.id).update({
    precioUSD: prod.precioUSD,
    updatedAt: new Date(),
  });
  actualizados++;
}

console.log(`\n✅ Creados: ${creados} | Precios actualizados: ${actualizados}`);
console.log('ℹ️  Corré scripts/fix-prices.mjs para recalcular precioTransferencia/precioEfectivo con el dólar del día.');
process.exit(0);
