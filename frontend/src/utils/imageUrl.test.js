import { describe, it, expect } from 'vitest';
import { resolveProfileImage, isBase64Image, isHttpUrl } from './imageUrl';

describe('imageUrl — resolveProfileImage & Base64 protection', () => {
  it('Case 4: invalid URL -> null', () => {
    expect(resolveProfileImage('invalid-url-string')).toBeNull();
    expect(resolveProfileImage('http://')).toBeNull();
    expect(resolveProfileImage('https://')).toBeNull();
  });

  it('Case 6: valid HTTP image -> untouched URL', () => {
    const url = 'http://example.com/photo.jpg';
    expect(resolveProfileImage(url)).toBe(url);
  });

  it('Case 7: valid Base64 data URL -> returned untouched (NEVER prefixed with backend URL)', () => {
    const base64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP...';
    expect(resolveProfileImage(base64)).toBe(base64);
    expect(isBase64Image(base64)).toBe(true);
  });

  it('Case 8: malformed Base64 -> null (falls back to initials)', () => {
    expect(resolveProfileImage('data:')).toBeNull();
    expect(resolveProfileImage('data:image')).toBeNull();
    expect(resolveProfileImage('data:image/jpeg;base64,')).toBeNull();
    expect(resolveProfileImage('data:text/plain;base64,123')).toBeNull();
  });

  it('Rejects null, undefined, "null", "undefined", "[object Object]"', () => {
    expect(resolveProfileImage(null)).toBeNull();
    expect(resolveProfileImage(undefined)).toBeNull();
    expect(resolveProfileImage('')).toBeNull();
    expect(resolveProfileImage('null')).toBeNull();
    expect(resolveProfileImage('undefined')).toBeNull();
    expect(resolveProfileImage('false')).toBeNull();
    expect(resolveProfileImage('[object Object]')).toBeNull();
  });

  it('Resolves relative upload paths against backend origin', () => {
    expect(resolveProfileImage('/uploads/profiles/pic.jpg')).toBe('http://localhost:8082/uploads/profiles/pic.jpg');
  });
});
