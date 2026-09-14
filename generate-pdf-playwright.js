const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function generatePDF() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const htmlPath = path.join(__dirname, 'catalogo-print.html');
  const fileUrl = `file://${htmlPath}`;

  console.log(`Abriendo: ${fileUrl}`);
  await page.goto(fileUrl, { waitUntil: 'networkidle' });

  // Esperar a que el script de generación termine
  await page.evaluate(() => {
    return new Promise((resolve) => {
      setTimeout(resolve, 2000);
    });
  });

  const pdfPath = path.join(__dirname, 'bioartesa-welcome-box.pdf');

  await page.pdf({
    path: pdfPath,
    format: 'A4',
    landscape: true,
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 }
  });

  const stats = fs.statSync(pdfPath);
  console.log(`✓ PDF generado: ${pdfPath}`);
  console.log(`  Tamaño: ${(stats.size / 1024 / 1024).toFixed(2)}MB`);

  await browser.close();
}

generatePDF().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
