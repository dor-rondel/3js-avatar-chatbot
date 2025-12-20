import { Buffer } from 'node:buffer';
import { describe, expect, it } from 'vitest';
import { decodeBase64Audio } from './decodeBase64Audio';

function toBase64(bytes: number[]): string {
  const binary = String.fromCharCode(...bytes);
  return typeof btoa === 'function'
    ? btoa(binary)
    : Buffer.from(binary, 'binary').toString('base64');
}

describe('decodeBase64Audio', () => {
  it('decodes base64 strings into an ArrayBuffer', () => {
    const bytes = [0, 10, 255, 128, 64];
    const base64 = toBase64(bytes);

    const result = decodeBase64Audio(base64);
    expect(new Uint8Array(result)).toEqual(new Uint8Array(bytes));
  });

  it('ignores whitespace in the payload', () => {
    const bytes = [1, 2, 3, 4];
    const base64 = toBase64(bytes).replace(/.{2}/g, (chunk) => `${chunk} \n`);

    const result = decodeBase64Audio(base64);
    expect(new Uint8Array(result)).toEqual(new Uint8Array(bytes));
  });
});
