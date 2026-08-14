// scripts/seed.js
// Script de seed para poblar Firestore con datos del CatÃ¡logo Ãrabes Mayorista (13-07).
// Requiere: scripts/serviceAccount.json (descargado de Firebase Console â†’ Project Settings â†’ Service accounts)
// Uso: node scripts/seed.js

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync(join(__dirname, 'serviceAccount.json'), 'utf8'));
} catch {
  console.error('âŒ No se encontrÃ³ scripts/serviceAccount.json');
  console.error('   Descargalo desde Firebase Console â†’ Project Settings â†’ Service accounts â†’ Generate new private key');
  process.exit(1);
}

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const ADMIN_UID  = 'hWsTYA5cWse2TpmziUKxyAiHJ9O2';
const ADMIN_EMAIL = 'lulorojas11@gmail.com';

// Bestsellers marcados en la portada del catÃ¡logo
const DESTACADOS = new Set([
  'ARMAF ODYSSEY MANDARIN SKY',
  'LATTAFA YARA ROSA',
  'EMPER UOMO INTENSE',
  'RAYHAAN AZUL',
  'EMPER DONNA INTENSE',
  'LATTAFA KHAMRAH',
  'LATTAFA KHAMRAH WAHA',
  'LATTAFA YARA MOI',
  'AFNAN 9PM',
  'LATTAFA ECLAIRE',
]);

function p(nombre, marca, genero, familia, precioUSD, volumenML) {
  const key = nombre.replace(/\s+\d+ML$/, '').replace(/\s+\d+ML$/, '');
  return {
    nombre,
    marca,
    genero,
    familiaOlfativa: familia,
    descripcion: '',
    notasSalida: [],
    notasCorazon: [],
    notasFondo: [],
    precioUSD,
    volumenML,
    imagenes: [],
    destacado: DESTACADOS.has(key),
    disponible: true,
    activo: true,
  };
}

