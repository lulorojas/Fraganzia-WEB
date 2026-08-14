// sync-fragrantica.mjs — Sincroniza notas y descripciones desde Fragrantica
// Si el perfume no está en Fragrantica, mantiene la info actual

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';
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

// Delay para no saturar Fragrantica
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Buscar perfume en Fragrantica usando su API interna
async function searchFragrantica(marca, nombre) {
  // Limpiar nombre del perfume - quitar el nombre de la marca duplicado y "ML"
  let cleanNombre = nombre
    .replace(new RegExp(marca, 'gi'), '')
    .replace(/\d+ML$/i, '')
    .trim();
  
  const query = `${marca} ${cleanNombre}`;
  
  // Usar la API de autocompletar de Fragrantica (menos restrictiva)
  const apiUrl = `https://www.fragrantica.com/api/search/autocomplete?query=${encodeURIComponent(query)}`;
  
  console.log(`   🔍 Buscando: ${query}`);
  
  try {
    const res = await fetch(apiUrl, {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.fragrantica.com/',
        'Origin': 'https://www.fragrantica.com',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin'
      },
      signal: AbortSignal.timeout(15000)
    });
    
    if (!res.ok) {
      console.log(`   ⚠️  Error HTTP ${res.status}`);
      return null;
    }
    
    const data = await res.json();
    
    // La API devuelve un array de resultados
    if (!data || !data.length) {
      console.log(`   ❌ No encontrado en Fragrantica`);
      return null;
    }
    
    // Tomar el primer resultado
    const perfume = data[0];
    const perfumeUrl = `https://www.fragrantica.com${perfume.url}`;
    console.log(`   ✅ Encontrado: ${perfume.name}`);
    
    // Esperar antes de hacer la segunda request
    await delay(2000);
    
    // Obtener la página del perfume
    return await scrapePerfumePage(perfumeUrl);
    
  } catch (error) {
    console.log(`   ⚠️  Error: ${error.message}`);
    
    // Fallback: intentar búsqueda directa HTML
    return await searchFragranticaHTML(query);
  }
}

// Fallback con búsqueda HTML más completa
async function searchFragranticaHTML(query) {
  const searchUrl = `https://www.fragrantica.com/search/?query=${encodeURIComponent(query)}`;
  
  try {
    const res = await fetch(searchUrl, {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0'
      },
      signal: AbortSignal.timeout(15000)
    });
    
    if (!res.ok) {
      console.log(`   ⚠️  Fallback también falló: HTTP ${res.status}`);
      return null;
    }
    
    const html = await res.text();
    
    // Buscar el primer link a una página de perfume  
    const match = html.match(/href="(\/perfume\/[^"]+?-\d{4,6}\.html)"/);
    
    if (!match) {
      console.log(`   ❌ Fallback: No encontrado`);
      return null;
    }
    
    const perfumeUrl = `https://www.fragrantica.com${match[1]}`;
    console.log(`   ✅ Fallback encontró: ${perfumeUrl}`);
    
    await delay(3000);
    return await scrapePerfumePage(perfumeUrl);
    
  } catch (error) {
    console.log(`   ⚠️  Fallback error: ${error.message}`);
    return null;
  }
}

// Extraer notas y descripción de la página del perfume
async function scrapePerfumePage(url) {
  try {
    const res = await fetch(url, {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.fragrantica.com/',
        'Connection': 'keep-alive',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'same-origin'
      },
      signal: AbortSignal.timeout(15000)
    });
    
    const html = await res.text();
    
    // Extraer descripción (primer párrafo después del título)
    const descMatch = html.match(/<div[^>]*itemprop="description"[^>]*>([\s\S]*?)<\/div>/i);
    let descripcion = '';
    if (descMatch) {
      // Limpiar HTML tags
      descripcion = descMatch[1]
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim();
    }
    
    // Extraer notas olfativas
    // Fragrantica tiene 3 secciones: Top Notes, Middle Notes, Base Notes
    const notasSalida = extractNotes(html, 'Top Notes');
    const notasCorazon = extractNotes(html, 'Middle Notes');
    const notasFondo = extractNotes(html, 'Base Notes');
    
    console.log(`   📝 Descripción: ${descripcion.substring(0, 80)}...`);
    console.log(`   🌸 Notas salida: ${notasSalida.join(', ') || 'N/A'}`);
    console.log(`   💐 Notas corazón: ${notasCorazon.join(', ') || 'N/A'}`);
    console.log(`   🌿 Notas fondo: ${notasFondo.join(', ') || 'N/A'}`);
    
    return {
      descripcion,
      notasSalida,
      notasCorazon,
      notasFondo,
      url
    };
    
  } catch (error) {
    console.log(`   ⚠️  Error scraping: ${error.message}`);
    return null;
  }
}

