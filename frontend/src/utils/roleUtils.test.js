import { describe, it, expect } from 'vitest';
import { formatUserRole, getPosterInfo } from './roleUtils';

describe('roleUtils', () => {
  describe('formatUserRole', () => {
    it('should format ADMIN and SUPER_ADMIN to Admin', () => {
      expect(formatUserRole('ADMIN')).toBe('Admin');
      expect(formatUserRole('SUPER_ADMIN')).toBe('Admin');
      expect(formatUserRole('admin')).toBe('Admin');
    });

    it('should format ALUMNI to Alumni', () => {
      expect(formatUserRole('ALUMNI')).toBe('Alumni');
      expect(formatUserRole('alumni')).toBe('Alumni');
    });

    it('should format STUDENT to Student', () => {
      expect(formatUserRole('STUDENT')).toBe('Student');
    });

    it('should handle unknown or missing roles gracefully', () => {
      expect(formatUserRole(null)).toBe('Admin');
      expect(formatUserRole(undefined)).toBe('Admin');
      expect(formatUserRole('')).toBe('Admin');
    });
  });

  describe('getPosterInfo', () => {
    it('should format Alumni poster info correctly', () => {
      const job = {
        postedBy: {
          name: 'Satish Kumar',
          role: 'ALUMNI',
          profileImageUrl: '/uploads/satish.jpg'
        }
      };
      const info = getPosterInfo(job);
      expect(info.name).toBe('Satish Kumar');
      expect(info.formattedRole).toBe('Alumni');
      expect(info.displayText).toBe('Posted by: Satish Kumar • Alumni');
      expect(info.profileImageUrl).toBe('/uploads/satish.jpg');
    });

    it('should format Admin poster info correctly', () => {
      const job = {
        postedBy: {
          name: 'Satish Kumar',
          role: 'ADMIN'
        }
      };
      const info = getPosterInfo(job);
      expect(info.name).toBe('Satish Kumar');
      expect(info.formattedRole).toBe('Admin');
      expect(info.displayText).toBe('Posted by: Satish Kumar • Admin');
    });

    it('should fallback cleanly when poster info is missing or legacy Placement Cell', () => {
      const info = getPosterInfo({});
      expect(info.name).toBe('VVIT Placement Cell');
      expect(info.formattedRole).toBe('Admin');
      expect(info.displayText).toBe('Posted by: VVIT Placement Cell • Admin');
    });
  });
});
