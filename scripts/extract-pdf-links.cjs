// extract-pdf-links.cjs — extract all hyperlinks from PDF pages and match to products
const { PDFParse } = require('pdf-parse');
const { readFileSync, writeFileSync } = require('fs');

const buf = readFileSync('CATALOGO ARABES MAYORISTA 13-07.pdf');
const parser = new PDFParse({ data: buf });

async function run() {
  const info = await parser.getInfo({ parsePageInfo: true });
  console.log('Total pages:', info.total);
  
  const result = {};
  let totalLinks = 0;
  
  for (const page of info.pages) {
    const imgLinks = page.links.filter(l => 
      l.url && (
        l.url.includes('silkperfumes') || 
        l.url.includes('perfumenz') ||
        l.url.includes('gamma') ||
        l.url.includes('imgur') ||
        l.url.includes('parfumo') ||
        l.url.match(/\.(jpg|jpeg|png|webp)/i)
      )
    );
    if (imgLinks.length > 0) {
      result[page.pageNumber] = imgLinks.map(l => l.url);
      totalLinks += imgLinks.length;
      console.log(`Page ${page.pageNumber}: ${imgLinks.length} image links`);
      imgLinks.slice(0, 3).forEach(l => console.log('  ', l.url));
    }
  }
  
  console.log('\nTotal image links found:', totalLinks);
  writeFileSync('scripts/pdf-links.json', JSON.stringify(result, null, 2));
  console.log('Saved to scripts/pdf-links.json');
}

run().catch(e => {
  console.error('Error:', e.message);
  // Try getText approach for links
  const parser2 = new PDFParse({ data: buf });
  parser2.getText({ pageJoiner: '\n---PAGE_END---\n' }).then(d => {
    // Look for URLs in the text
    const urls = d.text.match(/https?:\/\/[^\s\n]+/g) || [];
    const imgUrls = urls.filter(u => u.includes('silkperfumes') || u.includes('perfumenz') || u.includes('gamma'));
    console.log('URLs found in text:', imgUrls.length);
    imgUrls.slice(0, 10).forEach(u => console.log('  ', u));
  });
});
