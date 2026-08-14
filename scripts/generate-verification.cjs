// generate-verification.cjs
// Genera un HTML para verificar visualmente todas las imágenes del catálogo
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

const serviceAccount = require('./serviceAccount.json');
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function main() {
  const snap = await db.collection('perfumes').get();
  const docs = snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));

  const rows = docs.map(d => {
    const img = (d.imagenes || [])[0] || '';
    const domain = img ? new URL(img).hostname : 'sin_imagen';
    const trusted = ['cdn.gamma.app', 'i.imgur.com'].includes(domain);
    const rowBg = !img ? '#ffe0e0' : trusted ? '#e0ffe0' : '#fffbe0';
    return `
      <tr style="background:${rowBg}">
        <td style="padding:4px;font-size:12px;max-width:220px">${d.nombre || ''}</td>
        <td style="padding:4px;font-size:10px;color:#666">${domain}</td>
        <td style="padding:4px;text-align:center">
          ${img ? `<img src="${img}" style="max-height:80px;max-width:100px;object-fit:contain" onerror="this.parentElement.innerHTML='<span style=color:red>ERROR</span>'" />` : '<span style="color:red">SIN IMAGEN</span>'}
        </td>
      </tr>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Verificación de Imágenes - Fraganzia</title>
<style>
body { font-family: sans-serif; font-size: 13px; }
table { border-collapse: collapse; width: 100%; }
th { background: #333; color: #fff; padding: 6px; text-align: left; position: sticky; top: 0; }
tr:hover { outline: 2px solid #007aff; }
.legend { padding: 8px; margin-bottom: 8px; }
.legend span { display: inline-block; padding: 3px 8px; margin: 2px; border-radius: 4px; font-size: 12px; }
</style>
</head>
<body>
<div class="legend">
  <b>Leyenda:</b>
  <span style="background:#e0ffe0">Verde = Gamma/Imgur (confiables)</span>
  <span style="background:#fffbe0">Amarillo = parfumo/CDN (verificar)</span>
  <span style="background:#ffe0e0">Rojo = sin imagen</span>
  <br><small>Total: ${docs.length} productos | Con imagen: ${docs.filter(d=>(d.imagenes||[]).length>0).length} | Sin imagen: ${docs.filter(d=>!(d.imagenes||[]).length).length}</small>
</div>
<table>
<thead><tr><th>Nombre</th><th>Fuente</th><th>Imagen</th></tr></thead>
<tbody>${rows}</tbody>
</table>
</body>
</html>`;

  const outPath = path.join(__dirname, '..', 'verification.html');
  fs.writeFileSync(outPath, html, 'utf8');
  console.log(`✅ Generado: ${outPath}`);
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
