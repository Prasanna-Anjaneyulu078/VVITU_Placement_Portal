import { describe, it, expect } from 'vitest';
import { getInitials, getDisplayName } from './avatarUtils';

describe('avatarUtils — getInitials & getDisplayName', () => {
  it('Case 1: Satish Kumar -> SK', () => {
    expect(getInitials('Satish Kumar')).toBe('SK');
  });

  it('Case 2: Venkata Prasanna Anjaneyulu Borigorla -> VB', () => {
    expect(getInitials('Venkata Prasanna Anjaneyulu Borigorla')).toBe('VB');
  });

  it('Case 3: Gangavarapu Satish Kumar -> GK', () => {
    expect(getInitials('Gangavarapu Satish Kumar')).toBe('GK');
  });

  it('Case 9: "   Satish   Kumar   " -> SK', () => {
    expect(getInitials('   Satish   Kumar   ')).toBe('SK');
  });

  it('Case 10: Satish -> S', () => {
    expect(getInitials('Satish')).toBe('S');
  });

  it('Case 11: null / undefined / empty -> ?', () => {
    expect(getInitials(null)).toBe('?');
    expect(getInitials(undefined)).toBe('?');
    expect(getInitials('')).toBe('?');
    expect(getInitials('   ')).toBe('?');
  });

  it('Resolves name from objects (student, alumni, user, profile)', () => {
    expect(getDisplayName({ name: 'John Doe' })).toBe('John Doe');
    expect(getDisplayName({ user: { name: 'Jane Smith' } })).toBe('Jane Smith');
    expect(getDisplayName({ firstName: 'Satish', lastName: 'Kumar' })).toBe('Satish Kumar');
    expect(getDisplayName({ student: { name: 'Venkata Borigorla' } })).toBe('Venkata Borigorla');
  });
});
