const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const StudentService = require('../src/services/student.service');

async function main() {
  console.log('--- Testing reExtractSkills error handling ---');
  
  try {
    // We will find a student and delete their resume file temporarily to test 404
    const student = await prisma.student.findFirst({
      include: { user: true }
    });

    if (!student) {
      console.log('No student found in DB. Test aborted.');
      return;
    }

    console.log(`Testing with student ID: ${student.userId}`);

    // Get existing resume
    const existingResume = await prisma.resume.findUnique({
      where: { studentId: student.id }
    });

    if (!existingResume) {
      console.log('Student has no resume to test with. Aborting.');
      return;
    }

    // Save state
    const originalFileName = existingResume.fileName;
    const originalFilePath = existingResume.filePath;

    console.log('\n--- Test 1: Missing File (Should throw 404) ---');
    await prisma.resume.update({
      where: { id: existingResume.id },
      data: {
        fileName: 'missing_file.pdf',
        filePath: '/uploads/resumes/fake_missing_123.pdf'
      }
    });

    try {
      await StudentService.reExtractSkills(student.userId);
      console.log('FAIL: Did not throw error');
    } catch (e) {
      console.log(`PASS: Caught error -> [${e.statusCode}] ${e.message}`);
    }

    console.log('\n--- Test 2: Legacy .doc file (Should throw 422) ---');
    await prisma.resume.update({
      where: { id: existingResume.id },
      data: {
        fileName: 'old_resume.doc',
        filePath: '/uploads/resumes/old_resume.doc'
      }
    });

    // We must create the dummy file so fs.existsSync passes
    const fs = require('fs');
    const path = require('path');
    const diskPath = path.resolve(__dirname, '../uploads/resumes/old_resume.doc');
    
    // Ensure dir exists
    fs.mkdirSync(path.dirname(diskPath), { recursive: true });
    fs.writeFileSync(diskPath, 'fake doc binary content');

    try {
      await StudentService.reExtractSkills(student.userId);
      console.log('FAIL: Did not throw error');
    } catch (e) {
      console.log(`PASS: Caught error -> [${e.statusCode}] ${e.message}`);
    }

    console.log('\n--- Test 3: Corrupted / Empty DOCX (Should throw 422) ---');
    await prisma.resume.update({
      where: { id: existingResume.id },
      data: {
        fileName: 'empty_resume.docx',
        filePath: '/uploads/resumes/empty_resume.docx'
      }
    });

    const docxDiskPath = path.resolve(__dirname, '../uploads/resumes/empty_resume.docx');
    // Create a valid but empty docx (A valid docx is a zip file, so a fake binary will crash mammoth which will throw an error, returning 422!)
    fs.writeFileSync(docxDiskPath, 'fake docx binary content');

    try {
      await StudentService.reExtractSkills(student.userId);
      console.log('FAIL: Did not throw error');
    } catch (e) {
      console.log(`PASS: Caught error -> [${e.statusCode}] ${e.message}`);
    }

    // Restore DB
    await prisma.resume.update({
      where: { id: existingResume.id },
      data: {
        fileName: originalFileName,
        filePath: originalFilePath
      }
    });

    // Cleanup FS
    if (fs.existsSync(diskPath)) fs.unlinkSync(diskPath);
    if (fs.existsSync(docxDiskPath)) fs.unlinkSync(docxDiskPath);

    console.log('\n--- Cleanup successful ---');

  } catch (err) {
    console.error('Fatal Test Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
