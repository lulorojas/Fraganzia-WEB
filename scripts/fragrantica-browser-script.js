// fragrantica-browser-script.js
// INSTRUCCIONES:
// 1. Abre Fragrantica en tu navegador
// 2. Busca un perfume (ej: https://www.fragrantica.com/perfume/Lattafa/Yara-Tous-71234.html)
// 3. Abre la consola del navegador (F12 → Console)
// 4. Copia y pega este código completo
// 5. Presiona Enter
// 6. El script extraerá y mostrará las notas y descripción
// 7. Copia el resultado JSON

(function() {
  console.log('🔍 Extrayendo datos de Fragrantica...\n');
  
  try {
    // Extraer descripción
    const descElement = document.querySelector('[itemprop="description"]');
    const descripcion = descElement ? descElement.innerText.trim() : '';
    
    // Extraer notas olfativas
    function extractNotes(headerText) {
      const notes = [];
      const headers = Array.from(document.querySelectorAll('div'));
      
      for (const header of headers) {
        if (header.innerText === headerText) {
          // Encontrar el contenedor de notas (siguiente elemento relevante)
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
    
    const notasSalida = extractNotes('Top Notes');
    const notasCorazon = extractNotes('Middle Notes');
    const notasFondo = extractNotes('Base Notes');
    
    const result = {
      url: window.location.href,
      descripcion,
      notasSalida,
      notasCorazon,
      notasFondo
    };
    
    console.log('✅ Datos extraídos:\n');
    console.log(JSON.stringify(result, null, 2));
    console.log('\n📋 Copia el JSON de arriba y guárdalo para importar');
    
    // También copiar al clipboard si es posible
    if (navigator.clipboard) {
      navigator.clipboard.writeText(JSON.stringify(result, null, 2))
        .then(() => console.log('\n✅ ¡JSON copiado al portapapeles!'))
        .catch(() => console.log('\n⚠️  No se pudo copiar automáticamente'));
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Error:', error);
    return null;
  }
})();
