import { describe, it, expect } from 'vitest';
import {
  isBase64Image,
  isHttpUrl,
  isRelativeImageUrl,
  withCacheBust,
  resolveImageUrl,
  getImageUrl
} from './imageUrl';

describe('Centralized Image URL Resolver (Step 20 Test Cases)', () => {
  // Test 1: Base64 data URL input
  it('Test 1: Base64 data URL input -> returned exact without query string', () => {
    const input = 'data:image/jpeg;base64,ABC123';
    const result = resolveImageUrl(input);
    expect(result).toBe('data:image/jpeg;base64,ABC123');
    expect(result).not.toContain('?v=');
  });

  // Test 2: Relative upload path
  it('Test 2: Relative upload path -> returned full backend origin URL', () => {
    const input = '/uploads/profile/user.jpg';
    const result = resolveImageUrl(input);
    expect(result).toBe('http://localhost:8082/uploads/profile/user.jpg');
  });

  // Test 3: Absolute HTTP URL
  it('Test 3: Absolute HTTP URL -> returned valid HTTP URL', () => {
    const input = 'http://localhost:8082/uploads/profile/user.jpg';
    const result = resolveImageUrl(input);
    expect(result).toBe('http://localhost:8082/uploads/profile/user.jpg');
  });

  // Test 4: Absolute HTTPS URL
  it('Test 4: Absolute HTTPS URL -> returned valid HTTPS URL', () => {
    const input = 'https://example.com/user.jpg';
    const result = resolveImageUrl(input);
    expect(result).toBe('https://example.com/user.jpg');
  });

  // Test 5: null input
  it('Test 5: null input -> returns null', () => {
    expect(resolveImageUrl(null)).toBeNull();
  });

  // Test 6: Empty string input
  it('Test 6: empty string -> returns null', () => {
    expect(resolveImageUrl('')).toBeNull();
    expect(resolveImageUrl('   ')).toBeNull();
  });

  // Test 7: Invalid string input ("undefined", "null", "[object Object]")
  it('Test 7: "undefined" / "null" / "[object Object]" -> returns null', () => {
    expect(resolveImageUrl('undefined')).toBeNull();
    expect(resolveImageUrl('null')).toBeNull();
    expect(resolveImageUrl('[object Object]')).toBeNull();
    expect(resolveImageUrl('data:')).toBeNull();
  });

  // Test 8: Base64 + cache bust request
  it('Test 8: Base64 + cache bust request -> returned EXACT Base64 (NO ?v= appended)', () => {
    const input = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const result = resolveImageUrl(input, { cacheBust: true, version: 12345 });
    expect(result).toBe(input);
    expect(result).not.toContain('?v=');
    expect(result).not.toContain('&v=');

    const cacheBustedDirect = withCacheBust(input, 12345);
    expect(cacheBustedDirect).toBe(input);
  });

  // Test 9: HTTP URL + cache bust
  it('Test 9: HTTP URL + cache bust -> appends ?v=123', () => {
    const input = 'http://localhost:8082/uploads/profile/user.jpg';
    const result = resolveImageUrl(input, { cacheBust: true, version: 123 });
    expect(result).toBe('http://localhost:8082/uploads/profile/user.jpg?v=123');
  });

  // Test 10: URL with existing query param
  it('Test 10: URL with existing query param -> appends &v=123', () => {
    const input = 'http://localhost:8082/uploads/profile/user.jpg?token=abc';
    const result = resolveImageUrl(input, { cacheBust: true, version: 123 });
    expect(result).toBe('http://localhost:8082/uploads/profile/user.jpg?token=abc&v=123');
  });

  // Helper classification tests
  it('Classification helpers work correctly', () => {
    expect(isBase64Image('data:image/png;base64,123')).toBe(true);
    expect(isBase64Image('http://localhost:8082/img.png')).toBe(false);
    expect(isHttpUrl('https://example.com')).toBe(true);
    expect(isHttpUrl('/uploads/img.png')).toBe(false);
    expect(isRelativeImageUrl('/uploads/img.png')).toBe(true);
    expect(isRelativeImageUrl('https://example.com')).toBe(false);
  });

  it('getImageUrl backward compatibility wrapper delegates to resolveImageUrl', () => {
    expect(getImageUrl('/uploads/test.png')).toBe('http://localhost:8082/uploads/test.png');
    expect(getImageUrl('data:image/jpeg;base64,123')).toBe('data:image/jpeg;base64,123');
  });
});
