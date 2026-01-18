import bcrypt from 'bcrypt'

const SALT_ROUNDS = 10

/**
 * Hash a password using bcrypt
 * @param password - Plain text password to hash
 * @returns Hashed password string
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS)
}

/**
 * Compare a plain text password with a hashed password
 * @param password - Plain text password to verify
 * @param hash - Hashed password from database
 * @returns True if password matches hash
 */
export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash)
  } catch (error) {
    // If comparison fails (e.g., invalid hash format), return false
    return false
  }
}

/**
 * Check if a password string is already hashed
 * Bcrypt hashes start with $2a$, $2b$, or $2y$
 * @param password - Password string to check
 * @returns True if password is a bcrypt hash
 */
export function isHashedPassword(password: string): boolean {
  return /^\$2[aby]\$/.test(password)
}
