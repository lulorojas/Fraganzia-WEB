// pdf-server.cjs - Servidor estático para ver el PDF viewer con imágenes locales
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3456;
const ROOT = path.join(__dirname, '..');

const MIME = {
  '.html': 'text/html',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.js': 'text/javascript',
  '.css': 'text/css',
};

http.createServer((req, res) => {
  const url = req.url === '/' ? '/pdf-viewer-light.html' : req.url;
  const filePath = path.join(ROOT, decodeURIComponent(url));
  const ext = path.extname(filePath).toLowerCase();
  
  if (!fs.existsSync(filePath)) {
    res.writeHead(404); res.end('Not found: ' + url); return;
  }
  
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
}).listen(PORT, () => {
  console.log(`✅ Servidor en http://localhost:${PORT}`);
  console.log('Abrí http://localhost:3456 en el browser');
});
