// extract-pdf-text.cjs
const { PDFParse } = require('pdf-parse');
const { readFileSync } = require('fs');

const buf = readFileSync('CATALOGO ARABES MAYORISTA 13-07.pdf');
const parser = new PDFParse({ data: buf });
parser.getText().then(d => {
  console.log('=== PAGES:', d.total);
  console.log(d.text.substring(0, 5000));
}).catch(e => console.error(e.message));
