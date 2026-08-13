const fs = require('fs');
const { createCanvas } = require('canvas');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

// Disable worker for Node.js usage
pdfjsLib.GlobalWorkerOptions.disableWorker = true;

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

class PdfRendererService {
    /**
     * Get the number of pages in a PDF document.
     * @param {Buffer} fileBuffer 
     * @returns {Promise<number>}
     */
    static async getPdfPageCount(fileBuffer) {
        try {
            const data = new Uint8Array(fileBuffer);
            const loadingTask = pdfjsLib.getDocument({
                data: data,
                disableFontFace: true,
                verbosity: 0
            });
            const pdfDocument = await loadingTask.promise;
            return pdfDocument.numPages;
        } catch (error) {
            console.error('[PDF-RENDERER] Failed to get page count:', error.message);
            throw new Error(`PDF_RENDER_FAILED: ${error.message}`);
        }
    }

    /**
     * Render a specific page of a PDF document to an image buffer.
     * @param {Buffer} fileBuffer 
     * @param {number} pageNumber 
     * @param {number} scale 
     * @returns {Promise<Buffer>}
     */
    static async renderPdfPageToImage(fileBuffer, pageNumber, scale = 2.0) {
        try {
            const data = new Uint8Array(fileBuffer);
            const loadingTask = pdfjsLib.getDocument({
                data: data,
                disableFontFace: true,
                verbosity: 0
            });
            const pdfDocument = await loadingTask.promise;
            
            if (pageNumber > pdfDocument.numPages) {
                throw new Error(`Page ${pageNumber} out of bounds`);
            }

            const page = await pdfDocument.getPage(pageNumber);
            const viewport = page.getViewport({ scale });
            const canvasFactory = new NodeCanvasFactory();
            const canvasAndContext = canvasFactory.create(viewport.width, viewport.height);
            
            await page.render({
                canvasContext: canvasAndContext.context,
                viewport: viewport,
                canvasFactory: canvasFactory
            }).promise;
            
            const imageBuffer = canvasAndContext.canvas.toBuffer('image/png');
            canvasFactory.destroy(canvasAndContext);
            return imageBuffer;
        } catch (error) {
            console.error(`[PDF-RENDERER] Failed to render page ${pageNumber}:`, error.message);
            throw new Error(`PDF_RENDER_FAILED: ${error.message}`);
        }
    }

    /**
     * Render all pages of a PDF document to an array of image buffers.
     * @param {Buffer} fileBuffer 
     * @param {number} scale 
     * @returns {Promise<Buffer[]>}
     */
    static async renderPdfToImages(fileBuffer, scale = 2.0) {
        try {
            const data = new Uint8Array(fileBuffer);
            const loadingTask = pdfjsLib.getDocument({
                data: data,
                disableFontFace: true,
                verbosity: 0
            });
            const pdfDocument = await loadingTask.promise;
            const images = [];

            const canvasFactory = new NodeCanvasFactory();

            for (let i = 1; i <= pdfDocument.numPages; i++) {
                const page = await pdfDocument.getPage(i);
                const viewport = page.getViewport({ scale });
                const canvasAndContext = canvasFactory.create(viewport.width, viewport.height);
                
                await page.render({
                    canvasContext: canvasAndContext.context,
                    viewport: viewport,
                    canvasFactory: canvasFactory
                }).promise;
                
                images.push(canvasAndContext.canvas.toBuffer('image/png'));
                canvasFactory.destroy(canvasAndContext);
            }

            return images;
        } catch (error) {
            console.error('[PDF-RENDERER] Failed to render PDF:', error.message);
            throw new Error(`PDF_RENDER_FAILED: ${error.message}`);
        }
    }
}

module.exports = PdfRendererService;
