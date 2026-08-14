// sync-fragrantica-puppeteer.mjs — Usa Puppeteer para extraer datos con navegador real

import puppeteer from 'puppeteer-core';
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { readFileSync, writeFileSync } from 'fs';

// Cargar configuración de Firebase
const serviceAccount = JSON.parse(readFileSync('./scripts/ServiceAccount.json', 'utf-8'));
const firebaseConfig = {
  apiKey: serviceAccount.project_id,
  projectId: serviceAccount.project_id,
  storageBucket: `${serviceAccount.project_id}.appspot.com`,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Extraer datos de una página de Fragrantica
async function extractFromPage(page) {
  try {
    // Extraer descripción
    const descripcion = await page.evaluate(() => {
      const descElement = document.querySelector('[itemprop="description"]');
      return descElement ? descElement.innerText.trim() : '';
    });
    
    // Extraer notas olfativas
    const notes = await page.evaluate(() => {
      function extractNotes(headerText) {
        const notes = [];
        const headers = Array.from(document.querySelectorAll('div'));
        
        for (const header of headers) {
          if (header.innerText === headerText) {
            let notesContainer = header.nextElementSibling;
            while (notesContainer) {
              const noteElements = notesContainer.querySelectorAll('div[style*="text-align:center"]');
              if (noteElements.length > 0) {
                noteElements.forEach(el => {
                  const text = el.innerText.trim();
                  if (text && text.length > 1 && text.length < 50) {
                    notes.push(text);
                  }
                });
                break;
              }
              notesContainer = notesContainer.nextElementSibling;
              if (!notesContainer || notes.length > 0) break;
            }
            break;
          }
        }
        return notes;
      }
      
      return {
        notasSalida: extractNotes('Top Notes'),
        notasCorazon: extractNotes('Middle Notes'),
        notasFondo: extractNotes('Base Notes')
      };
    });
    
    return {
      descripcion,
      ...notes,
      url: page.url()
    };
  } catch (error) {
    console.log(`   ⚠️  Error extrayendo: ${error.message}`);
    return null;
  }
}

// Buscar y extraer datos de un perfume
async function scrapeFragrantica(browser, marca, nombre) {
  // Limpiar nombre
  let cleanNombre = nombre
    .replace(new RegExp(marca, 'gi'), '')
    .replace(/\d+ML$/i, '')
    .trim();
  
  const query = `${marca} ${cleanNombre}`;
  console.log(`   🔍 Buscando: ${query}`);
  
  const page = await browser.newPage();
  
  try {
    // Configurar página para parecer un navegador real
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Ir a la búsqueda
    const searchUrl = `https://www.fragrantica.com/search/?query=${encodeURIComponent(query)}`;
    await page.goto(searchUrl, { waitUntil: 'networkidle0', timeout: 30000 });
    
    // Esperar un poco
    await delay(2000);
    
    // Buscar el primer link a una página de perfume
    const perfumeLink = await page.evaluate(() => {
      const link = document.querySelector('a[href*="/perfume/"][href*=".html"]');
      return link ? link.href : null;
    });
    
    if (!perfumeLink) {
      console.log(`   ❌ No encontrado en Fragrantica`);
      await page.close();
      return null;
    }
    
    console.log(`   ✅ Encontrado, extrayendo datos...`);
    
    // Ir a la página del perfume
    await page.goto(perfumeLink, { waitUntil: 'networkidle0', timeout: 30000 });
    await delay(2000);
    
    // Extraer datos
    const data = await extractFromPage(page);
    
    if (data && data.descripcion) {
      console.log(`   📝 Descripción: ${data.descripcion.substring(0, 80)}...`);
      console.log(`   🌸 Notas salida: ${data.notasSalida.join(', ') || 'N/A'}`);
      console.log(`   💐 Notas corazón: ${data.notasCorazon.join(', ') || 'N/A'}`);
      console.log(`   🌿 Notas fondo: ${data.notasFondo.join(', ') || 'N/A'}`);
    }
    
    await page.close();
    return data;
    
  } catch (error) {
    console.log(`   ⚠️  Error: ${error.message}`);
    await page.close();
    return null;
  }
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
  console.log('🔄 Sincronizando perfumes con Fragrantica usando Puppeteer...\n');
  console.log('⏳ Esto puede tardar bastante (varios minutos por perfume)');
  console.log('💡 El navegador se abrirá en segundo plano\n');
  
  // Encontrar Chrome en el sistema
  let executablePath;
  try {
    // Intentar encontrar Chrome en ubicaciones comunes de Windows
    const possiblePaths = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      (process.env.LOCALAPPDATA || '') + '\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
    ];
    
    executablePath = possiblePaths.find(path => {
      try {
        return existsSync(path);
      } catch {
        return false;
      }
    });
    
    if (!executablePath) {
      console.error('❌ No se encontró Chrome o Edge en el sistema');
      process.exit(1);
    }
    
    console.log(`🌐 Usando navegador: ${executablePath}\n`);
  } catch (error) {
    console.error('❌ Error buscando navegador:', error.message);
    process.exit(1);
  }
  
  // Lanzar navegador
  console.log('🚀 Iniciando navegador...');
  const browser = await puppeteer.launch({ 
    executablePath,
    headless: true,  // Cambiar a false para ver el navegador
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  console.log('✅ Navegador iniciado\n');
  
  // Obtener todos los perfumes
  const snapshot = await getDocs(collection(db, 'perfumes'));
  const perfumes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  console.log(`📦 Total de perfumes: ${perfumes.length}\n`);
  
  let processed = 0;
  let updated = 0;
  let notFound = 0;
  let errors = 0;
  
  // Procesar en lotes
  const BATCH_SIZE = 10;
  
  for (let i = 0; i < perfumes.length; i += BATCH_SIZE) {
    const batch = perfumes.slice(i, i + BATCH_SIZE);
    console.log(`\n📦 Procesando lote ${Math.floor(i / BATCH_SIZE) + 1} de ${Math.ceil(perfumes.length / BATCH_SIZE)}\n`);
    
    for (const perfume of batch) {
      processed++;
      console.log(`[${processed}/${perfumes.length}] ${perfume.marca} - ${perfume.nombre}`);
      
      try {
        const data = await scrapeFragrantica(browser, perfume.marca, perfume.nombre);
        
        if (data && data.descripcion) {
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
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        errors++;
      }
      
      // Delay entre perfumes
      await delay(3000);
    }
    
    // Delay entre lotes
    if (i + BATCH_SIZE < perfumes.length) {
      console.log(`\n⏸️  Pausa de 10 segundos antes del siguiente lote...`);
      await delay(10000);
    }
  }
  
  await browser.close();
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ RESUMEN:');
  console.log(`   Total procesados: ${processed}`);
  console.log(`   ✅ Actualizados: ${updated}`);
  console.log(`   ❌ No encontrados: ${notFound}`);
  console.log(`   ⚠️  Errores: ${errors}`);
  console.log('='.repeat(50));
}

main().catch(console.error);
