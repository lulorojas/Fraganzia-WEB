// Bot diario: lee el catálogo mayorista del proveedor, actualiza precioUSD y
// da de alta los perfumes nuevos. Corre en GitHub Actions (bot-proveedor.yml).
//   node tools/bot-proveedor.mjs [--dry-run] [--forzar] [--pdf archivo.pdf] [--catalogo perfumes.json]
// Con --catalogo no se toca Firestore (solo simula). --forzar saltea solo el tope de % de cambios.
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import {
  descargarPdf,
  hashPdf,
  leerFilasDelPdf,
  extraerImagenesCrudas,
  asociarImagenes,
  cruzar,
  motivoDeAborto,
} from './lib/catalogo-proveedor.mjs';

const DIR_FOTOS_NUEVAS = 'public/productos-bot';
const toSlug = (nombre) => nombre.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const args = process.argv.slice(2);
const valorDe = (flag) => args[args.indexOf(flag) + 1];
const catalogoLocal = args.includes('--catalogo') ? JSON.parse(readFileSync(valorDe('--catalogo'), 'utf8')) : null;
const dryRun = args.includes('--dry-run') || Boolean(catalogoLocal);

function credencial() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  if (existsSync('tools/serviceAccount.json')) return JSON.parse(readFileSync('tools/serviceAccount.json', 'utf8'));
  throw new Error('falta FIREBASE_SERVICE_ACCOUNT o tools/serviceAccount.json');
}

// WhatsApp a través de CallMeBot (manda mensajes al propio número registrado).
async function avisar(asunto, texto) {
  const { CALLMEBOT_PHONE, CALLMEBOT_APIKEY } = process.env;
  const mensaje = `${asunto}\n\n${texto}`.slice(0, 1200);
  if (!CALLMEBOT_PHONE || !CALLMEBOT_APIKEY) return console.log(`(sin WhatsApp) ${mensaje}`);
  const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(CALLMEBOT_PHONE)}&apikey=${encodeURIComponent(CALLMEBOT_APIKEY)}&text=${encodeURIComponent(mensaje)}`;
  const res = await fetch(url);
  if (!res.ok) console.error(`CallMeBot respondió ${res.status}`);
}

function resumen(r) {
  const linea = (c) => `  ${c.nombre}: ${c.anterior ?? '-'} -> ${c.nuevo} USD`;
  const publicados = r.nuevos.filter((n) => n.imagenBuffer).length;
  return [
    `Nuevos ingresos: ${r.nuevos.length} (${publicados} publicados con foto automática, ${r.nuevos.length - publicados} ocultos: pedile al asistente "cargá los nuevos")`,
    ...r.nuevos.slice(0, 20).map((n) => `  ${n.nombre}: ${n.precioUSD} USD${n.genero ? ` (${n.genero})` : ''}`),
    r.nuevos.length > 20 ? `  ... y ${r.nuevos.length - 20} más` : '',
    `Precios actualizados: ${r.cambios.length}`,
    r.omitidos.length ? `Omitidos: ${r.omitidos.length}` : '',
    ...r.omitidos.slice(0, 10).map((o) => `  ${o.nombre} (${o.motivo})`),
    r.ambiguos.length ? `Ambiguos (más de un perfume con ese nombre): ${r.ambiguos.slice(0, 10).join(', ')}` : '',
    ...r.cambios.slice(0, 60).map(linea),
    r.cambios.length > 60 ? `  ... y ${r.cambios.length - 60} más` : '',
  ].filter(Boolean).join('\n');
}

async function main() {
  const pdf = args.includes('--pdf') ? readFileSync(valorDe('--pdf')) : await descargarPdf();
  const hash = hashPdf(pdf);

  let db;
  let perfumes = catalogoLocal;
  if (!catalogoLocal) {
    initializeApp({ credential: cert(credencial()) });
    db = getFirestore();
    const config = await db.doc('config/botProveedor').get();
    if (!dryRun && config.exists && config.data().hash === hash) return console.log('catálogo sin cambios');
    perfumes = (await db.collection('perfumes').get()).docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  const filas = asociarImagenes(await leerFilasDelPdf(pdf), extraerImagenesCrudas(pdf));
  const resultado = cruzar(filas, perfumes);
  const aborto = motivoDeAborto(filas, resultado, perfumes.length, { forzar: args.includes('--forzar') });
  if (aborto) {
    await avisar('Fraganzia: el bot de precios NO aplicó cambios', `Motivo: ${aborto}\n\n${resumen(resultado)}`);
    throw new Error(`abortado: ${aborto}`);
  }

  console.log(`${dryRun ? '[dry-run] ' : ''}${filas.length} filas en el PDF\n${resumen(resultado)}`);
  if (dryRun) {
    await avisar('Fraganzia: simulación del bot de precios (no se aplicó nada)', resumen(resultado));
    return;
  }

  const ahora = FieldValue.serverTimestamp();
  const lote = [
    ...resultado.cambios.map((c) => (b) =>
      b.update(db.doc(`perfumes/${c.id}`), { precioUSD: c.nuevo, ultimaActualizacionPrecios: ahora, updatedAt: ahora })),
    ...resultado.nuevos.map((n) => (b) => {
      let imagenes = [];
      if (n.imagenBuffer) {
        mkdirSync(DIR_FOTOS_NUEVAS, { recursive: true });
        const archivo = `${toSlug(n.nombre)}.jpg`;
        writeFileSync(join(DIR_FOTOS_NUEVAS, archivo), n.imagenBuffer);
        imagenes = [`/productos-bot/${archivo}`];
      }
      b.set(db.collection('perfumes').doc(), {
        nombre: n.nombre,
        marca: n.marca,
        ...(n.genero && { genero: n.genero }),
        volumenML: n.volumenML,
        precioUSD: n.precioUSD,
        imagenes,
        activo: true,
        // Con foto emparejada con confianza se publica solo; sin ella queda
        // oculto como antes (familia, notas y descripción igual se cargan a mano).
        disponible: imagenes.length > 0,
        pendienteCarga: true,
        destacado: false,
        ultimaActualizacionPrecios: ahora,
        createdAt: ahora,
        updatedAt: ahora,
      });
    }),
  ];
  for (let i = 0; i < lote.length; i += 400) {
    const batch = db.batch();
    lote.slice(i, i + 400).forEach((op) => op(batch));
    await batch.commit();
  }

  const fecha = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
  // Los buffers de foto no van a Firestore (no son serializables ni hace falta guardarlos).
  const nuevosSinBuffer = resultado.nuevos.map(({ imagenBuffer, ...n }) => n);
  await db.doc(`botProveedorLog/${fecha}`).set({ hash, ...resultado, nuevos: nuevosSinBuffer, creadoEn: ahora });
  await db.doc('config/botProveedor').set({ hash, ultimaCorrida: ahora });

  if (resultado.cambios.length || resultado.nuevos.length) {
    await avisar(
      `Fraganzia: ${resultado.cambios.length} precios y ${resultado.nuevos.length} perfumes nuevos`,
      resumen(resultado)
    );
  }
}

main().catch(async (err) => {
  console.error(err.message);
  if (!String(err.message).startsWith('abortado')) {
    await avisar('Fraganzia: falló el bot de precios', err.stack ?? err.message).catch(() => {});
  }
  process.exit(1);
});
