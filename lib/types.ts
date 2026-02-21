// ============================================
// HSDC Type Definitions
// ============================================

export interface EncryptionResult {
  encryptedData: Buffer
  iv: string           // hex-encoded IV
  authTag: string      // hex-encoded GCM auth tag
  encryptedKey: string // base64-encoded RSA-wrapped AES key
  algorithm: 'AES-256-GCM'
}

export interface DecryptionInput {
  encryptedData: Buffer
  iv: string
  authTag: string
  encryptedKey: string
}

export interface StegoEmbedResult {
  stegoImageBuffer: Buffer
  capacityUsed: number  // bytes embedded
  capacityTotal: number // max bytes available
  pixelsModified: number
}

export interface StegoExtractResult {
  extractedData: Buffer
  dataLength: number
  integrityValid: boolean
}

export interface BlockchainHashRecord {
  id: string
  hash: string
  txId: string
  network: string
  timestamp: string
  blockNumber?: number
  verified: boolean
}

export interface FileMetadata {
  id: string
  userId: string
  originalFilename: string
  encryptedFilename: string
  stegoFilename?: string
  fileSize: number
  mimeType: string
  encryptionAlgo: string
  iv: string
  authTag: string
  encryptedKey: string
  blockchainHash?: string
  blockchainTxId?: string
  blockchainNetwork?: string
  integrityHash: string
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED'
  createdAt: string
  updatedAt: string
}

export interface UploadProgress {
  stage: 'validating' | 'encrypting' | 'embedding' | 'hashing' | 'storing' | 'complete' | 'error'
  progress: number // 0-100
  message: string
}

export interface RecoveryProgress {
  stage: 'extracting' | 'verifying' | 'decrypting' | 'complete' | 'error'
  progress: number
  message: string
}

export interface ActivityLog {
  id: string
  userId: string
  action: string
  resourceId?: string
  details: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
  createdAt: string
}

export interface UserProfile {
  id: string
  role: 'USER' | 'ADMIN'
  displayName: string
  hashedPin?: string
  createdAt: string
  updatedAt: string
}

export type UploadStage = UploadProgress['stage']
export type RecoveryStage = RecoveryProgress['stage']
