// ============================================
// HSDC Cryptographic Engine
// AES-256-GCM Encryption + RSA-2048 Key Wrapping
// ============================================
// Lightweight runtime declarations to satisfy TypeScript in the editor
declare const process: { env: Record<string, string | undefined> }
declare function require(moduleName: string): any
declare const Buffer: any
declare type Buffer = any

// Use require for the Node.js crypto module to avoid missing type declaration
// errors in environments where `@types/node` isn't picked up by the editor.
const crypto = require('crypto') as any
import type { EncryptionResult, DecryptionInput } from './types'

const AES_ALGO = 'aes-256-gcm' as const
const AES_KEY_BYTES = 32
const IV_BYTES = 12 // GCM recommended IV size
const AUTH_TAG_LENGTH = 16

// RSA key pair for wrapping AES keys (stored in env vars or generated)
function getRSAPublicKey(): string {
  const key = process.env.HSDC_RSA_PUBLIC_KEY
  if (key) return key.replace(/\\n/g, '\n')
  throw new Error('HSDC_RSA_PUBLIC_KEY environment variable is not set')
}

function getRSAPrivateKey(): string {
  const key = process.env.HSDC_RSA_PRIVATE_KEY
  if (key) return key.replace(/\\n/g, '\n')
  throw new Error('HSDC_RSA_PRIVATE_KEY environment variable is not set')
}

/**
 * Generate a fresh RSA-2048 keypair (for initial setup only)
 */
export function generateRSAKeyPair(): { publicKey: string; privateKey: string } {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  })
  return { publicKey, privateKey }
}

/**
 * Encrypt data with AES-256-GCM and wrap the AES key with RSA-2048
 */
export function encrypt(plainData: Buffer): EncryptionResult {
  // Generate random AES-256 key
  const aesKey = crypto.randomBytes(AES_KEY_BYTES)

  // Generate random IV
  const iv = crypto.randomBytes(IV_BYTES)

  // Encrypt with AES-256-GCM
  const cipher = crypto.createCipheriv(AES_ALGO, aesKey, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  })
  const encrypted = Buffer.concat([cipher.update(plainData), cipher.final()])
  const authTag = cipher.getAuthTag()

  // Wrap AES key with RSA public key
  const rsaPublicKey = getRSAPublicKey()
  const wrappedKey = crypto.publicEncrypt(
    {
      key: rsaPublicKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    aesKey,
  )

  return {
    encryptedData: encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
    encryptedKey: wrappedKey.toString('base64'),
    algorithm: 'AES-256-GCM',
  }
}

/**
 * Decrypt AES-256-GCM data using RSA-unwrapped key
 */
export function decrypt(input: DecryptionInput): Buffer {
  // Unwrap AES key with RSA private key
  const rsaPrivateKey = getRSAPrivateKey()
  const aesKey = crypto.privateDecrypt(
    {
      key: rsaPrivateKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    Buffer.from(input.encryptedKey, 'base64'),
  )

  const iv = Buffer.from(input.iv, 'hex')
  const authTag = Buffer.from(input.authTag, 'hex')

  // Decrypt with AES-256-GCM
  const decipher = crypto.createDecipheriv(AES_ALGO, aesKey, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  })
  decipher.setAuthTag(authTag)

  const decrypted = Buffer.concat([
    decipher.update(input.encryptedData),
    decipher.final(),
  ])

  return decrypted
}

/**
 * Compute SHA-256 hash of data for integrity verification
 */
export function computeHash(data: Buffer): string {
  return crypto.createHash('sha256').update(data).digest('hex')
}

/**
 * Compute HMAC-SHA256 for data integrity with a key
 */
export function computeHMAC(data: Buffer, key: string): string {
  return crypto.createHmac('sha256', key).update(data).digest('hex')
}

/**
 * Generate cryptographically secure random bytes as hex
 */
export function generateSecureId(bytes: number = 16): string {
  return crypto.randomBytes(bytes).toString('hex')
}
