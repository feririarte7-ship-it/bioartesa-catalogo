const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function generate() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const htmlPath = path.join(__dirname, 'catalogo-luxury.html');
  const fileUrl = `file://${htmlPath}`;

  console.log('Renderizando catálogo de lujo...');
  await page.goto(fileUrl, { waitUntil: 'networkidle' });
  await page.evaluate(() => new Promise(r => setTimeout(r, 1500)));

  const pdfPath = path.join(__dirname, 'bioartesa-welcome-box.pdf');
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    landscape: true,
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 }
  });

  const stats = fs.statSync(pdfPath);
  console.log(`✓ PDF generado: ${(stats.size / 1024 / 1024).toFixed(2)}MB`);
  console.log(`  Path: ${pdfPath}`);

  await browser.close();
}

generate().catch(e => { console.error(e); process.exit(1); });
