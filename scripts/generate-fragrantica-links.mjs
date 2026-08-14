// generate-fragrantica-links.mjs — Genera lista de perfumes con links de búsqueda

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
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

async function main() {
  console.log('📋 Generando lista de perfumes para Fragrantica...\n');
  
  // Obtener todos los perfumes
  const snapshot = await getDocs(collection(db, 'perfumes'));
  const perfumes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  console.log(`📦 Total de perfumes: ${perfumes.length}\n`);
  
  // Generar HTML con links
  let html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fraganzia - Links Fragrantica</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 1200px; margin: 40px auto; padding: 0 20px; }
    h1 { color: #7B2FBE; }
    .instructions { background: #f5f2fb; padding: 20px; border-radius: 10px; margin-bottom: 30px; }
    .instructions ol { margin: 10px 0; }
    .instructions li { margin: 8px 0; }
    .perfume { border: 1px solid #ddd; padding: 15px; margin-bottom: 15px; border-radius: 8px; }
    .perfume h3 { margin: 0 0 10px 0; color: #333; }
    .perfume .meta { color: #666; font-size: 14px; margin-bottom: 10px; }
    .perfume a { display: inline-block; background: #7B2FBE; color: white; padding: 8px 16px; 
                 text-decoration: none; border-radius: 5px; margin-right: 10px; }
    .perfume a:hover { background: #9b4ee5; }
    .perfume textarea { width: 100%; min-height: 150px; font-family: monospace; font-size: 12px; 
                        margin-top: 10px; padding: 10px; border-radius: 5px; border: 1px solid #ddd; }
    .copy-btn { background: #22c55e; }
    .copy-btn:hover { background: #16a34a; }
    .script-box { background: #1e1e1e; color: #d4d4d4; padding: 20px; border-radius: 8px; 
                  margin: 20px 0; overflow-x: auto; }
    .script-box code { font-family: 'Consolas', 'Monaco', monospace; white-space: pre; }
    .copy-script { background: #22c55e; color: white; padding: 10px 20px; border: none; 
                   border-radius: 5px; cursor: pointer; margin-top: 10px; }
  </style>
</head>
<body>
  <h1>🌸 Fraganzia - Sincronización con Fragrantica</h1>
  
  <div class="instructions">
    <h2>📋 Instrucciones</h2>
    <ol>
      <li>Para cada perfume, haz clic en "Buscar en Fragrantica"</li>
      <li>En la página de Fragrantica, abre la consola del navegador (F12 → Console)</li>
      <li>Copia y pega el script de extracción (abajo) en la consola</li>
      <li>Presiona Enter - el script extraerá las notas y descripción</li>
      <li>Copia el JSON generado y pégalo en el textarea correspondiente aquí</li>
      <li>Al final, guarda esta página (Ctrl+S) para conservar los datos</li>
    </ol>
    
    <h3>🔧 Script de Extracción (copia esto a la consola del navegador):</h3>
    <div class="script-box">
      <code id="extraction-script">(function() {
  console.log('🔍 Extrayendo datos de Fragrantica...\\n');
  try {
    const descElement = document.querySelector('[itemprop="description"]');
    const descripcion = descElement ? descElement.innerText.trim() : '';
    
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
                if (text && text.length > 1 && text.length < 50) notes.push(text);
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
    
    const result = {
      url: window.location.href,
      descripcion,
      notasSalida: extractNotes('Top Notes'),
      notasCorazon: extractNotes('Middle Notes'),
      notasFondo: extractNotes('Base Notes')
    };
    
    console.log('✅ Datos extraídos:\\n', JSON.stringify(result, null, 2));
    if (navigator.clipboard) {
      navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    }
    return result;
  } catch (error) {
    console.error('❌ Error:', error);
  }
})();</code>
    </div>
    <button class="copy-script" onclick="copyScript()">📋 Copiar Script</button>
  </div>
  
  <h2>Perfumes (${perfumes.length})</h2>
  
`;

  // Agregar cada perfume
  perfumes.forEach((perfume, index) => {
    const cleanNombre = perfume.nombre
      .replace(new RegExp(perfume.marca, 'gi'), '')
      .replace(/\d+ML$/i, '')
      .trim();
    
    const searchQuery = encodeURIComponent(`${perfume.marca} ${cleanNombre}`);
    const fragranticaUrl = `https://www.fragrantica.com/search/?query=${searchQuery}`;
    
    html += `
  <div class="perfume" id="perfume-${index}">
    <h3>${index + 1}. ${perfume.marca} - ${perfume.nombre}</h3>
    <div class="meta">
      <strong>ID:</strong> ${perfume.id} | 
      <strong>Género:</strong> ${perfume.genero || 'N/A'} | 
      <strong>Familia:</strong> ${perfume.familiaOlfativa || 'N/A'}
    </div>
    <a href="${fragranticaUrl}" target="_blank">🔍 Buscar en Fragrantica</a>
    <button class="copy-btn" onclick="copyId('${perfume.id}')">📋 Copiar ID</button>
    <textarea id="data-${index}" placeholder="Pega aquí el JSON extraído de Fragrantica..."></textarea>
  </div>
`;
  });

  html += `
  
  <script>
    function copyScript() {
      const script = document.getElementById('extraction-script').innerText;
      navigator.clipboard.writeText(script).then(() => {
        alert('✅ Script copiado al portapapeles!');
      });
    }
    
    function copyId(id) {
      navigator.clipboard.writeText(id).then(() => {
        alert('✅ ID copiado: ' + id);
      });
    }
    
    // Auto-save to localStorage
    document.querySelectorAll('textarea').forEach((textarea, index) => {
      // Load saved data
      const saved = localStorage.getItem('perfume-' + index);
      if (saved) textarea.value = saved;
      
      // Save on change
      textarea.addEventListener('change', (e) => {
        localStorage.setItem('perfume-' + index, e.target.value);
      });
    });
  </script>
</body>
</html>`;

  // Guardar HTML
  writeFileSync('./scripts/fragrantica-perfumes.html', html, 'utf-8');
  
  console.log('✅ Archivo generado: scripts/fragrantica-perfumes.html');
  console.log('\n📝 Próximos pasos:');
  console.log('   1. Abre fragrantica-perfumes.html en tu navegador');
  console.log('   2. Sigue las instrucciones para extraer datos');
  console.log('   3. Ejecuta import-fragrantica-data.mjs cuando termines');
}

main().catch(console.error);
