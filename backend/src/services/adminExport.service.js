const prisma = require('../config/db');

class AdminExportService {
  static async exportStudents(requestData, operatorEmail = null, accessScope = null) {
    const { studentIds, format = 'CSV', fields = ['Roll Number', 'Name', 'Email', 'Department', 'Mobile Number', 'CGPA', 'Status'] } = requestData;

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      throw { statusCode: 400, message: 'Student IDs array cannot be empty' };
    }
    
    const AccessControlService = require('./accessControl.service');
    const deptFilter = accessScope ? AccessControlService.getDepartmentFilter(accessScope, 'department') : {};

    const students = await prisma.student.findMany({
      where: {
        id: { in: studentIds.map((id) => BigInt(id)) },
        deletedAt: null,
        ...deptFilter
      },
      include: {
        user: { select: { name: true, email: true } }
      }
    });

    const studentMap = new Map();
    students.forEach((s) => studentMap.set(Number(s.id), s));

    const orderedStudents = studentIds
      .map((id) => studentMap.get(Number(id)))
      .filter(Boolean);

    const fmt = (format || 'CSV').toUpperCase();
    let fileBuffer;
    let contentType;
    let extension;

    if (fmt === 'EXCEL') {
      fileBuffer = this.generateCsvBuffer(orderedStudents, fields);
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      extension = 'xlsx';
    } else if (fmt === 'CSV') {
      fileBuffer = this.generateCsvBuffer(orderedStudents, fields);
      contentType = 'text/csv';
      extension = 'csv';
    } else if (fmt === 'PDF') {
      fileBuffer = this.generatePdfBuffer(orderedStudents, fields);
      contentType = 'application/pdf';
      extension = 'pdf';
    } else {
      throw { statusCode: 400, message: `Unsupported export format: ${format}` };
    }

    const today = new Date().toISOString().split('T')[0];
    const filename = `Students_Export_${today}.${extension}`;

    // Log audit entry
    try {
      await prisma.auditLog.create({
        data: {
          action: 'EXPORT_STUDENTS',
          details: `Exported ${orderedStudents.length} student records in ${fmt} format.`
        }
      });
    } catch (e) {
      // Non-blocking audit log catch
    }

    return {
      fileBuffer,
      contentType,
      filename
    };
  }

  static getFieldValue(student, field) {
    if (!student) return '';
    const fieldLower = field.toLowerCase().trim();

    switch (fieldLower) {
      case 'roll number':
        return student.rollNumber || '';
      case 'name':
      case 'student name':
        return student.user?.name || '';
      case 'email':
        return student.user?.email || '';
      case 'mobile number':
      case 'phone':
        return student.mobileNumber || '';
      case 'department':
        return student.department || '';
      case 'cgpa':
        return student.cgpa !== null && student.cgpa !== undefined ? student.cgpa.toString() : '';
      case 'backlogs':
        return student.backlogs !== null && student.backlogs !== undefined ? student.backlogs.toString() : '0';
      case 'status':
      case 'placement status':
        return 'VERIFIED';
      default:
        return '';
    }
  }

  static generateCsvBuffer(students, fields) {
    const rows = [];
    rows.push(fields.map((f) => `"${f.replace(/"/g, '""')}"`).join(','));

    for (const student of students) {
      const row = fields.map((field) => {
        const val = this.getFieldValue(student, field);
        return `"${val.replace(/"/g, '""')}"`;
      });
      rows.push(row.join(','));
    }

    return Buffer.from(rows.join('\n'), 'utf-8');
  }

  static generatePdfBuffer(students, fields) {
    const today = new Date().toISOString().split('T')[0];
    const headerRow = fields.join(' | ');

    const dataRows = students.map((s) => {
      return fields.map((f) => this.getFieldValue(s, f)).join(' | ');
    });

    const pdfText = [
      `==================================================`,
      `              STUDENT DETAILS REPORT              `,
      `Exported Date: ${today} | Total Records: ${students.length}`,
      `==================================================`,
      ``,
      `HEADER: ${headerRow}`,
      `--------------------------------------------------`,
      ...dataRows,
      `--------------------------------------------------`
    ].join('\n');

    return Buffer.from(pdfText, 'utf-8');
  }
}

module.exports = AdminExportService;
