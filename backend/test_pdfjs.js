const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

console.log('PDF.js version:', pdfjsLib.version);

// Set worker
pdfjsLib.GlobalWorkerOptions.workerSrc = require.resolve('pdfjs-dist/legacy/build/pdf.worker.js');

async function renderPdf(filePath) {
  const data = new Uint8Array(fs.readFileSync(filePath));
  const loadingTask = pdfjsLib.getDocument({ data });
  const pdfDocument = await loadingTask.promise;
  console.log('Pages:', pdfDocument.numPages);
  
  const page = await pdfDocument.getPage(1);
  const viewport = page.getViewport({ scale: 2.0 });
  const canvas = createCanvas(viewport.width, viewport.height);
  const context = canvas.getContext('2d');
  
  await page.render({
    canvasContext: context,
    viewport: viewport
  }).promise;
  
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync('test_out.png', buffer);
  console.log('Rendered test_out.png');
}

// Create a dummy PDF if none exists
const dummyPdfPath = 'dummy.pdf';
if (!fs.existsSync(dummyPdfPath)) {
    console.log('Run this script against a real PDF');
}

renderPdf('dummy.pdf').catch(err => {
    console.error('Error rendering:', err);
});
