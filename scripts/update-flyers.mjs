import { readFileSync, writeFileSync } from 'fs';

const dataUri = readFileSync('public/logo-crop-datauri.txt', 'utf8').trim();

const imgHtml = `<img src="${dataUri}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" />`;

const flyers = ['story-aniversario', 'story-pedidos', 'story-descuento'];

for (const name of flyers) {
  const path = `public/flyers/${name}.html`;
  let html = readFileSync(path, 'utf8');
  // Reemplazar SVG o img anterior con el logo real recortado
  html = html.replace(/<svg class="logo"[\s\S]*?<\/svg>/g, imgHtml);
  html = html.replace(/<img src="data:image[^"]*"[^>]*\/>/g, imgHtml);
  writeFileSync(path, html);
  console.log('Actualizado:', name);
}
