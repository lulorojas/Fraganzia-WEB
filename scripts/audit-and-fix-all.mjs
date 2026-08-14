import admin from 'firebase-admin';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(readFileSync('./fraganzia-e9b70-firebase-adminsdk-lozn6-f4cddcebf6.json', 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Base de conocimiento de perfumería árabe
const CONOCIMIENTO = {
  // Familias válidas según Fragrantica
  familiasValidas: [
    'Amaderado',
    'Oriental',
    'Floral',
    'Fresco',
    'Cítrico',
    'Especiado',
    'Frutal',
    'Aromático',
    'Gourmand'
  ],

  // Mapeo de familias comunes
  mapeoFamilias: {
    'Especiado': ['spicy', 'especias', 'picante'],
    'Amaderado': ['woody', 'wood', 'madera', 'oud', 'cedar', 'sandalwood'],
    'Oriental': ['oriental', 'ambery', 'amber', 'ámbar', 'incense'],
    'Floral': ['floral', 'flores', 'flower', 'rose', 'jasmine', 'lavanda'],
    'Fresco': ['fresh', 'fresco', 'aquatic', 'acuático', 'marino'],
    'Cítrico': ['citrus', 'cítrico', 'lemon', 'bergamot', 'orange'],
    'Frutal': ['fruity', 'frutal', 'fruit', 'fruta', 'apple', 'peach'],
    'Aromático': ['aromatic', 'aromático', 'herbal', 'lavender'],
    'Gourmand': ['gourmand', 'sweet', 'dulce', 'vanilla', 'caramel', 'chocolate']
  },

  // Correcciones conocidas de productos específicos
  correccionesPorProducto: {
    // LATTAFA
    'LATTAFA TERIAQ INTENSE': {
      familia: 'Oriental',
      notas: ['Oud', 'Especias', 'Ámbar', 'Resinas']
    },
    'LATTAFA TERIAQ': {
      familia: 'Floral',
      notas: ['Jazmín', 'Rosas', 'Almizcle', 'Ámbar']
    },
    'LATTAFA OPULENT OUD': {
      familia: 'Oriental',
      notas: ['Oud', 'Rosa', 'Azafrán', 'Almizcle']
    },
    'LATTAFA YARA': {
      familia: 'Frutal',
      notas: ['Orquídea', 'Heliotropo', 'Vainilla', 'Almizcle']
    },
    'LATTAFA KHAMRAH': {
      familia: 'Oriental',
      notas: ['Canela', 'Nuez moscada', 'Praliné', 'Tonka', 'Vainilla', 'Ámbar']
    },
    'LATTAFA FAKHAR': {
      familia: 'Oriental',
      notas: ['Rosa', 'Azafrán', 'Oud', 'Almizcle']
    },
    'LATTAFA ASAD': {
      familia: 'Amaderado',
      notas: ['Bergamota', 'Pimienta', 'Cedro', 'Pachulí', 'Almizcle']
    },
    'LATTAFA MAYAR': {
      familia: 'Floral',
      notas: ['Gardenia', 'Jazmín', 'Vainilla', 'Almizcle']
    },
    'LATTAFA QAED AL FURSAN': {
      familia: 'Amaderado',
      notas: ['Lavanda', 'Pimienta', 'Cedro', 'Pachulí', 'Ámbar']
    },
    'LATTAFA RAGHBA': {
      familia: 'Oriental',
      notas: ['Oud', 'Incienso', 'Azúcar', 'Almizcle']
    },

    // ARMAF
    'ARMAF CLUB DE NUIT INTENSE': {
      familia: 'Amaderado',
      notas: ['Bergamota', 'Limón', 'Pimienta rosa', 'Jazmín', 'Pachulí', 'Vainilla', 'Almizcle']
    },
    'ARMAF CLUB DE NUIT MILESTONE': {
      familia: 'Amaderado',
      notas: ['Bergamota', 'Manzana', 'Pimienta rosa', 'Pachulí', 'Almizcle']
    },
    'ARMAF CLUB DE NUIT SILLAGE': {
      familia: 'Amaderado',
      notas: ['Lavanda', 'Bergamota', 'Geranio', 'Pachulí', 'Cedro']
    },
    'ARMAF HUNTER INTENSE': {
      familia: 'Aromático',
      notas: ['Lavanda', 'Mandarina', 'Canela', 'Tabaco', 'Ámbar']
    },
    'ARMAF NICHE BUCCANEER': {
      familia: 'Amaderado',
      notas: ['Lavanda', 'Bergamota', 'Vainilla', 'Ámbar', 'Pachulí']
    },
    'ARMAF VENETIAN AMBRE': {
      familia: 'Oriental',
      notas: ['Naranja', 'Clavo de olor', 'Ámbar', 'Vainilla', 'Pachulí']
    },
    'ARMAF LE FEMME': {
      familia: 'Floral',
      notas: ['Cítricos', 'Flores blancas', 'Almizcle', 'Ámbar']
    },
    'ARMAF VENTANA': {
      familia: 'Floral',
      notas: ['Bergamota', 'Jazmín', 'Ámbar', 'Pachulí']
    },

    // AFNAN
    'AFNAN 9PM': {
      familia: 'Amaderado',
      notas: ['Manzana', 'Canela', 'Vainilla', 'Ámbar', 'Pachulí']
    },
    'AFNAN SUPREMACY SILVER': {
      familia: 'Amaderado',
      notas: ['Bergamota', 'Limón', 'Pachulí', 'Cedro', 'Almizcle']
    },
    'AFNAN SUPREMACY IN HEAVEN': {
      familia: 'Aromático',
      notas: ['Mandarina', 'Menta', 'Lavanda', 'Vainilla', 'Almizcle']
    },
    'AFNAN SUPREMACY GOLD': {
      familia: 'Frutal',
      notas: ['Piña', 'Bergamota', 'Pachulí', 'Vainilla', 'Almizcle']
    },
    'AFNAN TURATHI BLUE': {
      familia: 'Oriental',
      notas: ['Oud', 'Rosa', 'Azafrán', 'Almizcle']
    },
    'AFNAN MODEST UNE': {
      familia: 'Oriental',
      notas: ['Azafrán', 'Jazmín', 'Ámbar', 'Cedro']
    },

    // AL HARAMAIN
    'AL HARAMAIN L\'AVENTURE': {
      familia: 'Amaderado',
      notas: ['Bergamota', 'Limón', 'Pimienta rosa', 'Pachulí', 'Almizcle']
    },
    'AL HARAMAIN AMBER OUD': {
      familia: 'Oriental',
      notas: ['Oud', 'Rosa', 'Ámbar', 'Almizcle']
    },
    'AL HARAMAIN DÉTOUR NOIR': {
      familia: 'Amaderado',
      notas: ['Bergamota', 'Lavanda', 'Iris', 'Cedro', 'Pachulí']
    },

    // PARIS CORNER
    'PARIS CORNER EMIR MAJESTIC WOODS': {
      familia: 'Amaderado',
      notas: ['Cardamomo', 'Cedro', 'Pachulí', 'Almizcle']
    },
    'PARIS CORNER EMIR VIBRANT LEATHER': {
      familia: 'Amaderado',
      notas: ['Cuero', 'Tabaco', 'Ámbar', 'Pachulí']
    }
  }
};

// Función para normalizar nombres
function normalizarNombre(nombre) {
  return nombre
    .toUpperCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\bML\b/gi, '')
    .replace(/\b\d+ML\b/gi, '')
    .replace(/\b100\b|\b50\b|\b35\b/g, '')
    .trim();
}

// Función para detectar familia correcta
function detectarFamilia(producto) {
  const nombreNormalizado = normalizarNombre(producto.nombre);
  
  // Primero buscar en correcciones conocidas
  for (const [key, correccion] of Object.entries(CONOCIMIENTO.correccionesPorProducto)) {
    if (nombreNormalizado.includes(normalizarNombre(key))) {
      return correccion.familia;
    }
  }

  // Detectar por notas actuales
  const notasStr = (producto.notas || []).join(' ').toLowerCase();
  
  // Reglas de detección
  if (notasStr.includes('oud') || notasStr.includes('incienso') || notasStr.includes('ámbar')) {
    return 'Oriental';
  }
  if (notasStr.includes('pachulí') || notasStr.includes('cedro') || notasStr.includes('madera')) {
    return 'Amaderado';
  }
  if (notasStr.includes('rosa') || notasStr.includes('jazmín') || notasStr.includes('flor')) {
    return 'Floral';
  }
  if (notasStr.includes('vainilla') || notasStr.includes('caramelo') || notasStr.includes('dulce')) {
    return 'Gourmand';
  }
  if (notasStr.includes('cítrico') || notasStr.includes('limón') || notasStr.includes('bergamota')) {
    return 'Cítrico';
  }
  if (notasStr.includes('menta') || notasStr.includes('marino') || notasStr.includes('acuático')) {
    return 'Fresco';
  }
  if (notasStr.includes('lavanda') || notasStr.includes('herbal')) {
    return 'Aromático';
  }
  if (notasStr.includes('manzana') || notasStr.includes('pera') || notasStr.includes('durazno')) {
    return 'Frutal';
  }
  if (notasStr.includes('especias') || notasStr.includes('pimienta') || notasStr.includes('canela')) {
    return 'Especiado';
  }

  // Si no se detecta, mantener la actual si es válida
  return CONOCIMIENTO.familiasValidas.includes(producto.familia) ? producto.familia : 'Oriental';
}

// Función para detectar notas correctas
function detectarNotas(producto) {
  const nombreNormalizado = normalizarNombre(producto.nombre);
  
  // Buscar en correcciones conocidas
  for (const [key, correccion] of Object.entries(CONOCIMIENTO.correccionesPorProducto)) {
    if (nombreNormalizado.includes(normalizarNombre(key))) {
      return correccion.notas;
    }
  }

  // Si no hay corrección específica, mantener las actuales si existen
  if (producto.notas && Array.isArray(producto.notas) && producto.notas.length > 0) {
    return producto.notas;
  }

  // Notas por defecto según familia
  const notasPorFamilia = {
    'Oriental': ['Oud', 'Ámbar', 'Especias', 'Almizcle'],
    'Amaderado': ['Cedro', 'Pachulí', 'Sándalo', 'Almizcle'],
    'Floral': ['Rosa', 'Jazmín', 'Lirio', 'Almizcle'],
    'Fresco': ['Cítricos', 'Marino', 'Menta', 'Almizcle'],
    'Cítrico': ['Limón', 'Bergamota', 'Naranja', 'Mandarina'],
    'Especiado': ['Pimienta', 'Canela', 'Clavo', 'Jengibre'],
    'Frutal': ['Manzana', 'Pera', 'Frutas rojas', 'Almizcle'],
    'Aromático': ['Lavanda', 'Romero', 'Salvia', 'Almizcle'],
    'Gourmand': ['Vainilla', 'Caramelo', 'Tonka', 'Almizcle']
  };

  return notasPorFamilia[producto.familia] || ['Especias', 'Ámbar', 'Almizcle'];
}

// Función principal
async function auditarYCorregir() {
  console.log('🔍 Iniciando auditoría completa del catálogo...\n');

  const perfumesRef = db.collection('perfumes');
  const snapshot = await perfumesRef.get();

  let corregidos = 0;
  let sinCambios = 0;
  const errores = [];

  for (const doc of snapshot.docs) {
    try {
      const producto = doc.data();
      const cambios = {};

      // Verificar familia
      const familiaCorrecta = detectarFamilia(producto);
      if (producto.familia !== familiaCorrecta) {
        cambios.familia = familiaCorrecta;
        console.log(`📝 ${producto.nombre}: ${producto.familia} → ${familiaCorrecta}`);
      }

      // Verificar notas
      const notasCorrectas = detectarNotas(producto);
      const notasActuales = producto.notas || [];
      
      if (JSON.stringify(notasActuales.sort()) !== JSON.stringify(notasCorrectas.sort())) {
        cambios.notas = notasCorrectas;
        console.log(`🎵 ${producto.nombre}: notas actualizadas`);
        console.log(`   Antes: ${notasActuales.join(', ')}`);
        console.log(`   Ahora: ${notasCorrectas.join(', ')}`);
      }

      // Aplicar cambios si existen
      if (Object.keys(cambios).length > 0) {
        await perfumesRef.doc(doc.id).update(cambios);
        corregidos++;
      } else {
        sinCambios++;
      }

    } catch (error) {
      errores.push({ producto: doc.data().nombre, error: error.message });
      console.error(`❌ Error en ${doc.data().nombre}: ${error.message}`);
    }
  }

  console.log('\n📊 RESUMEN:');
  console.log(`✅ Productos corregidos: ${corregidos}`);
  console.log(`⏭️  Sin cambios: ${sinCambios}`);
  console.log(`❌ Errores: ${errores.length}`);

  if (errores.length > 0) {
    console.log('\n🔴 Errores encontrados:');
    errores.forEach(e => console.log(`  - ${e.producto}: ${e.error}`));
  }

  await admin.app().delete();
  process.exit(0);
}

auditarYCorregir().catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});
