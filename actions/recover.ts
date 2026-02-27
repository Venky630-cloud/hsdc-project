'use server'

import { createClient } from '@/lib/supabase/server'
import { decrypt, computeHash } from '@/lib/crypto'
import { extract } from '@/lib/stego'
import { getBlockchainService } from '@/lib/blockchain'
import { recoveryLimiter, checkRateLimit } from '@/lib/rate-limit'
import { logRecovery } from '@/lib/audit'
import sharp from 'sharp'

// VAPT: Import Enterprise AWS SDK
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'

// Initialize the strict IAM Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

interface RecoveryResult {
  success: boolean
  error?: string
  originalFilename?: string
  mimeType?: string
  fileBase64?: string
  integrityVerified?: boolean
  blockchainVerified?: boolean
}

export async function recoverFile(formData: FormData): Promise<RecoveryResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Authentication required' }
    }

    try {
      await checkRateLimit(user.id, recoveryLimiter)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Rate limit exceeded',
      }
    }

    const stegoFile = formData.get('stegoImage') as File | null
    const metadataId = formData.get('metadataId') as string | null

    if (!metadataId) {
      return { success: false, error: 'Metadata ID is required to recover the file' }
    }

    const { data: meta, error: dbError } = await supabase
      .from('metadata')
      .select('*')
      .eq('id', metadataId)
      .eq('user_id', user.id)
      .single()

    if (dbError || !meta) {
      return { success: false, error: 'File metadata not found or access denied' }
    }

    if (meta.status === 'REVOKED' || meta.status === 'EXPIRED') {
      return { success: false, error: 'This file has been revoked or shredded and cannot be recovered' }
    }

    let stegoBuffer: Buffer | null = null

    // VAPT: Enterprise S3 Retrieval Pipeline
    if (meta.stego_filename) {
      try {
        const command = new GetObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET_NAME!,
          Key: meta.stego_filename, // This is now the exact S3 Key (e.g. user-id/stego_xxx.png)
        })
        
        const s3Response = await s3Client.send(command)
        
        if (s3Response.Body) {
          // Safely transform the AWS streaming body into a Node.js Buffer
          const byteArray = await s3Response.Body.transformToByteArray()
          stegoBuffer = Buffer.from(byteArray)
        }
      } catch (err) {
        console.warn('Failed to download stego from AWS S3, falling back to manual upload:', err)
      }
    }

    // Fallback if S3 fails or if it's an offline recovery
    if (!stegoBuffer) {
      if (!stegoFile) {
        return { success: false, error: 'Stego image not provided and AWS vault copy unavailable' }
      }
      stegoBuffer = Buffer.from(await stegoFile.arrayBuffer())
    }

    const image = sharp(stegoBuffer)
    const imageMetadata = await image.metadata()
    const { width, height } = imageMetadata

    if (!width || !height) {
      return { success: false, error: 'Cannot read stego image dimensions' }
    }

    const rawPixels = await image.raw().ensureAlpha().toBuffer()

    const { data: uploadLog } = await supabase
      .from('activity_logs')
      .select('details')
      .eq('resource_id', metadataId)
      .eq('action', 'UPLOAD')
      .single()

    if (!uploadLog?.details || !(uploadLog.details as Record<string, unknown>).stego_seed) {
      return { success: false, error: 'Cannot find steganography seed for this file' }
    }

    const stegoSeed = (uploadLog.details as Record<string, string>).stego_seed

    let extractResult
    try {
      // Mathematically aligned with the PRNG engine
      extractResult = extract(rawPixels, width, height, 4, stegoSeed)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Steganographic extraction failed',
      }
    }

    if (!extractResult.integrityValid) {
      return { success: false, error: 'CRC integrity check failed - data may be corrupted' }
    }

    const extractedHash = computeHash(extractResult.extractedData)
    let blockchainVerified = false

    if (meta.blockchain_hash) {
      const blockchain = getBlockchainService()
      const blockchainRecord = await blockchain.verifyHash(meta.blockchain_hash)
      blockchainVerified = blockchainRecord !== null && blockchainRecord.hash === extractedHash
    }

    const integrityVerified = extractedHash === meta.integrity_hash

    if (!integrityVerified) {
      return {
        success: false,
        error: 'Integrity hash mismatch - encrypted data does not match stored hash',
      }
    }

    let decryptedData
    try {
      decryptedData = decrypt({
        encryptedData: extractResult.extractedData,
        iv: meta.iv,
        authTag: meta.auth_tag,
        encryptedKey: meta.encrypted_key,
      })
    } catch {
      return { success: false, error: 'Decryption failed - key or data mismatch' }
    }

    await logRecovery(user.id, metadataId, true, {
      original_filename: meta.original_filename,
      integrity_verified: integrityVerified,
      blockchain_verified: blockchainVerified,
      data_length: decryptedData.length,
    })

    return {
      success: true,
      originalFilename: meta.original_filename,
      mimeType: meta.mime_type,
      fileBase64: decryptedData.toString('base64'),
      integrityVerified,
      blockchainVerified,
    }
  } catch (error) {
    console.error('Recovery pipeline error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

export async function verifyBlockchainHash(hash: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { verified: false, error: 'Not authenticated' }

  const blockchain = getBlockchainService()
  const record = await blockchain.verifyHash(hash)

  if (record) {
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      action: 'HASH_VERIFY',
      details: { hash, verified: true, txId: record.txId },
    })
  }

  return {
    verified: !!record,
    record,
  }
}
