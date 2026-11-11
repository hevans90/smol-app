import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

// AES-256-GCM for the PoE tokens kept in atlas_connection. The key
// (ATLAS_TOKEN_KEY, 32 random bytes, base64) exists only in the Netlify
// environment: the database alone never holds anything usable.
//
// Each value is bound to the row it belongs to (`context`, the user id), so
// ciphertext copied onto another member's row fails to decrypt.

const key = () => {
  const decoded = Buffer.from(process.env.ATLAS_TOKEN_KEY ?? '', 'base64');
  if (decoded.length !== 32) {
    throw new Error('ATLAS_TOKEN_KEY must be 32 bytes, base64-encoded');
  }
  return decoded;
};

export const encryptToken = (plaintext: string, context: string): string => {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(), iv);
  cipher.setAAD(Buffer.from(context));
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return ['v1', iv, cipher.getAuthTag(), ciphertext]
    .map((part) => (typeof part === 'string' ? part : part.toString('base64url')))
    .join('.');
};

/** Throws if the value was tampered with, moved between rows, or the key changed. */
export const decryptToken = (stored: string, context: string): string => {
  const [version, iv, tag, ciphertext] = stored.split('.');
  if (version !== 'v1' || !iv || !tag || !ciphertext) {
    throw new Error('unrecognised token format');
  }
  const decipher = createDecipheriv('aes-256-gcm', key(), Buffer.from(iv, 'base64url'));
  decipher.setAAD(Buffer.from(context));
  decipher.setAuthTag(Buffer.from(tag, 'base64url'));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertext, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
};
