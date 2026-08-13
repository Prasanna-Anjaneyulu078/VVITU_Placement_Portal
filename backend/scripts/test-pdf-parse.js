const fs = require('fs');
const pdfParse = require('pdf-parse');
const path = require('path');

async function testPdf() {
  console.log("PDFParse:", typeof pdfParse);
  const pdfPath = path.resolve('D:/VVITU Placement Portal/backend/uploads/resumes/24BQ5A5403_1785924433052_B.V.Prasanna_Anjaneyulu_Resume.pdf');
  if (!fs.existsSync(pdfPath)) {
    console.log("File not found:", pdfPath);
    return;
  }
  const buffer = fs.readFileSync(pdfPath);
  try {
    const textResult = await pdfParse(buffer);
    console.log("Extracted length:", textResult.text.length);
    console.log(textResult.text.substring(0, 100));
  } catch (err) {
    console.error("Extraction error:", err);
  }
}

testPdf();
