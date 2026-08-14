// scripts/update-catalog.mjs
// Completa descripción y notas de todos los perfumes del catálogo
// Convierte algunos perfumes a Unisex
// Uso: node scripts/update-catalog.mjs

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, 'serviceAccount.json'), 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// Notas típicas por familia olfativa
const NOTAS_POR_FAMILIA = {
  'Floral': {
    salida: ['Bergamota', 'Limón', 'Pera'],
    corazon: ['Rosa', 'Jazmín', 'Peonía', 'Lirio', 'Violeta'],
    fondo: ['Almizcle', 'Ámbar', 'Cedro', 'Vainilla'],
  },
  'Amaderado': {
    salida: ['Bergamota', 'Pimienta negra', 'Cardamomo'],
    corazon: ['Cedro', 'Vetiver', 'Pachulí'],
    fondo: ['Sándalo', 'Oud', 'Musgo de roble', 'Ámbar'],
  },
  'Oriental': {
    salida: ['Azafrán', 'Canela', 'Bergamota'],
    corazon: ['Rosa', 'Oud', 'Incienso', 'Pachulí'],
    fondo: ['Ámbar', 'Almizcle', 'Vainilla', 'Resinas'],
  },
  'Cítrico': {
    salida: ['Limón', 'Bergamota', 'Mandarina', 'Naranja'],
    corazon: ['Neroli', 'Petit grain', 'Té verde'],
    fondo: ['Almizcle blanco', 'Cedro', 'Vetiver'],
  },
  'Acuático': {
    salida: ['Bergamota', 'Limón', 'Menta'],
    corazon: ['Notas marinas', 'Lavanda', 'Geranio'],
    fondo: ['Almizcle', 'Ámbar gris', 'Cedro'],
  },
  'Aromático': {
    salida: ['Lavanda', 'Romero', 'Salvia'],
    corazon: ['Geranio', 'Cardamomo', 'Clavo'],
    fondo: ['Vetiver', 'Cedro', 'Tonka', 'Almizcle'],
  },
  'Gourmand': {
    salida: ['Vainilla', 'Caramelo', 'Frutas rojas'],
    corazon: ['Praliné', 'Café', 'Cacao', 'Miel'],
    fondo: ['Vainilla', 'Tonka', 'Almizcle dulce', 'Ámbar'],
  },
  'Chipre': {
    salida: ['Bergamota', 'Limón', 'Aldehídos'],
    corazon: ['Rosa', 'Jazmín', 'Pachulí'],
    fondo: ['Musgo de roble', 'Labdanum', 'Ámbar'],
  },
  'Fougère': {
    salida: ['Lavanda', 'Bergamota', 'Geranio'],
    corazon: ['Cumarina', 'Heliotropo', 'Salvia'],
    fondo: ['Musgo de roble', 'Vetiver', 'Tonka'],
  },
  'Especiado': {
    salida: ['Pimienta rosa', 'Cardamomo', 'Nuez moscada'],
    corazon: ['Canela', 'Clavo', 'Jengibre', 'Azafrán'],
    fondo: ['Oud', 'Pachulí', 'Ámbar', 'Cuero'],
  },
  'Aldehídico': {
    salida: ['Aldehídos', 'Bergamota', 'Limón'],
    corazon: ['Rosa', 'Jazmín', 'Lirio', 'Iris'],
    fondo: ['Almizcle', 'Sándalo', 'Vainilla'],
  },
  'Verde': {
    salida: ['Hojas verdes', 'Galbanum', 'Menta'],
    corazon: ['Jazmín', 'Violeta', 'Hiedra'],
    fondo: ['Vetiver', 'Musgo', 'Cedro'],
  },
};

// Perfumes que deberían ser Unisex (orientales/especiados intensos)
const UNISEX_NAMES = new Set([
  'AFNAN 9PM',
  'AFNAN 9PM ELIXIR PARFUM',
  'AL HARAMAIN AMBER OUD BLACK',
  'AL HARAMAIN AMBER OUD GOLD EDITION',
  'LATTAFA KHAMRAH',
  'LATTAFA KHAMRAH QAHWA',
  'LATTAFA KHAMRAH DUKHAN',
  'LATTAFA BADE\'E AL OUD SUBLIME',
  'LATTAFA ASAD',
  'LATTAFA FAKHAR BLACK',
  'ORIENTICA AMBER ROUGE',
  'ORIENTICA ROYAL AMBER',
  'BHARARA KING',
  'BHARARA KING GOLD',
  'LATTAFA MAAHIR GOLD',
  'LATTAFA WAJOOD',
  'AFNAN SUPREMACY NOT ONLY INTENSE',
]);