const PERFUMES = [
  // â”€â”€â”€ MASCULINOS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // AFNAN
  p('AFNAN 9AM DIVE 100ML',                     'Afnan',           'Masculino', 'AcuÃ¡tico',  34, 100),
  p('AFNAN 9PM 100ML',                           'Afnan',           'Masculino', 'Oriental',  30, 100),
  p('AFNAN 9PM ELIXIR PARFUM 100ML',             'Afnan',           'Masculino', 'Oriental',  49, 100),
  p('AFNAN 9PM NIGHT OUT 100ML',                 'Afnan',           'Masculino', 'Oriental',  65, 100),
  p('AFNAN 9PM REBEL 100ML',                     'Afnan',           'Masculino', 'Oriental',  45, 100),
  p('AFNAN HISTORIC OLMEDA 100ML',               'Afnan',           'Masculino', 'Amaderado', 33, 100),
  p('AFNAN SUPREMACY COLLECTOR\'S EDITION 100ML','Afnan',           'Masculino', 'Especiado', 67, 100),
  p('AFNAN SUPREMACY NOT ONLY INTENSE 100ML',    'Afnan',           'Masculino', 'Especiado', 54, 100),
  p('AFNAN TURATHI BLUE 90ML',                   'Afnan',           'Masculino', 'AcuÃ¡tico',  39, 90),
  p('AFNAN TURATHI ELECTRIC 90ML',               'Afnan',           'Masculino', 'AromÃ¡tico', 41, 90),
  // AL HARAMAIN
  p('AL HARAMAIN AMBER OUD AQUA DUBAI 100ML',    'Al Haramain',     'Masculino', 'AcuÃ¡tico',  61, 100),
  p('AL HARAMAIN AMBER OUD BLACK 60ML',          'Al Haramain',     'Masculino', 'Oriental',  59,  60),
  p('AL HARAMAIN AMBER OUD CARBON EDITION 100ML','Al Haramain',     'Masculino', 'Amaderado', 56, 100),
  p('AL HARAMAIN AMBER OUD DUBAI NIGHT 100ML',   'Al Haramain',     'Masculino', 'Oriental',  57, 100),
  p('AL HARAMAIN AMBER OUD EXCLUSIF EMERALD 60ML','Al Haramain',    'Masculino', 'Amaderado', 57,  60),
  p('AL HARAMAIN AMBER OUD EXCLUSIF PARFUM CLASSIC 60ML','Al Haramain','Masculino','Oriental',62, 60),
  p('AL HARAMAIN AMBER OUD GOLD EDITION 120ML',  'Al Haramain',     'Masculino', 'Oriental',  62, 120),
  p('AL HARAMAIN AMBER OUD GOLD EDITION 200ML',  'Al Haramain',     'Masculino', 'Oriental',  88, 200),
  p('AL HARAMAIN AMBER OUD PRIVATE EDITION 120ML','Al Haramain',    'Masculino', 'Oriental',  62, 120),
  p('AL HARAMAIN AMBER OUD ROUGE 120ML',         'Al Haramain',     'Masculino', 'Oriental',  50, 120),
  p('AL HARAMAIN AMBER OUD TOBACCO 60ML',        'Al Haramain',     'Masculino', 'Especiado', 57,  60),
  p('AL HARAMAIN DETOUR ECO 100ML',              'Al Haramain',     'Masculino', 'CÃ­trico',   27, 100),
  p('AL HARAMAIN DETOUR NOIR 100ML',             'Al Haramain',     'Masculino', 'Amaderado', 29, 100),
  p('AL HARAMAIN DETOUR NOIR EXCLUSIF 100ML',    'Al Haramain',     'Masculino', 'Amaderado', 29, 100),
  p('AL HARAMAIN DETOUR NOIR INTENSE 100ML',     'Al Haramain',     'Masculino', 'Amaderado', 31, 100),
  p('AL HARAMAIN L\'AVENTURE 100ML',             'Al Haramain',     'Masculino', 'AromÃ¡tico', 42, 100),
  // AL WATANIAH
  p('AL WATANIAH AL LAYL 100ML',                 'Al Wataniah',     'Masculino', 'Oriental',  20, 100),
  p('AL WATANIAH ATTAR AL WESAL 100ML',          'Al Wataniah',     'Masculino', 'Oriental',  21, 100),
  p('AL WATANIAH BAREEQ AL DHAHAB 100ML',        'Al Wataniah',     'Masculino', 'Amaderado', 18, 100),
  p('AL WATANIAH KENZ AL MALIK 100ML',           'Al Wataniah',     'Masculino', 'Oriental',  23, 100),
  p('AL WATANIAH OUD MYSTERY INTENSE 100ML',     'Al Wataniah',     'Masculino', 'Oriental',  22, 100),
  p('AL WATANIAH ROSE MYSTERY INTENSE 100ML',    'Al Wataniah',     'Masculino', 'Floral',    22, 100),
  p('AL WATANIAH SPECIAL OUD 100ML',             'Al Wataniah',     'Masculino', 'Oriental',  20, 100),
  p('AL WATANIAH SULTAN AL LAIL 100ML',          'Al Wataniah',     'Masculino', 'Oriental',  19, 100),
  p('AL WATANIAH WATANI NOIR 100ML',             'Al Wataniah',     'Masculino', 'Amaderado', 20, 100),
  // ANFAR
  p('ANFAR ROYAL IMPERIAL 100ML',                'Anfar',           'Masculino', 'Oriental',  47, 100),
  // ARMAF MASCULINOS
  p('ARMAF CLUB DE NUIT BLING 75ML',             'Armaf',           'Masculino', 'Floral',    51,  75),
  p('ARMAF CLUB DE NUIT ICONIC 105ML',           'Armaf',           'Masculino', 'AromÃ¡tico', 45, 105),
  p('ARMAF CLUB DE NUIT INTENSE 105ML',          'Armaf',           'Masculino', 'AromÃ¡tico', 38, 105),
  p('ARMAF CLUB DE NUIT LIONHEART MAN 100ML',    'Armaf',           'Masculino', 'Amaderado', 41, 100),
  p('ARMAF CLUB DE NUIT MILESTONE 105ML',        'Armaf',           'Masculino', 'AromÃ¡tico', 36, 105),
  p('ARMAF CLUB DE NUIT PRECIEUX I 55ML',        'Armaf',           'Masculino', 'Oriental',  57,  55),
  p('ARMAF CLUB DE NUIT SILLAGE 105ML',          'Armaf',           'Masculino', 'Floral',    39, 105),
  p('ARMAF CLUB DE NUIT URBAN MAN ELIXIR 105ML', 'Armaf',           'Masculino', 'AromÃ¡tico', 43, 105),
  p('ARMAF ETER ARABIAN SKY 100ML',              'Armaf',           'Masculino', 'Oriental',  50, 100),
  p('ARMAF ETER DESERT BREEZE 100ML',            'Armaf',           'Masculino', 'AcuÃ¡tico',  50, 100),
  p('ARMAF ETER DESERT NIGHT 100ML',             'Armaf',           'Masculino', 'Oriental',  50, 100),
  p('ARMAF ETER MAGICAL OUD 100ML',              'Armaf',           'Masculino', 'Oriental',  45, 100),
  p('ARMAF ODYSSEY AOUD 100ML',                  'Armaf',           'Masculino', 'Oriental',  27, 100),
  p('ARMAF ODYSSEY AQUA 100ML',                  'Armaf',           'Masculino', 'AcuÃ¡tico',  39, 100),
  p('ARMAF ODYSSEY ARTISTO 100ML',               'Armaf',           'Masculino', 'Amaderado', 45, 100),
  p('ARMAF ODYSSEY BAHAMAS 100ML',               'Armaf',           'Masculino', 'AcuÃ¡tico',  36, 100),
  p('ARMAF ODYSSEY DUBAI CHOCOLAT 100ML',        'Armaf',           'Masculino', 'Gourmand',  18, 100),
  p('ARMAF ODYSSEY GO MANGO 100ML',              'Armaf',           'Masculino', 'CÃ­trico',   41, 100),
  p('ARMAF ODYSSEY HOMME FOR MEN 100ML',         'Armaf',           'Masculino', 'AromÃ¡tico', 29, 100),
  p('ARMAF ODYSSEY HOMME WHITE 100ML',           'Armaf',           'Masculino', 'AromÃ¡tico', 38, 100),
  p('ARMAF ODYSSEY LIMONI 100ML',                'Armaf',           'Masculino', 'CÃ­trico',   26, 100),
  p('ARMAF ODYSSEY MANDARIN SKY 100ML',          'Armaf',           'Masculino', 'CÃ­trico',   33, 100),
  p('ARMAF ODYSSEY MANDARIN SKY ELIXIR 100ML',   'Armaf',           'Masculino', 'CÃ­trico',   53, 100),
  p('ARMAF ODYSSEY MANDARIN SKY VINTAGE 100ML',  'Armaf',           'Masculino', 'CÃ­trico',   56, 100),
  p('ARMAF ODYSSEY MEGA LE 100ML',               'Armaf',           'Masculino', 'AromÃ¡tico', 27, 100),
  p('ARMAF ODYSSEY REVOLUTION 100ML',            'Armaf',           'Masculino', 'Amaderado', 26, 100),
  p('ARMAF ODYSSEY SPECTRA 100ML',               'Armaf',           'Masculino', 'AromÃ¡tico', 27, 100),
  p('ARMAF ODYSSEY TYRANT 100ML',                'Armaf',           'Masculino', 'Amaderado', 26, 100),
  p('ARMAF TAG HIM 100ML',                       'Armaf',           'Masculino', 'AromÃ¡tico', 31, 100),
  p('ARMAF TAG HIM UOMO ROSSO 100ML',            'Armaf',           'Masculino', 'Especiado', 32, 100),
  // BHARARA MASCULINOS
  p('BHARARA CHOCOLATE 100ML',                   'Bharara',         'Masculino', 'Gourmand',  50, 100),
  p('BHARARA DOUBLE BLEU 100ML',                 'Bharara',         'Masculino', 'AcuÃ¡tico',  50, 100),
  p('BHARARA KING EDP 100ML',                    'Bharara',         'Masculino', 'Oriental',  68, 100),
  p('BHARARA KING EDP 150ML',                    'Bharara',         'Masculino', 'Oriental',  81, 150),
  p('BHARARA KING GOLD 100ML',                   'Bharara',         'Masculino', 'Oriental',  80, 100),
  p('BHARARA KING PARFUM 100ML',                 'Bharara',         'Masculino', 'Oriental',  72, 100),
  p('BHARARA KING SOLEIL 100ML',                 'Bharara',         'Masculino', 'Amaderado', 78, 100),
  p('BHARARA NICHE PARFUM 100ML',                'Bharara',         'Masculino', 'Oriental',  60, 100),
  p('BHARARA MAST PERFUME ROME POUR HOMME 100ML','Bharara',         'Masculino', 'AromÃ¡tico', 54, 100),
  p('BHARARA VIKING BEIRUT 100ML',               'Bharara',         'Masculino', 'AromÃ¡tico', 58, 100),
  p('BHARARA VIKING DUBAI 100ML',                'Bharara',         'Masculino', 'Oriental',  69, 100),
  // DUMONT
  p('DUMONT NITRO INTENSE 100ML',                'Dumont',          'Masculino', 'Amaderado', 36, 100),
  p('DUMONT NITRO RED 100ML',                    'Dumont',          'Masculino', 'Especiado', 45, 100),
  p('DUMONT NITRO WHITE 100ML',                  'Dumont',          'Masculino', 'AromÃ¡tico', 42, 100),
  // EMPER MASCULINOS
  p('EMPER BLUE STALLION 100ML',                 'Emper',           'Masculino', 'AcuÃ¡tico',  30, 100),
  p('EMPER MANDORA 100ML',                       'Emper',           'Masculino', 'Especiado', 30, 100),
  p('EMPER PHANTOM MY HERO 100ML',               'Emper',           'Masculino', 'Amaderado', 22, 100),
  p('EMPER STALLION 53 100ML',                   'Emper',           'Masculino', 'AromÃ¡tico', 26, 100),
  p('EMPER UOMO INTENSE 100ML',                  'Emper',           'Masculino', 'AromÃ¡tico', 30, 100),
  // FRAGRANCE WORLD MASCULINOS
  p('FRAGRANCE WORLD HAYAATI 100ML',             'Fragrance World', 'Masculino', 'Amaderado', 21, 100),
  p('FRAGRANCE WORLD HAYAATI BEAU 100ML',        'Fragrance World', 'Masculino', 'Oriental',  24, 100),
  p('FRAGRANCE WORLD IMPERIUM 100ML',            'Fragrance World', 'Masculino', 'Especiado', 32, 100),
  p('FRAGRANCE WORLD PROUD OF YOU ABSOLUTE 100ML','Fragrance World','Masculino', 'Amaderado', 24, 100),
  p('FRAGRANCE WORLD SEDLEY 100ML',              'Fragrance World', 'Masculino', 'AromÃ¡tico', 24, 100),
  p('FRAGRANCE WORLD STAR MEN NEBULA 100ML',     'Fragrance World', 'Masculino', 'AromÃ¡tico', 21, 100),
  // FRENCH AVENUE MASCULINOS
  p('FRENCH AVENUE AETHER EXTRAIT 100ML',        'French Avenue',   'Masculino', 'Amaderado', 50, 100),
  p('FRENCH AVENUE ATLANTIS EXTRAIT 100ML',      'French Avenue',   'Masculino', 'AcuÃ¡tico',  51, 100),
  p('FRENCH AVENUE AZZURE AOUD 100ML',           'French Avenue',   'Masculino', 'Oriental',  30, 100),
  p('FRENCH AVENUE ESSENCE DE BLANC 100ML',      'French Avenue',   'Masculino', 'Amaderado', 47, 100),
  p('FRENCH AVENUE GENESIS AQUARIUS 90ML',       'French Avenue',   'Masculino', 'AcuÃ¡tico',  44,  90),
  p('FRENCH AVENUE GENESIS CAPRICORN 90ML',      'French Avenue',   'Masculino', 'AromÃ¡tico', 44,  90),
  p('FRENCH AVENUE GENESIS GEMINI 90ML',         'French Avenue',   'Masculino', 'AromÃ¡tico', 44,  90),
  p('FRENCH AVENUE GENESIS PISCES 90ML',         'French Avenue',   'Masculino', 'AcuÃ¡tico',  44,  90),
  p('FRENCH AVENUE GENESIS SCORPIO 90ML',        'French Avenue',   'Masculino', 'Especiado', 44,  90),
  p('FRENCH AVENUE GENESIS TAURUS 90ML',         'French Avenue',   'Masculino', 'Amaderado', 44,  90),
  p('FRENCH AVENUE GENESIS VIRGO 90ML',          'French Avenue',   'Masculino', 'Verde',     44,  90),
  p('FRENCH AVENUE LIQUID BRUN 100ML',           'French Avenue',   'Masculino', 'Amaderado', 50, 100),
  p('FRENCH AVENUE PINNACE NOIR 100ML',          'French Avenue',   'Masculino', 'AromÃ¡tico', 45, 100),
  p('FRENCH AVENUE SPECTRE GHOST 80ML',          'French Avenue',   'Masculino', 'AcuÃ¡tico',  47,  80),
  p('FRENCH AVENUE SPECTRE WRAITH 80ML',         'French Avenue',   'Masculino', 'Amaderado', 49,  80),
  // KHADLAJ
  p('KHADLAJ ISLAND 100ML',                      'Khadlaj',         'Masculino', 'AcuÃ¡tico',  38, 100),
  // L'AFFAIR
  p('L\'AFFAIR SUMMER SHOCKWAVE 100ML',          "L'Affair",        'Masculino', 'CÃ­trico',   36, 100),
  // LATTAFA MASCULINOS
  p('LATTAFA ADEEB 80ML',                        'Lattafa',         'Masculino', 'Amaderado', 23,  80),
  p('LATTAFA AJWAA 90ML',                        'Lattafa',         'Masculino', 'Oriental',  40,  90),
  p('LATTAFA AL NOBLE AMEER 100ML',              'Lattafa',         'Masculino', 'Amaderado', 28, 100),
  p('LATTAFA AL NOBLE SAFEER 100ML',             'Lattafa',         'Masculino', 'Amaderado', 27, 100),
  p('LATTAFA AL NOBLE WAZEER 100ML',             'Lattafa',         'Masculino', 'Amaderado', 24, 100),
  p('LATTAFA AL QIAM GOLD 100ML',                'Lattafa',         'Masculino', 'Oriental',  29, 100),
  p('LATTAFA AMEER AL OUDH INTENSE 100ML',       'Lattafa',         'Masculino', 'Oriental',  19, 100),
  p('LATTAFA ANSAAM SILVER 100ML',               'Lattafa',         'Masculino', 'AromÃ¡tico', 34, 100),
  p('LATTAFA ART OF NATURE I 100ML',             'Lattafa',         'Masculino', 'AromÃ¡tico', 45, 100),
  p('LATTAFA ART OF NATURE II 100ML',            'Lattafa',         'Masculino', 'Amaderado', 38, 100),
  p('LATTAFA ART OF UNIVERSE 100ML',             'Lattafa',         'Masculino', 'Oriental',  38, 100),
  p('LATTAFA ASAD 100ML',                        'Lattafa',         'Masculino', 'Amaderado', 30, 100),
  p('LATTAFA ASAD BOURBON 100ML',                'Lattafa',         'Masculino', 'Amaderado', 38, 100),
  p('LATTAFA ASAD ELIXIR 100ML',                 'Lattafa',         'Masculino', 'Amaderado', 38, 100),
  p('LATTAFA ASAD ZANZIBAR 100ML',               'Lattafa',         'Masculino', 'Especiado', 23, 100),
  p('LATTAFA ASDAAF AMEER AL ARAB IMPERIUM 100ML','Lattafa',        'Masculino', 'Oriental',  22, 100),
  p('LATTAFA ATLAS 55ML',                        'Lattafa',         'Masculino', 'AromÃ¡tico', 34,  55),
  p('LATTAFA BADE\'E AL OUD AMETHYST 100ML',     'Lattafa',         'Masculino', 'Oriental',  24, 100),
  p('LATTAFA BADE\'E AL OUD FOR GLORY 100ML',    'Lattafa',         'Masculino', 'Oriental',  24, 100),
  p('LATTAFA BADE\'E AL OUD HONOR & GLORY 100ML','Lattafa',         'Masculino', 'Oriental',  26, 100),
  p('LATTAFA BADE\'E AL OUD SUBLIME 100ML',      'Lattafa',         'Masculino', 'Amaderado', 27, 100),
  p('LATTAFA CONFIDENTIAL PRIVATE GOLD 100ML',   'Lattafa',         'Masculino', 'Oriental',  21, 100),
  p('LATTAFA EMEER 100ML',                       'Lattafa',         'Masculino', 'Especiado', 42, 100),
  p('LATTAFA FAKHAR BLACK 100ML',                'Lattafa',         'Masculino', 'Oriental',  30, 100),
  p('LATTAFA FAKHAR EXTRAIT GOLD 100ML',         'Lattafa',         'Masculino', 'Oriental',  26, 100),
  p('LATTAFA FAKHAR PLATIN 100ML',               'Lattafa',         'Masculino', 'Amaderado', 26, 100),
  p('LATTAFA HAYAATI AL MALEKY 100ML',           'Lattafa',         'Masculino', 'Amaderado', 20, 100),
  p('LATTAFA HAYAATI 100ML',                     'Lattafa',         'Masculino', 'Oriental',  19, 100),
  p('LATTAFA HAYAATI GOLD ELIXIR 100ML',         'Lattafa',         'Masculino', 'Oriental',  18, 100),
  p('LATTAFA HIS CONFESSION 100ML',              'Lattafa',         'Masculino', 'Amaderado', 38, 100),
  p('LATTAFA ISHQ AL SHUYUKH GOLD 100ML',        'Lattafa',         'Masculino', 'Oriental',  30, 100),
  p('LATTAFA ISHQ AL SHUYUKH SILVER 100ML',      'Lattafa',         'Masculino', 'Oriental',  33, 100),
  p('LATTAFA KHAMRAH DUKHAN 100ML',              'Lattafa',         'Masculino', 'Especiado', 26, 100),
  p('LATTAFA KHAMRAH 100ML',                     'Lattafa',         'Masculino', 'Especiado', 28, 100),
  p('LATTAFA KHAMRAH QAHWA 100ML',               'Lattafa',         'Masculino', 'Especiado', 27, 100),
  p('LATTAFA KHAMRAH WAHA 100ML',                'Lattafa',         'Masculino', 'Oriental',  69, 100),
  p('LATTAFA KHANJAR 85ML',                      'Lattafa',         'Masculino', 'Oriental',  53,  85),
  p('LATTAFA LAIL MALEKI 100ML',                 'Lattafa',         'Masculino', 'Oriental',  18, 100),
  p('LATTAFA LIAM BLUE SHINE 100ML',             'Lattafa',         'Masculino', 'AcuÃ¡tico',  45, 100),
  p('LATTAFA LIAM GREY 100ML',                   'Lattafa',         'Masculino', 'AromÃ¡tico', 27, 100),
  p('LATTAFA MAAHIR BLACK 100ML',                'Lattafa',         'Masculino', 'Oriental',  28, 100),
  p('LATTAFA MAAHIR GOLD 100ML',                 'Lattafa',         'Masculino', 'Oriental',  30, 100),
  p('LATTAFA MAAHIR LEGACY 100ML',               'Lattafa',         'Masculino', 'Amaderado', 28, 100),
  p('LATTAFA MASHRABYA 100ML',                   'Lattafa',         'Masculino', 'Oriental',  24, 100),
  p('LATTAFA NEBRAS 100ML',                      'Lattafa',         'Masculino', 'Amaderado', 39, 100),
  p('LATTAFA NICHE EMARATI AL DANA 100ML',       'Lattafa',         'Masculino', 'Oriental',  53, 100),
  p('LATTAFA OPULENT OUD 100ML',                 'Lattafa',         'Masculino', 'Oriental',  18, 100),
  p('LATTAFA PRIDE PISA 100ML',                  'Lattafa',         'Masculino', 'Amaderado', 45, 100),
  p('LATTAFA QAED AL FURSAN 90ML',               'Lattafa',         'Masculino', 'AromÃ¡tico', 21,  90),
  p('LATTAFA QAED AL FURSAN UNLIMITED 90ML',     'Lattafa',         'Masculino', 'AcuÃ¡tico',  18,  90),
  p('LATTAFA QIMMAH 100ML',                      'Lattafa',         'Masculino', 'Oriental',  19, 100),
  p('LATTAFA RAMZ SILVER 100ML',                 'Lattafa',         'Masculino', 'AromÃ¡tico', 19, 100),
  p('LATTAFA SHAHEEN GOLD 100ML',                'Lattafa',         'Masculino', 'Oriental',  28, 100),
  p('LATTAFA SHAHEEN SILVER 100ML',              'Lattafa',         'Masculino', 'Amaderado', 30, 100),
  p('LATTAFA TERIAQ INTENSE 100ML',              'Lattafa',         'Masculino', 'Especiado', 41, 100),
  p('LATTAFA THE KINGDOM MASCULINO 100ML',       'Lattafa',         'Masculino', 'Amaderado', 30, 100),
  p('LATTAFA VINTAGE RADIO 100ML',               'Lattafa',         'Masculino', 'AromÃ¡tico', 28, 100),
  p('LATTAFA WAJOOD 100ML',                      'Lattafa',         'Masculino', 'Oriental',  47, 100),
  // MAISON ALHAMBRA MASCULINOS
  p('MAISON ALHAMBRA ALPINE HOMME SPORT 100ML',  'Maison Alhambra', 'Masculino', 'AromÃ¡tico', 26, 100),
  p('MAISON ALHAMBRA FLAMING ELIXIR 80ML',       'Maison Alhambra', 'Masculino', 'Especiado', 22,  80),
  p('MAISON ALHAMBRA GLACIER BOLD 100ML',        'Maison Alhambra', 'Masculino', 'AcuÃ¡tico',  22, 100),
  p('MAISON ALHAMBRA GLACIER POUR HOMME 100ML',  'Maison Alhambra', 'Masculino', 'AcuÃ¡tico',  23, 100),
  p('MAISON ALHAMBRA JEAN LOWE NOUVEAU 100ML',   'Maison Alhambra', 'Masculino', 'Amaderado', 27, 100),
  p('MAISON ALHAMBRA JEAN LOWE IMMORTAL 100ML',  'Maison Alhambra', 'Masculino', 'AromÃ¡tico', 27, 100),
  p('MAISON ALHAMBRA JEAN LOWE NOIR 100ML',      'Maison Alhambra', 'Masculino', 'Oriental',  30, 100),
  p('MAISON ALHAMBRA JORGE DI PROFUMO AQUA 100ML','Maison Alhambra','Masculino', 'AcuÃ¡tico',  23, 100),
  p('MAISON ALHAMBRA JORGE DI PROFUMO DEEP BLUE 100ML','Maison Alhambra','Masculino','AcuÃ¡tico',19,100),
  p('MAISON ALHAMBRA KISMET FOR MEN 100ML',      'Maison Alhambra', 'Masculino', 'Amaderado', 29, 100),
  p('MAISON ALHAMBRA OPULENCE LEATHER 100ML',    'Maison Alhambra', 'Masculino', 'Amaderado', 28, 100),
  p('MAISON ALHAMBRA PACIFIC BLUE 80ML',         'Maison Alhambra', 'Masculino', 'AcuÃ¡tico',  24,  80),
  p('MAISON ALHAMBRA PHILOS PURA 100ML',         'Maison Alhambra', 'Masculino', 'AromÃ¡tico', 27, 100),
  p('MAISON ALHAMBRA PHILOS ROSSO 100ML',        'Maison Alhambra', 'Masculino', 'Especiado', 18, 100),
  p('MAISON ALHAMBRA SALVO EDP 100ML',           'Maison Alhambra', 'Masculino', 'CÃ­trico',   23, 100),
  p('MAISON ALHAMBRA SALVO ELIXIR 60ML',         'Maison Alhambra', 'Masculino', 'Amaderado', 21,  60),
  p('MAISON ALHAMBRA SCEPTRE MALACHITE 100ML',   'Maison Alhambra', 'Masculino', 'Amaderado', 30, 100),
  p('MAISON ALHAMBRA TERRA 50ML',                'Maison Alhambra', 'Masculino', 'Amaderado', 21,  50),
  p('MAISON ALHAMBRA THE MYTH 100ML',            'Maison Alhambra', 'Masculino', 'Oriental',  21, 100),
  p('MAISON ALHAMBRA VICTORIOSO 100ML',          'Maison Alhambra', 'Masculino', 'AromÃ¡tico', 26, 100),
  p('MAISON ALHAMBRA VICTORIOSO NERO 100ML',     'Maison Alhambra', 'Masculino', 'AromÃ¡tico', 22, 100),
  p('MAISON ALHAMBRA YEAH! MAN EDP 100ML',       'Maison Alhambra', 'Masculino', 'CÃ­trico',   21, 100),
  p('MAISON ALHAMBRA YEAH! PARFUM EDP 100ML',    'Maison Alhambra', 'Masculino', 'CÃ­trico',   23, 100),
  // NAUTICA
  p('NAUTICA VOYAGE 100ML',                      'Nautica',         'Masculino', 'AcuÃ¡tico',  22, 100),
  // ORIENTICA
  p('ORIENTICA AMBER ROUGE 80ML',                'Orientica',       'Masculino', 'Oriental',  69,  80),
  p('ORIENTICA ROYAL AMBER 80ML',                'Orientica',       'Masculino', 'Oriental',  72,  80),
  // PARIS CORNER MASCULINOS
  p('PARIS CORNER VOUX ELEGANTE 100ML',          'Paris Corner',    'Masculino', 'Amaderado', 38, 100),
  p('PARIS CORNER VOUX TURQUOISE 100ML',         'Paris Corner',    'Masculino', 'AcuÃ¡tico',  38, 100),
  // RASASI MASCULINOS
  p('RASASI HAWAS BLACK 100ML',                  'Rasasi',          'Masculino', 'Oriental',  39, 100),
  p('RASASI HAWAS ELIXIR 100ML',                 'Rasasi',          'Masculino', 'Oriental',  36, 100),
  p('RASASI HAWAS FIRE 100ML',                   'Rasasi',          'Masculino', 'Especiado', 43, 100),
  p('RASASI HAWAS FOR HIM 100ML',                'Rasasi',          'Masculino', 'AcuÃ¡tico',  31, 100),
  p('RASASI HAWAS FOR HIM ICE 100ML',            'Rasasi',          'Masculino', 'AcuÃ¡tico',  48, 100),
  p('RASASI HAWAS FOR HIM KOBRA 100ML',          'Rasasi',          'Masculino', 'Especiado', 49, 100),
  p('RASASI HAWAS FOR HIM MALIBU 100ML',         'Rasasi',          'Masculino', 'CÃ­trico',   48, 100),
  p('RASASI HAWAS FOR HIM TROPICAL 100ML',       'Rasasi',          'Masculino', 'CÃ­trico',   41, 100),
  p('RASASI SHUHRAH 90ML',                       'Rasasi',          'Masculino', 'Amaderado', 33,  90),
  // RAVE MASCULINO
  p('RAVE NOW MEN 100ML',                        'Rave',            'Masculino', 'AromÃ¡tico', 24, 100),
  // RAYHAAN MASCULINOS
  p('RAYHAAN AZUL 100ML',                        'Rayhaan',         'Masculino', 'AcuÃ¡tico',  56, 100),
  p('RAYHAAN ELIXIR 100ML',                      'Rayhaan',         'Masculino', 'Oriental',  45, 100),
  p('RAYHAAN ITALIA 100ML',                      'Rayhaan',         'Masculino', 'AromÃ¡tico', 59, 100),
  p('RAYHAAN JUNGLE VIBE 100ML',                 'Rayhaan',         'Masculino', 'Verde',     39, 100),
  p('RAYHAAN LION 100ML',                        'Rayhaan',         'Masculino', 'Amaderado', 41, 100),
  p('RAYHAAN PACIFIC ALOHA 100ML',               'Rayhaan',         'Masculino', 'AcuÃ¡tico',  56, 100),
  p('RAYHAAN TROPICAL VIBES 100ML',              'Rayhaan',         'Masculino', 'CÃ­trico',   60, 100),
  p('RAYHAAN WOLF 100ML',                        'Rayhaan',         'Masculino', 'Amaderado', 42, 100),
  // RIIFFS
  p('RIIFFS MOMENTO 100ML',                      'Riiffs',          'Masculino', 'Oriental',  45, 100),
  // ZIMAYA MASCULINOS
  p('ZIMAYA AMBER IS GREAT 100ML',               'Zimaya',          'Masculino', 'Oriental',  32, 100),
  p('ZIMAYA OUD IS GREAT 100ML',                 'Zimaya',          'Masculino', 'Oriental',  34, 100),

  // â”€â”€â”€ FEMENINOS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // AFNAN FEMENINOS
  p('AFNAN 9AM BLANCO 100ML',                    'Afnan',           'Femenino',  'Floral',    34, 100),
  p('AFNAN 9AM POUR FEMME 100ML',                'Afnan',           'Femenino',  'Floral',    41, 100),
  p('AFNAN 9PM POUR FEMME 100ML',                'Afnan',           'Femenino',  'Floral',    39, 100),
  p('AFNAN HISTORIC DORIA 100ML',                'Afnan',           'Femenino',  'Floral',    41, 100),
  // AL HARAMAIN FEMENINOS
  p('AL HARAMAIN AMBER OUD ULTRA VIOLET 120ML',  'Al Haramain',     'Femenino',  'Floral',    83, 120),
  p('AL HARAMAIN L\'AVENTURE FEMME 100ML',       'Al Haramain',     'Femenino',  'Floral',    41, 100),
  p('AL HARAMAIN L\'AVENTURE GOLD 100ML',        'Al Haramain',     'Femenino',  'Floral',    41, 100),
  // AL WATANIAH FEMENINOS
  p('AL WATANIAH AMEERATI 100ML',                'Al Wataniah',     'Femenino',  'Floral',    20, 100),
  p('AL WATANIAH DURRAT AL AROOS 85ML',          'Al Wataniah',     'Femenino',  'Floral',    21,  85),
  p('AL WATANIAH GHALA 100ML',                   'Al Wataniah',     'Femenino',  'Floral',    22, 100),
  p('AL WATANIAH SABAH AL WARD 100ML',           'Al Wataniah',     'Femenino',  'Floral',    21, 100),
  p('AL WATANIAH SHAGAF AL WARD 100ML',          'Al Wataniah',     'Femenino',  'Floral',    22, 100),
  p('AL WATANIAH THAHAANI 100ML',                'Al Wataniah',     'Femenino',  'Oriental',  20, 100),
  p('AL WATANIAH WATANI PURPLE 100ML',           'Al Wataniah',     'Femenino',  'Floral',    24, 100),
  // ARMAF FEMENINOS
  p('ARMAF CLUB DE NUIT IMPERIALE 105ML',        'Armaf',           'Femenino',  'Floral',    44, 105),
  p('ARMAF CLUB DE NUIT INTENSE FEMENINO 105ML', 'Armaf',           'Femenino',  'Floral',    35, 105),
  p('ARMAF CLUB DE NUIT MALEKA 105ML',           'Armaf',           'Femenino',  'Floral',    44, 105),
  p('ARMAF CLUB DE NUIT OUD PARFUM 105ML',       'Armaf',           'Femenino',  'Oriental',  52, 105),
  p('ARMAF CLUB DE NUIT PRECIEUX IV 55ML',       'Armaf',           'Femenino',  'Floral',    59,  55),
  p('ARMAF CLUB DE NUIT UNTOLD 105ML',           'Armaf',           'Femenino',  'Floral',    45, 105),
  p('ARMAF CLUB DE NUIT WOMAN 105ML',            'Armaf',           'Femenino',  'Floral',    39, 105),
  p('ARMAF ETER DESERT ROSE 100ML',              'Armaf',           'Femenino',  'Floral',    50, 100),
  p('ARMAF ISLAND BLISS 100ML',                  'Armaf',           'Femenino',  'Floral',    41, 100),
  p('ARMAF MISS ARMAF ATTITUDE 100ML',           'Armaf',           'Femenino',  'Floral',    38, 100),
  p('ARMAF MISS ARMAF CATWALK 100ML',            'Armaf',           'Femenino',  'Floral',    38, 100),
  p('ARMAF ODYSSEY CANDEE 100ML',                'Armaf',           'Femenino',  'Gourmand',  27, 100),
  p('ARMAF ODYSSEY EAU DE MONTAGNE 100ML',       'Armaf',           'Femenino',  'Verde',     24, 100),
  p('ARMAF ODYSSEY MARSHMALLOW 100ML',           'Armaf',           'Femenino',  'Gourmand',  31, 100),
  p('ARMAF YUM YUM 100ML',                       'Armaf',           'Femenino',  'Gourmand',  47, 100),
  // BHARARA FEMENINOS
  p('BHARARA ROSE 100ML',                        'Bharara',         'Femenino',  'Floral',    56, 100),
  p('BHARARA NICHE FEMME 100ML',                 'Bharara',         'Femenino',  'Floral',    57, 100),
  // EMPER FEMENINO
  p('EMPER DONNA INTENSE 100ML',                 'Emper',           'Femenino',  'Floral',    30, 100),
  // FRAGRANCE WORLD FEMENINO
  p('FRAGRANCE WORLD JUST AZRAQ 100ML',          'Fragrance World', 'Femenino',  'Floral',    21, 100),
  // FRENCH AVENUE FEMENINOS
  p('FRENCH AVENUE AVE SWEET PARADISE 100ML',    'French Avenue',   'Femenino',  'Floral',    37, 100),
  p('FRENCH AVENUE COCOA MORADO 100ML',          'French Avenue',   'Femenino',  'Gourmand',  32, 100),
  p('FRENCH AVENUE GENESIS ARIES 90ML',          'French Avenue',   'Femenino',  'Floral',    44,  90),
  p('FRENCH AVENUE GENESIS CANCER 90ML',         'French Avenue',   'Femenino',  'AcuÃ¡tico',  44,  90),
  p('FRENCH AVENUE GENESIS LEO 90ML',            'French Avenue',   'Femenino',  'Floral',    44,  90),
  p('FRENCH AVENUE GENESIS LIBRA 90ML',          'French Avenue',   'Femenino',  'Floral',    44,  90),
  p('FRENCH AVENUE GENESIS SAGITTARIUS 90ML',    'French Avenue',   'Femenino',  'AromÃ¡tico', 44,  90),
  p('FRENCH AVENUE MERINGUE 100ML',              'French Avenue',   'Femenino',  'Gourmand',  32, 100),
  p('FRENCH AVENUE PINNACE 100ML',               'French Avenue',   'Femenino',  'Floral',    45, 100),
  p('FRENCH AVENUE VULCAN FEU 100ML',            'French Avenue',   'Femenino',  'Especiado', 54, 100),
  // LATTAFA FEMENINOS
  p('LATTAFA AFEEF 100ML',                       'Lattafa',         'Femenino',  'Floral',    84, 100),
  p('LATTAFA AJWAD 60ML',                        'Lattafa',         'Femenino',  'Floral',    20,  60),
  p('LATTAFA AJWAD PINK TO PINK 60ML',           'Lattafa',         'Femenino',  'Floral',    20,  60),
  p('LATTAFA ANA ABIYEDH 60ML',                  'Lattafa',         'Femenino',  'Floral',    20,  60),
  p('LATTAFA ANA ABIYEDH ROUGE 60ML',            'Lattafa',         'Femenino',  'Floral',    19,  60),
  p('LATTAFA ANGHAM 100ML',                      'Lattafa',         'Femenino',  'Floral',    29, 100),
  p('LATTAFA ANGHAM SECOND SONG 100ML',          'Lattafa',         'Femenino',  'Floral',    33, 100),
  p('LATTAFA ANSAAM GOLD 100ML',                 'Lattafa',         'Femenino',  'Oriental',  30, 100),
  p('LATTAFA ASDAAF AMEERAT AL ARAB 100ML',      'Lattafa',         'Femenino',  'Floral',    21, 100),
  p('LATTAFA ASDAAF AMEERAT AL ARAB PRIVE ROSE 100ML','Lattafa',    'Femenino',  'Floral',    23, 100),
  p('LATTAFA ATHEERI 100ML',                     'Lattafa',         'Femenino',  'Floral',    72, 100),
  p('LATTAFA BADE\'E AL OUD NOBLE BLUSH 100ML',  'Lattafa',         'Femenino',  'Oriental',  27, 100),
  p('LATTAFA ECLAIRE 100ML',                     'Lattafa',         'Femenino',  'Floral',    36, 100),
  p('LATTAFA ECLAIRE BANOFFI 100ML',             'Lattafa',         'Femenino',  'Gourmand',  41, 100),
  p('LATTAFA EMAAN 100ML',                       'Lattafa',         'Femenino',  'Floral',    26, 100),
  p('LATTAFA FAKHAR ROSE 100ML',                 'Lattafa',         'Femenino',  'Floral',    35, 100),
  p('LATTAFA HAYA 100ML',                        'Lattafa',         'Femenino',  'Floral',    33, 100),
  p('LATTAFA HAYAATI FLORENCE 100ML',            'Lattafa',         'Femenino',  'Floral',    20, 100),
  p('LATTAFA HER CONFESSION 100ML',              'Lattafa',         'Femenino',  'Floral',    36, 100),
  p('LATTAFA MAYAR 100ML',                       'Lattafa',         'Femenino',  'Floral',    26, 100),
  p('LATTAFA MAYAR CHERRY 100ML',                'Lattafa',         'Femenino',  'Floral',    25, 100),
  p('LATTAFA MAYAR NATURAL INTENSE 100ML',       'Lattafa',         'Femenino',  'Floral',    25, 100),
  p('LATTAFA MUSAMAM 100ML',                     'Lattafa',         'Femenino',  'Floral',    29, 100),
  p('LATTAFA MUSAMAM WHITE INTENSE 100ML',       'Lattafa',         'Femenino',  'Floral',    45, 100),
  p('LATTAFA NEBRAS ELIXIR 100ML',               'Lattafa',         'Femenino',  'Floral',    36, 100),
  p('LATTAFA OPULENT DUBAI 100ML',               'Lattafa',         'Femenino',  'Oriental',  24, 100),
  p('LATTAFA QIMMAH WOMAN 100ML',                'Lattafa',         'Femenino',  'Floral',    23, 100),
  p('LATTAFA SAKEENA 100ML',                     'Lattafa',         'Femenino',  'Floral',    24, 100),
  p('LATTAFA SEHR MAGIC OF 100ML',               'Lattafa',         'Femenino',  'Oriental',  36, 100),
  p('LATTAFA TERIAQ 100ML',                      'Lattafa',         'Femenino',  'Floral',    32, 100),
  p('LATTAFA THE KINGDOM FEMENINO 100ML',        'Lattafa',         'Femenino',  'Floral',    29, 100),
  p('LATTAFA VICTORIA 100ML',                    'Lattafa',         'Femenino',  'Floral',    35, 100),
  p('LATTAFA YARA CANDY 100ML',                  'Lattafa',         'Femenino',  'Floral',    27, 100),
  p('LATTAFA YARA ELIXIR 100ML',                 'Lattafa',         'Femenino',  'Floral',    35, 100),
  p('LATTAFA YARA MOI 100ML',                    'Lattafa',         'Femenino',  'Floral',    24, 100),
  p('LATTAFA YARA ROSA 100ML',                   'Lattafa',         'Femenino',  'Floral',    28, 100),
  p('LATTAFA YARA TOUS 100ML',                   'Lattafa',         'Femenino',  'Floral',    25, 100),
  // MAISON ALHAMBRA FEMENINOS
  p('MAISON ALHAMBRA ALIVE NOW 100ML',           'Maison Alhambra', 'Femenino',  'Floral',    28, 100),
  p('MAISON ALHAMBRA BAROQUE ROUGE 540 100ML',   'Maison Alhambra', 'Femenino',  'Floral',    21, 100),
  p('MAISON ALHAMBRA BAROQUE ROUGE EXTREME 100ML','Maison Alhambra','Femenino',  'Floral',    21, 100),
  p('MAISON ALHAMBRA COMO MOISELLE 100ML',       'Maison Alhambra', 'Femenino',  'Floral',    30, 100),
  p('MAISON ALHAMBRA DELILAH 100ML',             'Maison Alhambra', 'Femenino',  'Floral',    33, 100),
  p('MAISON ALHAMBRA GLACIER BELLA 100ML',       'Maison Alhambra', 'Femenino',  'Floral',    25, 100),
  p('MAISON ALHAMBRA LA VITA 100ML',             'Maison Alhambra', 'Femenino',  'Floral',    21, 100),
  p('MAISON ALHAMBRA LA VIVACITE 100ML',         'Maison Alhambra', 'Femenino',  'Floral',    24, 100),
  p('MAISON ALHAMBRA LIBRE LEONIE 100ML',        'Maison Alhambra', 'Femenino',  'Floral',    36, 100),
  p('MAISON ALHAMBRA LOVE SPARK 80ML',           'Maison Alhambra', 'Femenino',  'Floral',    21,  80),
  p('MAISON ALHAMBRA REYNA 100ML',               'Maison Alhambra', 'Femenino',  'Floral',    21, 100),
  p('MAISON ALHAMBRA ROSE SEDUCTION VIP FEMME 100ML','Maison Alhambra','Femenino','Floral',   29, 100),
  p('MAISON ALHAMBRA SENSUAL VANILLA 80ML',      'Maison Alhambra', 'Femenino',  'Gourmand',  21,  80),
  p('MAISON ALHAMBRA PINK VELVET 80ML',          'Maison Alhambra', 'Femenino',  'Floral',    29,  80),
  // PARIS CORNER FEMENINOS
  p('PARIS CORNER MARSHMALLOW BLUSH 100ML',      'Paris Corner',    'Femenino',  'Gourmand',  38, 100),
  p('PARIS CORNER KHAIR CONFECTION 100ML',       'Paris Corner',    'Femenino',  'Gourmand',  30, 100),
  p('PARIS CORNER KHAIR PISTACHIO 100ML',        'Paris Corner',    'Femenino',  'Gourmand',  26, 100),
  p('PARIS CORNER TASKEEN CARAMEL CASCADE 100ML','Paris Corner',    'Femenino',  'Gourmand',  27, 100),
  // RASASI FEMENINO
  p('RASASI HAWAS FOR HER 100ML',                'Rasasi',          'Femenino',  'Floral',    26, 100),
  // RAVE FEMENINO
  p('RAVE NOW WOMEN 100ML',                      'Rave',            'Femenino',  'Floral',    25, 100),
  // RAYHAAN FEMENINO
  p('RAYHAAN DIVINE 100ML',                      'Rayhaan',         'Femenino',  'Floral',    66, 100),
  // ZIMAYA FEMENINOS
  p('ZIMAYA TIRAMISU CARAMEL 100ML',             'Zimaya',          'Femenino',  'Gourmand',  35, 100),
  p('ZIMAYA TIRAMISU COCO 100ML',                'Zimaya',          'Femenino',  'Gourmand',  30, 100),

  // â”€â”€â”€ KIDS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  p('GRANDEUR TUBBEES BUBBLE GUM 50ML',          'Grandeur',        'Kids',      'Gourmand',  12,  50),
  p('GRANDEUR TUBBEES CHOCOLATE FUDGE 50ML',     'Grandeur',        'Kids',      'Gourmand',  12,  50),
  p('GRANDEUR TUBBEES COOKIES & CREAM 50ML',     'Grandeur',        'Kids',      'Gourmand',  12,  50),
  p('GRANDEUR TUBBEES CANDY POP 50ML',           'Grandeur',        'Kids',      'Gourmand',  12,  50),
  p('GRANDEUR TUBBEES CHERRY LUXE 50ML',         'Grandeur',        'Kids',      'Gourmand',  12,  50),
  p('GRANDEUR TUBBEES PINK SUGAR 50ML',          'Grandeur',        'Kids',      'Gourmand',  12,  50),
  p('GRANDEUR TUBBEES STRAWBERRY CHEESECAKE 50ML','Grandeur',       'Kids',      'Gourmand',  12,  50),
  p('GRANDEUR TUBBEES UNICORN VANILLA 50ML',     'Grandeur',        'Kids',      'Gourmand',  12,  50),
];

