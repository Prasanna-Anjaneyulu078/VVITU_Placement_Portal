const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

async function test() {
  try {
    const pdfPath = path.join(__dirname, '..', '..', 'Tarun_Marks_memo.pdf');
    if (!fs.existsSync(pdfPath)) {
      console.log('Cannot find PDF at:', pdfPath);
      // fallback search
      return;
    }
    
    console.log('Loading pdf...');
    const buffer = fs.readFileSync(pdfPath);
    const parser = new PDFParse({ data: buffer });
    
    console.log('Extracting text...');
    const data = await parser.getText();
    console.log('Text length:', data.text.length);
    console.log('Text content:', data.text.trim().substring(0, 100));
    
    console.log('Taking screenshot...');
    const result = await parser.getScreenshot({ imageBuffer: true });
    console.log('Screenshots taken:', result.pages.length);
    
    for (let i = 0; i < result.pages.length; i++) {
      fs.writeFileSync(`temp_page_${i}.png`, result.pages[i].data);
      console.log(`Saved temp_page_${i}.png, size: ${result.pages[i].data.length}`);
    }
    
    await parser.destroy();
  } catch (e) {
    console.error(e);
  }
}

test();