function generarDescripcion(perfume) {
  const { nombre, marca, genero, familiaOlfativa } = perfume;
  const base = nombre.replace(/\s*\d+ML$/i, '');
  
  const descripciones = {
    'Floral': `${base} es una fragancia ${familiaOlfativa.toLowerCase()} elegante y sofisticada de ${marca}. Su composición floral captura la esencia de un jardín en plena floración, ideal para quienes buscan un aroma delicado y romántico.`,
    'Amaderado': `${base} de ${marca} es una fragancia ${familiaOlfativa.toLowerCase()} robusta y elegante. Su carácter amaderado aporta profundidad y distinción, perfecta para quienes aprecian aromas nobles y atemporales.`,
    'Oriental': `${base} es una fragancia ${familiaOlfativa.toLowerCase()} cautivadora de ${marca}. Rica en especias y resinas preciosas, envuelve con su calidez y sensualidad, creando una estela memorable y sofisticada.`,
    'Cítrico': `${base} de ${marca} es una fragancia ${familiaOlfativa.toLowerCase()} fresca y vibrante. Sus notas cítricas aportan energía y frescura, ideal para el día a día y las estaciones cálidas.`,
    'Acuático': `${base} es una fragancia ${familiaOlfativa.toLowerCase()} refrescante de ${marca}. Evoca la brisa marina y la frescura del océano, perfecta para quienes buscan un aroma limpio y revitalizante.`,
    'Aromático': `${base} de ${marca} es una fragancia ${familiaOlfativa.toLowerCase()} versátil y equilibrada. Sus notas aromáticas combinan frescura y elegancia, ideal para cualquier ocasión.`,
    'Gourmand': `${base} es una fragancia ${familiaOlfativa.toLowerCase()} irresistible de ${marca}. Sus notas dulces y envolventes recuerdan a deliciosos postres, perfecta para quienes aman los aromas reconfortantes.`,
    'Especiado': `${base} de ${marca} es una fragancia ${familiaOlfativa.toLowerCase()} audaz e intensa. Sus especias cálidas aportan carácter y personalidad, ideal para ocasiones especiales y noches sofisticadas.`,
    'Chipre': `${base} es una fragancia ${familiaOlfativa.toLowerCase()} clásica de ${marca}. Su composición equilibrada entre frescura y profundidad la hace atemporal y elegante.`,
    'Fougère': `${base} de ${marca} es una fragancia ${familiaOlfativa.toLowerCase()} refinada y versátil. Su carácter aromático-amaderado la convierte en un clásico moderno.`,
    'Aldehídico': `${base} es una fragancia ${familiaOlfativa.toLowerCase()} luminosa de ${marca}. Sus aldehídos aportan brillo y sofisticación, creando un aura de elegancia atemporal.`,
    'Verde': `${base} de ${marca} es una fragancia ${familiaOlfativa.toLowerCase()} fresca y natural. Sus notas verdes evocan praderas y bosques, perfecta para amantes de aromas naturales.`,
  };

  return descripciones[familiaOlfativa] || `${base} es una exquisita fragancia de ${marca}, diseñada para quienes buscan un aroma único y memorable.`;
}

function seleccionarNotas(familia, cantidad = 3) {
  const notas = NOTAS_POR_FAMILIA[familia];
  if (!notas) return [];
  
  const disponibles = [...notas.salida, ...notas.corazon, ...notas.fondo];
  const seleccionadas = [];
  
  while (seleccionadas.length < cantidad && disponibles.length > 0) {
    const idx = Math.floor(Math.random() * disponibles.length);
    seleccionadas.push(disponibles[idx]);
    disponibles.splice(idx, 1);
  }
  
  return seleccionadas;
}

async function actualizarPerfumes() {
  console.log('🔄 Actualizando catálogo...\n');
  
  const snapshot = await db.collection('perfumes').get();
  let actualizados = 0;
  let convertidosUnisex = 0;
  
  for (const doc of snapshot.docs) {
    const perfume = doc.data();
    const updates = {};
    
    // Actualizar descripción si está vacía
    if (!perfume.descripcion || perfume.descripcion.trim() === '') {
      updates.descripcion = generarDescripcion(perfume);
    }
    
    // Actualizar notas si están vacías
    const notasBase = NOTAS_POR_FAMILIA[perfume.familiaOlfativa];
    if (notasBase) {
      if (!perfume.notasSalida || perfume.notasSalida.length === 0) {
        updates.notasSalida = seleccionarNotas(perfume.familiaOlfativa, 3);
      }
      if (!perfume.notasCorazon || perfume.notasCorazon.length === 0) {
        const corazon = notasBase.corazon || [];
        updates.notasCorazon = corazon.slice(0, Math.min(3, corazon.length));
      }
      if (!perfume.notasFondo || perfume.notasFondo.length === 0) {
        const fondo = notasBase.fondo || [];
        updates.notasFondo = fondo.slice(0, Math.min(3, fondo.length));
      }
    }
    
    // Convertir a Unisex si corresponde
    const nombreBase = perfume.nombre.replace(/\s*\d+ML$/i, '').trim();
    if (UNISEX_NAMES.has(nombreBase) && perfume.genero !== 'Unisex') {
      updates.genero = 'Unisex';
      convertidosUnisex++;
    }
    
    // Aplicar updates si hay cambios
    if (Object.keys(updates).length > 0) {
      await doc.ref.update(updates);
      actualizados++;
      if (actualizados % 20 === 0) {
        console.log(`   ... ${actualizados}/${snapshot.docs.length} perfumes procesados`);
      }
    }
  }
  
  console.log(`\n✅ Actualización completa:`);
  console.log(`   • ${actualizados} perfumes actualizados`);
  console.log(`   • ${convertidosUnisex} perfumes convertidos a Unisex`);
  console.log(`   • Total en catálogo: ${snapshot.docs.length}`);
  
  process.exit(0);
}

actualizarPerfumes().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
