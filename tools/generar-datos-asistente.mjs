// Genera src/data/asistente-perfumes.json a partir de la clasificación interna
// (privado/clasificacion-perfumes.json, fuera del repo).
//
// Ese archivo es público (va en el bundle del asistente), así que solo exporta
// datos neutros por perfume:
//   i: perfume en el que se inspira (solo si es una referencia confiable)
//   u: uso ideal (C día·calor, O día·oficina, N noche·salidas, F noche·frío, T todo uso, K infantil)
//   c: palabras clave de sus notas reales (solo vocabulario de notas)
//   r: 1 si es de las mejores recomendaciones (solo marca positiva: no hay
//      ninguna señal de los perfumes que no conviene recomendar)
//
// Uso: node tools/generar-datos-asistente.mjs   (correr cada vez que cambie la clasificación)
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const ORIGEN = 'privado/clasificacion-perfumes.json';
const DESTINO = 'src/data/asistente-perfumes.json';

if (!existsSync(ORIGEN)) {
  console.error(`Falta ${ORIGEN} (la clasificación interna no está en el repo).`);
  process.exit(1);
}

const USO = { 'Día · calor': 'C', 'Día · oficina': 'O', 'Noche · salidas': 'N', 'Noche · frío': 'F', 'Todo uso': 'T', Infantil: 'K' };

// Raíces de notas (sin tildes) que puede reconocer el asistente.
const NOTAS = [
  'vainilla', 'ambar', 'caramel', 'dulce', 'canela', 'miel', 'tonka', 'chocolate', 'cacao', 'coco', 'praline',
  'oud', 'sandalo', 'cedro', 'cuero', 'incienso', 'tabaco', 'vetiver', 'pachuli', 'amader', 'especi',
  'bergamota', 'fresc', 'marin', 'lavanda', 'citric', 'limon', 'menta', 'acuat', 'verde', 'pomelo',
  'rosa', 'jazmin', 'floral', 'frut', 'peonia', 'flor', 'durazno', 'frutilla', 'pera', 'cafe', 'almizcl',
  'mango', 'pina', 'manzana', 'cardamomo', 'azafran', 'ahumad', 'lichi', 'frambuesa', 'cereza', 'avellana',
  'almendra', 'pistacho', 'leche', 'tuberosa', 'iris', 'violeta', 'neroli', 'azahar', 'mandarina', 'naranja',
];

// Inspiraciones que se muestran con otro texto (mezclas o nombres largos).
const TEXTO_INSPIRACION = {
  'Mezcla de Versace Dylan Blue, Bleu de Chanel y Dior Sauvage': 'Versace Dylan Blue y Bleu de Chanel',
};

const normalizar = (t) => (t ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

function inspiracionPublica(p) {
  if (!['A', 'B'].includes(p.categoria) || p.certeza === 'baja' || !p.imita) return undefined;
  if (TEXTO_INSPIRACION[p.imita]) return TEXTO_INSPIRACION[p.imita];
  if (/sin confirmar|sin consenso|intento/i.test(p.imita)) return undefined;
  // Sin aclaraciones entre paréntesis, solo la referencia principal y sin el
  // número de colección de Kayali ("| 33").
  return p.imita.replace(/\s*\([^)]*\)/g, '').split(' / ')[0].replace(/\s*\|\s*\d+$/, '').trim();
}

const { perfumes } = JSON.parse(readFileSync(ORIGEN, 'utf8'));
const salida = {};
for (const p of perfumes) {
  const texto = normalizar(p.perfil);
  const datos = {
    i: inspiracionPublica(p),
    u: USO[p.uso],
    c: NOTAS.filter((n) => texto.includes(n)).join(' ') || undefined,
    r: p.categoria === 'A' || p.categoria === 'D' || (p.categoria === 'B' && p.similitud >= 85) ? 1 : undefined,
  };
  salida[p.id] = Object.fromEntries(Object.entries(datos).filter(([, v]) => v !== undefined));
}

writeFileSync(DESTINO, JSON.stringify(salida) + '\n', 'utf8');
const n = Object.values(salida);
console.log(`${DESTINO}: ${n.length} perfumes · ${n.filter((d) => d.i).length} con inspiración · ${n.filter((d) => d.r).length} destacados`);
