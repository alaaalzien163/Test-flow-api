import * as argon2 from 'argon2';

/**
 * Centralized password hashing helpers so the Argon2 configuration lives in
 * one place and is reused by every module.
 */
export function hashPassword(plainPassword: string): Promise<string> {
  return argon2.hash(plainPassword, { type: argon2.argon2id });
}

export function verifyPassword(
  passwordHash: string,
  plainPassword: string,
): Promise<boolean> {
  return argon2.verify(passwordHash, plainPassword);
}
