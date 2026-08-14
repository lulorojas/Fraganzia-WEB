// scripts/apply-gamma-images.mjs
// Aplica las imágenes extraídas de la presentación Gamma a los productos de Firestore.
// Solo actualiza productos que aún no tienen imagen (imagenes: []).
// Uso: node scripts/apply-gamma-images.mjs

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, 'serviceAccount.json'), 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// Mapeo: substring del nombre del producto (UPPERCASE) → URL de imagen
// Se usa el PRIMER match que encuentre en el nombre del doc de Firestore.
const MAP = [
  // ── Afnan ──────────────────────────────────────────────────────────────────
  ['AFNAN 9AM BLANCO',
    'https://dxbperfume.co.uk/cdn/shop/files/AFNAN_9AM_HR2.jpg?v=1704382646&width=2000'],

  // ── Al Haramain ────────────────────────────────────────────────────────────
  // (la mayoría ya fue resuelta por parfumo; solo los que aún faltan)

  // ── Al Wataniah ────────────────────────────────────────────────────────────
  ['AL WATANIAH OUD MYSTERY INTENSE',
    'https://cdn.gamma.app/al71mod0a3v067z/79a1f45f245340ca87a029f295ecee01/original/oud-mystery-intense---al-wataniah-eau-de-parfum---perfume--rabe-masculino-7-2hg6t149mi.webp'],
  ['AL WATANIAH DURRAT AL AROOS',
    'https://cdn.gamma.app/al71mod0a3v067z/95b44a67a7a1490298a6ceb38be39e04/original/D_NQ_NP_890613-MLB84949572700_052025-O-perfume-arabe-original-al-wataniah-durrat-al-aroos-eau-de-parfum-85-ml.webp'],
  ['AL WATANIAH WATANI PURPLE',
    'https://cdn.gamma.app/al71mod0a3v067z/38dc94d577ae47f8b9a00f58de395b05/original/perfume_al_wataniah_watani_purple_eau_de_parfum_feminino_100ml_155936_550x550.jpg'],

  // ── Armaf ──────────────────────────────────────────────────────────────────
  ['ARMAF ETER DESERT BREEZE',
    'https://silkperfumes.cl/cdn/shop/files/armaf-eter-desert-breeze-edp-100ml-Silk-Perfumes.png?v=1746722325&width=1214'],
  ['ARMAF ETER DESERT ROSE',
    'https://attoperfumes.com.co/cdn/shop/files/Armaf-Eter-Desert-Rose.jpg?v=1724695659'],
  ['ARMAF ODYSSEY BAHAMAS',
    'https://cdn.gamma.app/al71mod0a3v067z/8f75a71d576141f789df34bc94f6c3a3/original/Armaf-Odyssey-Bahamas.webp'],
  ['ARMAF ODYSSEY HOMME WHITE',
    'https://www.eliteperfumes.cl/cdn/shop/files/armaf-armaf-odyssey-homme-white-edit-edp-100-ml-h-32062591369252_1200x1200.png?v=1707488712'],
  ['ARMAF ODYSSEY MANDARIN SKY VINTAGE',
    'https://www.eliteperfumes.cl/cdn/shop/files/armaf-armaf-odyssey-mandarin-sky-limited-edit-edp-100-ml-h-32062291804196.png?v=1707484933&width=1214'],
  ['ARMAF ODYSSEY REVOLUTION',
    'https://cdn.gamma.app/al71mod0a3v067z/74989e4be5ce47d6a8fa13efd4394769/original/Armaf-Odyssey-Revolution.webp'],

  // ── Emper ──────────────────────────────────────────────────────────────────
  ['EMPER STALLION 53',
    'https://i5.walmartimages.com/asr/1f7502a4-7f49-43dd-9d8e-33f24b705099.6133ff875cb9ca254f87d3c348d24d99.jpeg'],

  // ── Fragrance World ────────────────────────────────────────────────────────
  ['FRAGRANCE WORLD HAYAATI BEAU',
    'https://cdn.gamma.app/al71mod0a3v067z/99a4b8f9b15044c69ee26ca907f99820/original/Fragrance-World-Hayaati-EDP-100-ml-JPG-Le-Beau-for-Men.webp'],
  ['FRAGRANCE WORLD HAYAATI',
    'https://cdn.gamma.app/al71mod0a3v067z/33d568ea34594f5db601c1a90281d9b5/original/fragrance-world-hayaati-edp-100ml-Silk-Perfumes.webp'],
  ['FRAGRANCE WORLD PROUD OF YOU ABSOLUTE',
    'https://cdn.gamma.app/al71mod0a3v067z/7259ca6a97714c96b0c6c0e690a8ef3e/original/ProudOfYouAbsoluteEauDeParfum.webp'],

  // ── French Avenue ──────────────────────────────────────────────────────────
  ['FRENCH AVENUE PINNACE NOIR',  // ya tiene parfumo, pero por si acaso
    'https://cdn.gamma.app/al71mod0a3v067z/d9b30b60e44b41dcb43a5a3d78690ab5/original/french-avenue-pinnace-noir-edp-m-100ml.jpg'],
  ['FRENCH AVENUE PINNACE',
    'https://cdn.gamma.app/al71mod0a3v067z/cde2542a78fe438e896c85b245b194b1/original/pinnace.webp'],

  // ── Lattafa ────────────────────────────────────────────────────────────────
  ['LATTAFA AL QIAM GOLD',
    'https://cdn.gamma.app/al71mod0a3v067z/7369ae744d9044269792ce9259b406d1/original/lattafa-al-qiam-gold_1024x1024.webp'],
  ['LATTAFA AMEER AL OUDH INTENSE',
    'https://xmarket.com.py/cdn/shop/files/lattafa-ameer-al-oudh-intense-oud-edp-100ml.webp?v=1733862093&width=1946'],
  ['LATTAFA ANSAAM GOLD',
    'https://cdn.shopify.com/s/files/1/0259/7733/products/lattafa-ansaam-gold_1024x1024.png?v=1681186942'],
  ['LATTAFA ANSAAM SILVER',
    'https://cdn.shopify.com/s/files/1/0259/7733/products/lattafa-ansaam-silver_1024x1024.png?v=1681187215'],
  ['LATTAFA ART OF NATURE I',
    'https://cdn.gamma.app/al71mod0a3v067z/b406e1485d7a4b608b30ecd9e57f06d5/original/lattafa-pride-art-of-nature-i-1_2048x.webp'],
  ['LATTAFA ASDAAF AMEERAT AL ARAB PRIVE ROSE',
    'https://cdn.gamma.app/al71mod0a3v067z/6958dbc69551421faecd5e1c7dc18abe/original/image.png'],
  ['LATTAFA ASDAAF AMEERAT AL ARAB',
    'https://www.perfumenz.co.nz/cdn/shop/files/asdaaf-ameerat-al-arab_1024x1024.png?v=1719199314'],
  ['LATTAFA ISHQ AL SHUYUKH GOLD',
    'https://www.perfumenz.co.nz/cdn/shop/products/lattafa-ishq-al-shuyukh-gold_1024x1024.png?v=1681264610'],
  ['LATTAFA MAAHIR BLACK',
    'https://cdn.shopify.com/s/files/1/0259/7733/products/lattafa-maahir-black_1024x1024.png?v=1667790076'],
  ['LATTAFA QIMMAH WOMAN',
    'https://a.allegroimg.com/original/116e1a/1dd8ce6d4df298d2a00d09483378/Lattafa-Qimmah-For-Woman-100-ml-EDP'],
  ['LATTAFA QIMMAH',
    'https://cdn.gamma.app/al71mod0a3v067z/3611d5e4a7ee499b8a7d4d07bd8ebc77/original/lattafa-qimmah-man_1024x1024.webp'],
  ['LATTAFA RAMZ SILVER',
    'https://www.perfumenz.co.nz/cdn/shop/products/lattafa-ramz-silver_1024x1024.png?v=1679544610'],
  ['LATTAFA VINTAGE RADIO',
    'https://emiratesoud.co.uk/cdn/shop/files/Vintage-Radio-Perfume-100ml-EDP-Lattafa-Pride-138610860.jpg?v=1720732438&width=1445'],
  ['LATTAFA WAJOOD',
    'https://www.intenseoud.com/cdn/shop/files/1_d5ebdafa-1278-4b8c-9906-8aab93a7b54f.jpg?v=1736023538'],
  ['LATTAFA YARA ROSA',
    'https://olvio.co.uk/cdn/shop/files/Lattafa_Yara_Pink_Perfume_100ml_EDP_Box_and_Bottle_for_Women.png?v=1730565621'],

  // ── Maison Alhambra ────────────────────────────────────────────────────────
  ['MAISON ALHAMBRA BAROQUE ROUGE 540',
    'https://images.tcdn.com.br/img/img_prod/626030/boroque_rouge_540_maison_alhambra_eau_de_parfum_100_ml_6157_1_9a9a13188fe6d1de83f93063fc4e219d.jpg'],
  ['MAISON ALHAMBRA BAROQUE ROUGE EXTREME',
    'https://productosdelujo.cl/cdn/shop/files/BaroqueRougeExtremeMaisonAlhambraEdp100MLUnisex_2048x.jpg?v=1722524774'],
  ['MAISON ALHAMBRA JEAN LOWE NOUVEAU',
    'https://cdn.gamma.app/al71mod0a3v067z/f61d78cb04154b3981cd622cd5ceb47d/original/nouveau.jpg'],
  ['MAISON ALHAMBRA PHILOS ROSSO',
    'https://cdn.gamma.app/al71mod0a3v067z/a7b4c3f43f1c46f48299ab982a947077/original/Eau-de-Parfum-Philos-ROSSO-Maison-Alhambra-100ml.jpg'],
  ['MAISON ALHAMBRA SALVO ELIXIR',
    'https://www.eliteperfumes.cl/cdn/shop/files/maison-alhambra-maison-alhambra-salvo-elixir-edp-60-ml-h-32375438049316.png?v=1712092029&width=1214'],
  ['MAISON ALHAMBRA SALVO EDP',
    'https://a.allegroimg.com/original/112eec/7ebb26c54d108a16b405a5320653/Maison-Alhambra-Salvo-EDP-100ml-dla-Mezczyzn-Arabic-Perfumes'],
  ['MAISON ALHAMBRA YEAH! MAN',
    'https://www.eliteperfumes.cl/cdn/shop/files/maison-alhambra-maison-alhambra-yeah-hombre-edp-100-ml-h-32991648874532.jpg?v=1720216344&width=1500'],
  ['MAISON ALHAMBRA YEAH! PARFUM',
    'https://cdn.gamma.app/al71mod0a3v067z/fde4cdf0ea73465b8e561fe1a54070f0/original/YEAHPARFUM_2_2048x.webp'],

  // ── Rasasi ─────────────────────────────────────────────────────────────────
  ['RASASI HAWAS FOR HIM KOBRA',
    'https://cdn.gamma.app/al71mod0a3v067z/7cbf99b7e88847128ee901c9bbc048cb/original/perfume_hawas_kobra_rasasi_100ml_masculino.webp'],
  ['RASASI SHUHRAH',
    'https://cdn.gamma.app/al71mod0a3v067z/761b9bed92454414806e0237da9f0601/original/RASASI-SHUHRAH-EDP-90-ML-FOR-MEN-1.png'],
];

// ── Main ─────────────────────────────────────────────────────────────────────
const snapshot = await db.collection('perfumes').get();
let updated = 0;
let skipped = 0;

for (const doc of snapshot.docs) {
  const data  = doc.data();
  const name  = (data.nombre || '').toUpperCase();

  // Solo actualizar los que no tienen imagen
  if (data.imagenes?.length > 0) continue;

  // Buscar el primer mapeo cuya clave esté contenida en el nombre del producto
  const entry = MAP.find(([key]) => name.includes(key));
  if (!entry) { skipped++; continue; }

  await doc.ref.update({ imagenes: [entry[1]] });
  updated++;
  console.log(`✅ ${data.nombre}`);
}

console.log(`\n🎉 Listo: ${updated} actualizados, ${skipped} sin mapeo disponible.`);
process.exit(0);
