const fs = require('fs');
const { PDFParse } = require('pdf-parse');
const path = require('path');
const { createWorker } = require('tesseract.js');

async function testPdfOcr() {
  const pdfPath = path.resolve('D:/VVITU - Placement Portal/backend/uploads/resumes/student-1786528798461-576415125.pdf');
  if (!fs.existsSync(pdfPath)) {
    console.log("File not found:", pdfPath);
    return;
  }
  const buffer = fs.readFileSync(pdfPath);
  try {
    const parser = new PDFParse({ data: buffer });
    
    // Attempt normal extraction
    const textResult = await parser.getText();
    if (textResult.text.trim().length > 0) {
      console.log("Extracted text directly!");
    } else {
      console.log("No text extracted, falling back to OCR...");
    }

    // Attempt screenshot extraction
    const screenshotResult = await parser.getScreenshot({ imageBuffer: true });
    await parser.destroy();
    console.log(`Found ${screenshotResult.pages.length} pages to OCR.`);
    
    const worker = await createWorker('eng');
    let fullText = '';
    for (let i = 0; i < screenshotResult.pages.length; i++) {
       const pageData = screenshotResult.pages[i].data;
       console.log(`Running OCR on page ${i+1}... (buffer size: ${pageData.length})`);
       const ret = await worker.recognize(Buffer.from(pageData));
       fullText += ret.data.text + '\n';
    }
    await worker.terminate();
    console.log("OCR Result length:", fullText.length);
  } catch (err) {
    console.error("Extraction error:", err);
  }
}

testPdfOcr();
