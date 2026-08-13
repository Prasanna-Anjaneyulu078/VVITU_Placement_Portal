const fs = require('fs');
const { createCanvas } = require('canvas');

const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

class NodeCanvasFactory {
  create(width, height) {
    const canvas = createCanvas(width, height);
    const context = canvas.getContext('2d');
    return { canvas, context };
  }
  reset(canvasAndContext, width, height) {
    canvasAndContext.canvas.width = width;
    canvasAndContext.canvas.height = height;
  }
  destroy(canvasAndContext) {
    canvasAndContext.canvas.width = 0;
    canvasAndContext.canvas.height = 0;
    canvasAndContext.canvas = null;
    canvasAndContext.context = null;
  }
}

async function renderPdf(filePath) {
  // We disable the worker for purely Node-based rendering in older pdfjs-dist
  pdfjsLib.GlobalWorkerOptions.disableWorker = true;
  
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
  const canvasFactory = new NodeCanvasFactory();
  const canvasAndContext = canvasFactory.create(viewport.width, viewport.height);
  
  await page.render({
    canvasContext: canvasAndContext.context,
    viewport: viewport,
    canvasFactory: canvasFactory
  }).promise;
  
  const buffer = canvasAndContext.canvas.toBuffer('image/png');
  fs.writeFileSync('test_out2.png', buffer);
  console.log('Rendered test_out2.png');
}

renderPdf('uploads/alumni/alumni_doc_22BQ1A0432_1785927544203.pdf').catch(err => {
    console.error('Error rendering:', err);
});
