const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function generate() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const htmlPath = path.join(__dirname, 'catalogo-bookmarks.html');
  const fileUrl = `file://${htmlPath}`;

  console.log('Renderizando catálogo con bookmarks...');
  await page.goto(fileUrl, { waitUntil: 'networkidle' });
  await page.evaluate(() => new Promise(r => setTimeout(r, 2000)));

  const pdfPath = path.join(__dirname, 'bioartesa-welcome-box.pdf');
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    landscape: true,
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 }
  });

  // Extraer páginas de bookmarks del HTML
  const bookmarks = await page.evaluate(() => {
    const bookmarkElements = document.querySelectorAll('[data-bookmark]');
    const bookmarkData = [];
    bookmarkElements.forEach((el, idx) => {
      bookmarkData.push({
        title: el.getAttribute('data-bookmark'),
        index: idx
      });
    });
    return bookmarkData;
  });

  const stats = fs.statSync(pdfPath);
  console.log(`✓ PDF base: ${(stats.size / 1024 / 1024).toFixed(2)}MB`);
  console.log(`✓ Bookmarks encontrados: ${bookmarks.length}`);
  console.log(JSON.stringify(bookmarks, null, 2));

  await browser.close();

  // Ahora agregar bookmarks con pikepdf
  console.log('Agregando bookmarks al PDF...');
  addBookmarksToPDF(pdfPath, bookmarks);
}

function addBookmarksToPDF(pdfPath, bookmarksInfo) {
  const pythonScript = `
import sys
try:
  import pikepdf
except ImportError:
  print("Error: pikepdf no instalado")
  sys.exit(1)

pdf_path = "${pdfPath}"
pdf = pikepdf.open(pdf_path)
root = pdf.open_outline()

# Definir estructura de bookmarks
bookmarks_structure = [
  ("Portada", 0, []),
  ("Panadería y repostería", 1, [
    ("Galletas", 2, []),
    ("Galletas Sin Gluten", 3, []),
    ("Crespillos", 4, []),
    ("Panes", 5, []),
    ("Bizcochos", 6, [])
  ]),
  ("Chocolates", 7, [
    ("Tabletas", 8, []),
    ("Cremas de Cacao", 9, [])
  ]),
  ("Frutos secos", 10, [
    ("Almendras", 11, []),
    ("Pistachos", 12, []),
    ("Nueces", 13, []),
    ("Mix", 14, [])
  ]),
  ("Frutas deshidratadas", 15, [
    ("Tropical", 16, []),
    ("Bayas", 17, []),
    ("Premium", 18, [])
  ]),
  ("Contacto", 19, [])
]

def add_bookmarks(parent, bookmarks, pdf):
  for title, page_idx, children in bookmarks:
    if page_idx < len(pdf.pages):
      child = parent.new_child(
        title=title,
        page_num=page_idx
      )
      if children:
        add_bookmarks(child, children, pdf)

add_bookmarks(root, bookmarks_structure, pdf)
pdf.save()
print("✓ Bookmarks agregados correctamente")
`;

  fs.writeFileSync('/tmp/add_bookmarks.py', pythonScript);
  const { execSync } = require('child_process');
  try {
    execSync('python3 /tmp/add_bookmarks.py', { stdio: 'inherit' });
  } catch (e) {
    console.error('Error al agregar bookmarks:', e.message);
  }
}

generate().catch(e => { console.error(e); process.exit(1); });
