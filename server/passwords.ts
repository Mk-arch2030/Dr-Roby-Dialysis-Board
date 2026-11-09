import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const KEY_LENGTH = 64;

export function hashPassword(password: string, salt = randomBytes(16).toString('hex')) {
  return { hash: scryptSync(password, salt, KEY_LENGTH).toString('hex'), salt };
}

export function verifyPassword(password: string, salt: string, expectedHash: string): boolean {
  const actual = scryptSync(password, salt, KEY_LENGTH);
  const expected = Buffer.from(expectedHash, 'hex');
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(actual, expected);
}
