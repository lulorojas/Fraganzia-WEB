// sync-parfumo.mjs — Sincroniza con Parfumo (mejor cobertura de perfumes árabes)

import puppeteer from 'puppeteer-core';
import { execSync } from 'child_process';
import { existsSync } from 'fs';
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

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Extraer datos de una página de Parfumo
async function extractFromPage(page) {
  try {
    await page.waitForSelector('.cell-main-data', { timeout: 10000 }).catch(() => {});
    
    // Extraer descripción
    const descripcion = await page.evaluate(() => {
      const descElement = document.querySelector('.text-description, .fragrance-description, p[itemprop="description"]');
      if (descElement) {
        return descElement.innerText.trim();
      }
      // Intentar otras ubicaciones comunes
      const paragraphs = Array.from(document.querySelectorAll('.cell-main-data p'));
      if (paragraphs.length > 0) {
        return paragraphs[0].innerText.trim();
      }
      return '';
    });
    
    // Extraer notas olfativas de Parfumo
    const notes = await page.evaluate(() => {
      const result = {
        notasSalida: [],
        notasCorazon: [],
        notasFondo: []
      };
      
      // Parfumo usa estructura diferente - buscar todas las notas
      const noteElements = document.querySelectorAll('[data-note-id], .note-link, a[href*="/notes/"]');
      const allNotes = Array.from(noteElements).map(el => el.innerText.trim()).filter(text => text && text.length > 1 && text.length < 50);
      
      // Si no hay categorización, distribuir las notas
      if (allNotes.length > 0) {
        const third = Math.ceil(allNotes.length / 3);
        result.notasSalida = allNotes.slice(0, third);
        result.notasCorazon = allNotes.slice(third, third * 2);
        result.notasFondo = allNotes.slice(third * 2);
      }
      
      return result;
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

// Buscar y extraer datos de un perfume en Parfumo
async function scrapeParfumo(browser, marca, nombre) {
  // Limpiar nombre
  let cleanNombre = nombre
    .replace(new RegExp(marca, 'gi'), '')
    .replace(/\d+ML$/i, '')
    .trim();
  
  const query = `${marca} ${cleanNombre}`;
  console.log(`   🔍 Buscando: ${query}`);
  
  let page;
  try {
    page = await browser.newPage();
    
    // Configurar página para parecer un navegador real
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Ir a la búsqueda de Parfumo
    const searchUrl = `https://www.parfumo.com/search?q=${encodeURIComponent(query)}&t=p`;
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // Esperar un poco
    await delay(2000);
    
    // Buscar el primer link a una página de perfume
    const perfumeLink = await page.evaluate(() => {
      // Parfumo usa diferentes selectores
      const link = document.querySelector('a[href*="/Perfumes/"]');
      return link ? link.href : null;
    });
    
    if (!perfumeLink) {
      console.log(`   ❌ No encontrado en Parfumo`);
      await page.close();
      return null;
    }
    
    console.log(`   ✅ Encontrado, extrayendo datos...`);
    
    // Ir a la página del perfume
    await page.goto(perfumeLink, { waitUntil: 'domcontentloaded', timeout: 30000 });
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
    if (page) await page.close().catch(() => {});
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
      parfumoUrl: data.url,
      parfumoSyncAt: new Date().toISOString()
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
  console.log('🔄 Sincronizando perfumes con Parfumo...\n');
  console.log('⏳ Esto puede tardar bastante (varios minutos por perfume)');
  console.log('💡 El navegador se abrirá en segundo plano\n');
  
  // Encontrar Chrome en el sistema
  let executablePath;
  try {
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
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ]
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
  
  // Procesar en lotes más pequeños con reinicio de navegador
  const BATCH_SIZE = 5;
  const RESTART_AFTER = 20; // Reiniciar navegador cada 20 perfumes
  
  for (let i = 0; i < perfumes.length; i += BATCH_SIZE) {
    const batch = perfumes.slice(i, i + BATCH_SIZE);
    console.log(`\n📦 Procesando lote ${Math.floor(i / BATCH_SIZE) + 1} de ${Math.ceil(perfumes.length / BATCH_SIZE)}\n`);
    
    for (const perfume of batch) {
      processed++;
      console.log(`[${processed}/${perfumes.length}] ${perfume.marca} - ${perfume.nombre}`);
      
      try {
        const data = await scrapeParfumo(browser, perfume.marca, perfume.nombre);
        
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
      await delay(4000);
    }
    
    // Reiniciar navegador periódicamente para evitar problemas de memoria
    if (processed % RESTART_AFTER === 0 && i + BATCH_SIZE < perfumes.length) {
      console.log(`\n🔄 Reiniciando navegador (cada ${RESTART_AFTER} perfumes)...`);
      await browser.close();
      await delay(5000);
      const newBrowser = await puppeteer.launch({ 
        executablePath,
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage'
        ]
      });
      // Reemplazar la referencia al navegador
      Object.assign(browser, newBrowser);
      console.log('✅ Navegador reiniciado\n');
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
