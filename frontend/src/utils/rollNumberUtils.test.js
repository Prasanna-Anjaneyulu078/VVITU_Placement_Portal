import { describe, it, expect } from 'vitest';
import { parseRollNumberAndEligibility } from './rollNumberUtils';

describe('rollNumberUtils - parseRollNumberAndEligibility', () => {
  describe('Regular Student (1A)', () => {
    it('should mark Regular student as ineligible before 31 May of expected graduation year', () => {
      const roll = '23BQ1A5401'; // 2023 + 4 = 2027 graduation
      const testDate = new Date(2027, 3, 10); // 10 April 2027

      const result = parseRollNumberAndEligibility(roll, testDate);
      expect(result.isValid).toBe(true);
      expect(result.isEligible).toBe(false);
      expect(result.studentType).toBe('Regular');
      expect(result.admissionYear).toBe(2023);
      expect(result.expectedGraduationYear).toBe(2027);
      expect(result.message).toContain('graduation is not yet completed');
    });

    it('should mark Regular student as ineligible on 31 May of expected graduation year', () => {
      const roll = '23BQ1A5401';
      const testDate = new Date(2027, 4, 31, 12, 0, 0); // 31 May 2027

      const result = parseRollNumberAndEligibility(roll, testDate);
      expect(result.isValid).toBe(true);
      expect(result.isEligible).toBe(false);
    });

    it('should mark Regular student as eligible starting 1 June of expected graduation year', () => {
      const roll = '23BQ1A5401';
      const testDate = new Date(2027, 5, 1); // 1 June 2027

      const result = parseRollNumberAndEligibility(roll, testDate);
      expect(result.isValid).toBe(true);
      expect(result.isEligible).toBe(true);
      expect(result.studentType).toBe('Regular');
    });
  });

  describe('Lateral Entry Student (5A)', () => {
    it('should mark Lateral student as ineligible before 31 May of expected graduation year', () => {
      const roll = '24BQ5A5403'; // 2024 + 3 = 2027 graduation
      const testDate = new Date(2027, 3, 20); // 20 April 2027

      const result = parseRollNumberAndEligibility(roll, testDate);
      expect(result.isValid).toBe(true);
      expect(result.isEligible).toBe(false);
      expect(result.studentType).toBe('Lateral Entry');
      expect(result.admissionYear).toBe(2024);
      expect(result.expectedGraduationYear).toBe(2027);
    });

    it('should mark Lateral student as ineligible on 31 May of expected graduation year', () => {
      const roll = '24BQ5A5403';
      const testDate = new Date(2027, 4, 31, 12, 0, 0); // 31 May 2027

      const result = parseRollNumberAndEligibility(roll, testDate);
      expect(result.isValid).toBe(true);
      expect(result.isEligible).toBe(false);
    });

    it('should mark Lateral student as eligible starting 1 June of expected graduation year', () => {
      const roll = '24BQ5A5403';
      const testDate = new Date(2027, 5, 1); // 1 June 2027

      const result = parseRollNumberAndEligibility(roll, testDate);
      expect(result.isValid).toBe(true);
      expect(result.isEligible).toBe(true);
      expect(result.studentType).toBe('Lateral Entry');
    });
  });

  describe('Invalid Roll Numbers', () => {
    it('should reject roll number without 1A or 5A', () => {
      const result = parseRollNumberAndEligibility('23BQ2A5401');
      expect(result.isValid).toBe(false);
      expect(result.isEligible).toBe(false);
    });

    it('should reject non-numeric prefix roll number', () => {
      const result = parseRollNumberAndEligibility('XXBQ1A5401');
      expect(result.isValid).toBe(false);
      expect(result.isEligible).toBe(false);
    });
  });
});