async function seed() {
  console.log('ðŸŒ± Iniciando seed de Fraganzia...\n');

  // 1. Documento admins/{uid}
  await db.doc(`admins/${ADMIN_UID}`).set({
    email: ADMIN_EMAIL,
    nombre: 'Admin',
    createdAt: Timestamp.now(),
  });
  console.log(`âœ… admins/${ADMIN_UID} creado`);

  // 2. config/general
  // dolarBlueManual es solo el fallback cuando dolarapi.com no responde.
  // La app siempre intenta primero la cotizaciÃ³n en tiempo real.
  await db.doc('config/general').set({
    dolarBlueManual: 1300,
    whatsappNumero: '5491130097370',
    updatedAt: Timestamp.now(),
  });
  console.log('âœ… config/general creado');

  // 3. Eliminar perfumes existentes
  const existentes = await db.collection('perfumes').listDocuments();
  if (existentes.length > 0) {
    const batch = db.batch();
    existentes.forEach(ref => batch.delete(ref));
    await batch.commit();
    console.log(`ðŸ—‘ï¸  ${existentes.length} perfumes anteriores eliminados`);
  }

  // 4. Cargar todos los perfumes del catÃ¡logo
  let creados = 0;
  for (const perfume of PERFUMES) {
    await db.collection('perfumes').add({
      ...perfume,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    creados++;
    if (creados % 20 === 0) console.log(`   ... ${creados}/${PERFUMES.length} perfumes cargados`);
  }

  console.log(`\nðŸŽ‰ Seed completado:`);
  console.log(`   â€¢ ${PERFUMES.length} perfumes del CatÃ¡logo Ãrabes Mayorista`);
  console.log(`   â€¢ ${PERFUMES.filter(p => p.destacado).length} marcados como destacados`);
  console.log(`   â€¢ Masculinos: ${PERFUMES.filter(p => p.genero === 'Masculino').length}`);
  console.log(`   â€¢ Femeninos:  ${PERFUMES.filter(p => p.genero === 'Femenino').length}`);
  console.log(`   â€¢ Kids:       ${PERFUMES.filter(p => p.genero === 'Kids').length}`);
  console.log('\nPrÃ³ximo paso: npm run dev y abrÃ­ http://localhost:5173');
  process.exit(0);
}

seed().catch((err) => {
  console.error('âŒ Error en el seed:', err.message);
  process.exit(1);
  console.error('Error en el seed:', err.message);
  process.exit(1);
});
