const fs = require('fs');
const pdfImgConvert = require('pdf-img-convert');

async function test() {
    console.log('Testing pdf-img-convert...');
    const buffer = fs.readFileSync('uploads/alumni/alumni_doc_22BQ1A0432_1785927544203.pdf');
    const images = await pdfImgConvert.convert(buffer, { scale: 2.0 });
    console.log('Successfully rendered pages:', images.length);
    fs.writeFileSync('test_out2.png', Buffer.from(images[0]));
    console.log('Wrote first page to test_out2.png');
}

test().catch(e => console.error('Error:', e.message));
