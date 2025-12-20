/**
 * Decodes a base64-encoded audio string into an ArrayBuffer so it can be
 * consumed by the Web Audio API.
 */
export function decodeBase64Audio(base64: string): ArrayBuffer {
  const sanitized = base64.replace(/\s+/g, '');

  if (typeof atob === 'function') {
    const binaryString = atob(sanitized);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);

    for (let byteIndex = 0; byteIndex < len; byteIndex += 1) {
      bytes[byteIndex] = binaryString.charCodeAt(byteIndex);
    }

    return bytes.buffer;
  }

  type BufferFactory = Pick<typeof Buffer, 'from'>;

  const bufferFactory = (globalThis as { Buffer?: BufferFactory }).Buffer;

  if (bufferFactory?.from) {
    const nodeBuffer = bufferFactory.from(sanitized, 'base64');
    return nodeBuffer.buffer.slice(
      nodeBuffer.byteOffset,
      nodeBuffer.byteOffset + nodeBuffer.byteLength
    );
  }

  throw new Error('Base64 decoding is not supported in this environment.');
}