// Extraer array de notas por categoría
function extractNotes(html, category) {
  // Buscar el div con el texto del category
  const categoryRegex = new RegExp(`<div[^>]*>${category}</div>([\\s\\S]*?)<div[^>]*class="cell small-12 text-center">`, 'i');
  const match = html.match(categoryRegex);
  
  if (!match) return [];
  
  const section = match[1];
  
  // Extraer todos los nombres de notas
  // Formato: <div style="...">Nota Name</div>
  const noteMatches = section.matchAll(/<div[^>]*style="[^"]*text-align:center[^"]*"[^>]*>([^<]+)<\/div>/gi);
  
  const notes = [];
  for (const noteMatch of noteMatches) {
    const note = noteMatch[1].trim();
    if (note && note.length > 1 && note.length < 50) {
      notes.push(note);
    }
  }
  
  return notes;
}

// Actualizar perfume en Firestore
async function updatePerfume(id, data) {
  try {
    const perfumeRef = doc(db, 'perfumes', id);
    await updateDoc(perfumeRef, {
      descripcion: data.descripcion,
      notasSalida: data.notasSalida,
      notasCorazon: data.notasCorazon,
      notasFondo: data.notasFondo,
      fragranticaUrl: data.url,
      fragranticaSyncAt: new Date().toISOString()
    });
    console.log(`   💾 Actualizado en Firestore`);
    return true;
  } catch (error) {
    console.log(`   ⚠️  Error actualizando Firestore: ${error.message}`);
    return false;
  }
}

// Main
async function main() {
  console.log('🔄 Sincronizando perfumes con Fragrantica...\n');
  console.log('⚠️  NOTA: Fragrantica puede bloquear requests automáticos.');
  console.log('   Este proceso es lento para evitar bloqueos.\n');
  
  // Obtener todos los perfumes
  const snapshot = await getDocs(collection(db, 'perfumes'));
  const perfumes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  console.log(`📦 Total de perfumes: ${perfumes.length}\n`);
  
  let processed = 0;
  let updated = 0;
  let notFound = 0;
  let errors = 0;
  
  // Procesar en lotes pequeños con delays largos
  const BATCH_SIZE = 5;
  const BATCH_DELAY = 30000; // 30 segundos entre lotes
  
  for (let i = 0; i < perfumes.length; i += BATCH_SIZE) {
    const batch = perfumes.slice(i, i + BATCH_SIZE);
    
    for (const perfume of batch) {
      processed++;
      console.log(`\n[${processed}/${perfumes.length}] ${perfume.marca} - ${perfume.nombre}`);
      
      // Buscar en Fragrantica
      const data = await searchFragrantica(perfume.marca, perfume.nombre);
      
      if (data && data.descripcion) {
        // Actualizar en Firestore
        const success = await updatePerfume(perfume.id, data);
        if (success) {
          updated++;
        } else {
          errors++;
        }
      } else {
        notFound++;
        console.log(`   ⏭️  Manteniendo datos actuales`);
      }
      
      // Delay entre perfumes
      await delay(5000);
    }
    
    // Delay entre lotes (solo si no es el último lote)
    if (i + BATCH_SIZE < perfumes.length) {
      console.log(`\n⏸️  Pausa de 30 segundos antes del siguiente lote...`);
      await delay(BATCH_DELAY);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ RESUMEN:');
  console.log(`   Total procesados: ${processed}`);
  console.log(`   ✅ Actualizados: ${updated}`);
  console.log(`   ❌ No encontrados: ${notFound}`);
  console.log(`   ⚠️  Errores: ${errors}`);
  console.log('='.repeat(50));
}

main().catch(console.error);
