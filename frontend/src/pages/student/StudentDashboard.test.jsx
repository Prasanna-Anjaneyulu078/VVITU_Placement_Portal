import { describe, it, expect } from 'vitest';
import { getCompanyInitials } from './StudentDashboard';

describe('StudentDashboard - getCompanyInitials', () => {
  it('generates initials for single-word companies', () => {
    expect(getCompanyInitials('Microsoft')).toBe('MI');
    expect(getCompanyInitials('Google')).toBe('GO');
    expect(getCompanyInitials('Amazon')).toBe('AM');
    expect(getCompanyInitials('Wipro')).toBe('WI');
    expect(getCompanyInitials('Infosys')).toBe('IN');
  });

  it('generates initials for multi-word companies', () => {
    expect(getCompanyInitials('Tata Consultancy Services')).toBe('TC');
    expect(getCompanyInitials('Reliance Industries')).toBe('RI');
    expect(getCompanyInitials('Tech Mahindra')).toBe('TM');
  });

  it('handles empty or missing company names cleanly', () => {
    expect(getCompanyInitials(null)).toBe('CO');
    expect(getCompanyInitials(undefined)).toBe('CO');
    expect(getCompanyInitials('')).toBe('CO');
    expect(getCompanyInitials('   ')).toBe('CO');
  });
});
