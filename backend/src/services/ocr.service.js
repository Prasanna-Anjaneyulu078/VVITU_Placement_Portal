const fs = require('fs');
const path = require('path');

let pdfParseMod;
try {
  pdfParseMod = require('pdf-parse');
  if (typeof pdfParseMod !== 'function') {
    console.warn('[DEPENDENCY] pdf-parse API shape unexpected – not a function');
  }
} catch (e) {
  console.warn('[DEPENDENCY] pdf-parse not available:', e.message);
}

let createWorker;
try {
  ({ createWorker } = require('tesseract.js'));
} catch (e) {
  console.warn('[DEPENDENCY] tesseract.js not available:', e.message);
}

let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.warn('[DEPENDENCY] sharp not available:', e.message);
}

const PdfRendererService = require('./pdfRenderer.service');

class OcrService {
  /**
   * Remove control characters and normalize line endings.
   */
  static cleanText(text) {
    if (!text) return '';
    let cleaned = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '');
    return cleaned;
  }

  static getFileBuffer(file) {
    if (file.buffer) return file.buffer;
    if (file.path && fs.existsSync(file.path)) {
      return fs.readFileSync(file.path);
    }
    throw new Error('INVALID_FILE: Cannot read file – no buffer or valid path provided.');
  }

  /**
   * Assess whether extracted text is meaningful (not just whitespace or garbage).
   */
  static isTextMeaningful(text) {
    if (!text) return false;
    const stripped = text.replace(/\s+/g, '').trim();
    const wordCount = text.split(/\s+/).filter(w => w.length > 1).length;
    const alphaCount = (text.match(/[a-zA-Z]/g) || []).length;
    return wordCount >= 10 && alphaCount >= 30 && stripped.length >= 50;
  }

  /**
   * Backwards compatibility for StudentService resume parsing.
   */
  static async extractText(file) {
    const doc = await this.extractDocument(file);
    return doc.text;
  }

  /**
   * Backward compatibility for extractOcrData.
   */
  static async extractOcrData(file) {
    const doc = await this.extractDocument(file);
    const lines = doc.text.split('\n');
    return {
      text: doc.text,
      confidence: doc.confidence || 0,
      lines: lines.map(line => ({
        text: line,
        confidence: doc.confidence || 0,
        bbox: null,
        words: line.split(/\s+/).filter(w => w).map(w => ({ text: w, confidence: doc.confidence || 0, bbox: null }))
      })),
      blocks: []
    };
  }

  /**
   * Run Tesseract OCR with a specific PSM mode.
   */
  static async runTesseract(imagePath, psm = 3) {
    if (!createWorker) {
      throw new Error('OCR_ENGINE_UNAVAILABLE: tesseract.js is not installed.');
    }
    let worker;
    try {
      worker = await createWorker('eng');
      await worker.setParameters({ tessedit_pageseg_mode: psm });
      const ret = await worker.recognize(imagePath);
      return {
        text: this.cleanText(ret.data.text || ''),
        confidence: ret.data.confidence || 0
      };
    } catch (err) {
      throw new Error(`OCR_ENGINE_FAILED: Tesseract failed (PSM ${psm}): ${err.message}`);
    } finally {
      if (worker) await worker.terminate().catch(() => {});
    }
  }

  /**
   * Multi-pass image OCR with preprocessing.
   * Pass 1: PSM 6 (uniform text block)
   * Pass 2: PSM 11 (sparse text – good for certificates/memos)
   * Pass 3: PSM 3 (default auto detection)
   * Returns the best result.
   */
  static async advancedImageOcr(imageBuffer) {
    if (!sharp) {
      throw new Error('OCR_ENGINE_UNAVAILABLE: sharp is not installed for image preprocessing.');
    }
    if (!createWorker) {
      throw new Error('OCR_ENGINE_UNAVAILABLE: tesseract.js is not installed.');
    }

    const tempDir = path.join(__dirname, '..', '..', 'uploads', 'temp-ocr');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const tempImagePath = path.join(tempDir, `doc-${Date.now()}-${Math.random().toString(36).substring(7)}.png`);

    try {
      // Preprocess: grayscale → normalize contrast → slight denoise
      await sharp(imageBuffer)
        .grayscale()
        .normalize()
        .sharpen({ sigma: 1.0 })
        .toFile(tempImagePath);

      const results = [];

      // Pass 1: PSM 6 – assumes uniform text block
      try {
        const r1 = await this.runTesseract(tempImagePath, 6);
        results.push(r1);
        console.log(`[OCR-IMAGE] PSM 6 confidence: ${r1.confidence}`);
      } catch (e) {
        console.warn('[OCR-IMAGE] PSM 6 failed:', e.message);
      }

      // Pass 2: PSM 11 – sparse text (good for IDs/certificates with scattered text)
      try {
        const r2 = await this.runTesseract(tempImagePath, 11);
        results.push(r2);
        console.log(`[OCR-IMAGE] PSM 11 confidence: ${r2.confidence}`);
      } catch (e) {
        console.warn('[OCR-IMAGE] PSM 11 failed:', e.message);
      }

      // Pass 3: PSM 3 – auto detect (default)
      try {
        const r3 = await this.runTesseract(tempImagePath, 3);
        results.push(r3);
        console.log(`[OCR-IMAGE] PSM 3 confidence: ${r3.confidence}`);
      } catch (e) {
        console.warn('[OCR-IMAGE] PSM 3 failed:', e.message);
      }

      if (results.length === 0) {
        throw new Error('OCR_FAILED: All OCR passes failed.');
      }

      // Choose the result with highest confidence but also meaningful text
      const meaningful = results.filter(r => this.isTextMeaningful(r.text));
      if (meaningful.length > 0) {
        const best = meaningful.reduce((a, b) => a.confidence >= b.confidence ? a : b);
        console.log(`[OCR-IMAGE] Selected best pass with confidence: ${best.confidence}, text length: ${best.text.length}`);
        return best;
      }

      // Fall back to highest confidence even if not meaningful
      const best = results.reduce((a, b) => a.confidence >= b.confidence ? a : b);
      console.warn(`[OCR-IMAGE] No meaningful text found. Returning highest confidence result (${best.confidence}).`);
      return best;
    } finally {
      try { if (fs.existsSync(tempImagePath)) fs.unlinkSync(tempImagePath); } catch (e) {}
    }
  }

  /**
   * Unified document extraction.
   * Returns: { text, confidence, pageCount, source }
   */
  static async extractDocument(file) {
    if (!file) {
      throw new Error('INVALID_FILE: No file provided for OCR processing.');
    }

    const filePath = file.path || '';
    console.log('[DOCUMENT] Processing:', {
      exists: filePath ? fs.existsSync(filePath) : false,
      path: filePath ? path.basename(filePath) : 'in-memory',
      size: filePath && fs.existsSync(filePath) ? fs.statSync(filePath).size : (file.buffer ? file.buffer.length : null)
    });

    const buffer = this.getFileBuffer(file);
    const mimetype = (file.mimetype || '').toLowerCase();
    const ext = path.extname(file.originalname || file.path || '').toLowerCase();

    // ─── 1. PDF Processing ─────────────────────────────────────────────────
    if (mimetype === 'application/pdf' || ext === '.pdf') {
      return await this._processPdf(buffer, file.originalname || ext);
    }

    // ─── 2. Plain text / CSV ───────────────────────────────────────────────
    if (mimetype.startsWith('text/') || ext === '.txt' || ext === '.csv') {
      const txt = this.cleanText(buffer.toString('utf-8'));
      console.log('[OCR] Returning plain text, length:', txt.length);
      return { text: txt, confidence: 100, pageCount: 1, source: 'TEXT' };
    }

    // ─── 3. Word Documents (.docx) ─────────────────────────────────────────
    if (ext === '.docx' || mimetype.includes('wordprocessingml')) {
      try {
        const mammoth = require('mammoth');
        const result = await mammoth.extractRawText({ buffer });
        const txt = this.cleanText(result.value || '');
        console.log('[OCR] Returning DOCX text, length:', txt.length);
        return { text: txt, confidence: 100, pageCount: 1, source: 'DOCX_TEXT' };
      } catch (e) {
        throw new Error(`OCR_FAILED: Could not extract text from DOCX: ${e.message}`);
      }
    }

    if (ext === '.doc' || mimetype === 'application/msword') {
      throw new Error('UNSUPPORTED_FILE: Legacy .doc format is not supported. Please convert to PDF.');
    }

    // ─── 4. Image Processing (JPG/PNG/JPEG) ────────────────────────────────
    if (mimetype.startsWith('image/') || ['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
      return await this._processImage(buffer);
    }

    throw new Error(`UNSUPPORTED_FILE: Unsupported file type: ${mimetype || ext}`);
  }

  // ─── Private: PDF Processing ───────────────────────────────────────────────
  static async _processPdf(buffer, originalName) {
    // Try native text extraction first
    let nativeText = '';
    let nativeExtractAttempted = false;

    if (pdfParseMod) {
      try {
        nativeExtractAttempted = true;
        let nativeData;

        if (typeof pdfParseMod === 'function') {
          nativeData = await pdfParseMod(buffer);
        } else {
          console.warn('[OCR-PDF] Unrecognised pdf-parse API. Will attempt OCR fallback.');
        }

        nativeText = this.cleanText(nativeData?.text || '');
      } catch (e) {
        console.warn('[OCR-PDF] Native text extraction failed:', e.message);
        nativeText = '';
      }
    }

    if (this.isTextMeaningful(nativeText)) {
      console.log(`[OCR-PDF] Native text extraction succeeded. Length: ${nativeText.length}`);
      return { text: nativeText, confidence: 100, pageCount: 1, source: 'PDF_TEXT' };
    }

    if (nativeExtractAttempted) {
      console.log('[OCR-PDF] Native PDF text insufficient. Falling back to scanned PDF OCR...');
    } else {
      console.log('[OCR-PDF] pdf-parse unavailable. Attempting scanned PDF OCR...');
    }

    // Scanned PDF OCR via PdfRendererService
    let pdfImages;
    try {
      pdfImages = await PdfRendererService.renderPdfToImages(buffer, 2.0);
    } catch (imgErr) {
      throw new Error(imgErr.message || `PDF_RENDER_FAILED: Could not render PDF pages to images: ${imgErr}`);
    }

    if (!pdfImages || pdfImages.length === 0) {
      throw new Error('PDF_NO_TEXT: No pages could be rendered from this PDF.');
    }

    console.log(`[OCR-PDF] Rendering ${pdfImages.length} page(s) for OCR...`);

    let fullText = '';
    let totalConfidence = 0;
    let successfulPages = 0;

    for (let i = 0; i < pdfImages.length; i++) {
      try {
        const pageBuffer = Buffer.from(pdfImages[i]);
        const pageOcr = await this.advancedImageOcr(pageBuffer);
        fullText += `\n--- PAGE ${i + 1} ---\n` + pageOcr.text + '\n';
        totalConfidence += pageOcr.confidence;
        successfulPages++;
        console.log(`[OCR-PDF] Page ${i + 1}: confidence ${pageOcr.confidence}, text length ${pageOcr.text.length}`);
      } catch (pageErr) {
        console.warn(`[OCR-PDF] Page ${i + 1} OCR failed:`, pageErr.message);
        fullText += `\n--- PAGE ${i + 1} (OCR FAILED) ---\n`;
      }
    }

    if (successfulPages === 0) {
      throw new Error('OCR_FAILED: All PDF pages failed OCR processing.');
    }

    const avgConfidence = totalConfidence / successfulPages;

    console.log(`[OCR-PDF] Scanned PDF OCR complete. Pages: ${pdfImages.length}, Avg confidence: ${avgConfidence}`);

    return {
      text: this.cleanText(fullText),
      confidence: avgConfidence,
      pageCount: pdfImages.length,
      source: 'TESSERACT_SCANNED_PDF'
    };
  }

  // ─── Private: Image Processing ─────────────────────────────────────────────
  static async _processImage(buffer) {
    const imgOcr = await this.advancedImageOcr(buffer);
    console.log(`[OCR-IMAGE] Image OCR complete. Confidence: ${imgOcr.confidence}, length: ${imgOcr.text.length}`);
    return {
      text: imgOcr.text,
      confidence: imgOcr.confidence,
      pageCount: 1,
      source: 'TESSERACT_IMAGE'
    };
  }
}

module.exports = OcrService;
