const PIN_ITERATIONS = 310000;

function encode(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

function decode(value: string): Uint8Array {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function derivePinHash(pin: string, salt: Uint8Array): Promise<string> {
  if (!globalThis.crypto?.subtle) throw new Error('Web Crypto غير متاح؛ يلزم HTTPS');
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: PIN_ITERATIONS, hash: 'SHA-256' },
    material,
    256
  );
  return encode(new Uint8Array(bits));
}

export async function createPinCredential(pin: string): Promise<{ pin: string; pinSalt: string; pinHash: string; pinLength: number }> {
  if (!/^\d{4,6}$/.test(pin)) throw new Error('يجب أن يتكون PIN من 4 إلى 6 أرقام');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return { pin: '', pinSalt: encode(salt), pinHash: await derivePinHash(pin, salt), pinLength: pin.length };
}

export async function verifyPinCredential(pin: string, security: { pin?: string; pinSalt?: string; pinHash?: string }): Promise<boolean> {
  if (security.pinHash && security.pinSalt) {
    try {
      const actual = decode(await derivePinHash(pin, decode(security.pinSalt)));
      const expected = decode(security.pinHash);
      if (actual.length !== expected.length) return false;
      let difference = 0;
      for (let i = 0; i < actual.length; i++) difference |= actual[i] ^ expected[i];
      return difference === 0;
    } catch {
      return false;
    }
  }
  // Compatibility with existing installations; App migrates this value on startup.
  return Boolean(security.pin) && pin === security.pin;
}
