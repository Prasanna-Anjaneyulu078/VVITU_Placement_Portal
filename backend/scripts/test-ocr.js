const path = require('path');
const { DocumentVerificationService } = require('../src/services/documentVerification.service');
const OcrService = require('../src/services/ocr.service');

async function testOCR() {
  console.log('Testing OCR with text file mock...');
  try {
    const file = {
      mimetype: 'text/plain',
      originalname: 'test.txt',
      buffer: Buffer.from('VASIREDDY VENKATADRI INSTITUTE OF TECHNOLOGY\nFULL NAME: SATISH KUMAR SAO\nROLL: 20BQ1A0501')
    };

    const result = await DocumentVerificationService.validateRegistrationData(
      file,
      'Satish Kumar',
      '20BQ1A0501',
      '127.0.0.1'
    );
    
    console.log('Result:', JSON.stringify(result, null, 2));
    
  } catch (err) {
    console.error('Error during OCR test:', err);
  }
}

testOCR();
