const fs = require('fs');
const prisma = require('../config/db');
const { hashPassword, generateDefaultPassword } = require('../utils/password.utils');

class AdminImportService {
  /**
   * Processes CSV / Excel text upload to create student accounts.
   */
  static async importStudents(file) {
    if (!file) {
      throw { statusCode: 400, message: 'Upload file is required' };
    }

    let fileContent = '';
    if (file.buffer) {
      fileContent = file.buffer.toString('utf-8');
    } else if (file.path && fs.existsSync(file.path)) {
      fileContent = fs.readFileSync(file.path, 'utf-8');
    } else {
      throw { statusCode: 400, message: 'Invalid or empty upload file' };
    }
    const lines = fileContent.split(/\r?\n/).filter((line) => line.trim().length > 0);

    if (lines.length <= 1) {
      return {
        created: 0,
        skipped: 0,
        failed: 0,
        importedStudents: []
      };
    }

    let created = 0;
    let skipped = 0;
    let failed = 0;
    const importedStudents = [];

    // Header row is index 0. Process data rows starting from index 1.
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const cells = line.split(/,|\t/).map((c) => c.replace(/^["']|["']$/g, '').trim());

      if (cells.length < 3) {
        failed++;
        continue;
      }

      const rollNumber = cells[0];
      const name = cells[1] || 'Student';
      const email = cells[2];
      const mobileNumber = cells[3] || null;
      const department = cells[4] || null;

      if (!email || !rollNumber) {
        skipped++;
        continue;
      }

      const cleanEmail = email.toLowerCase().trim();
      const cleanRoll = rollNumber.trim();

      // Check existing email or roll number
      const existingUser = await prisma.user.findUnique({ where: { email: cleanEmail } });
      const existingStudent = await prisma.student.findUnique({ where: { rollNumber: cleanRoll } });

      if (existingUser || existingStudent) {
        skipped++;
        continue;
      }

      try {
        const tempPassword = generateDefaultPassword(cleanRoll);
        const hashedPassword = await hashPassword(tempPassword);

        await prisma.$transaction(async (tx) => {
          const newUser = await tx.user.create({
            data: {
              name: name.trim(),
              email: cleanEmail,
              password: hashedPassword,
              role: 'STUDENT',
              accountStatus: 'ACTIVE'
            }
          });

          await tx.student.create({
            data: {
              userId: newUser.id,
              rollNumber: cleanRoll,
              department: department ? department.trim() : null,
              mobileNumber: mobileNumber ? mobileNumber.trim() : null
            }
          });
        });

        importedStudents.push({
          name: name.trim(),
          email: cleanEmail,
          password: tempPassword,
          temporaryPassword: tempPassword,
          rollNumber: cleanRoll
        });

        created++;
      } catch (err) {
        failed++;
      }
    }

    return {
      created,
      skipped,
      failed,
      importedStudents
    };
  }
}

module.exports = AdminImportService;
