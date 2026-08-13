const fs = require('fs');
const { createCanvas } = require('canvas');

async function renderPdf(filePath) {
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  pdfjsLib.GlobalWorkerOptions.workerSrc = require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs');

  console.log('PDF.js version:', pdfjsLib.version);
  const data = new Uint8Array(fs.readFileSync(filePath));
  
  const loadingTask = pdfjsLib.getDocument({
    data: data,
    disableFontFace: true,
    verbosity: 0
  });

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

renderPdf('uploads/alumni/alumni_doc_22BQ1A0432_1785927544203.pdf').catch(err => {
    console.error('Error rendering:', err);
});
