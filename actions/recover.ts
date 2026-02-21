'use server'

import { createClient } from '@/lib/supabase/server'
import { decrypt, computeHash } from '@/lib/crypto'
import { extract } from '@/lib/stego'
import { getBlockchainService } from '@/lib/blockchain'
import { recoveryLimiter, checkRateLimit } from '@/lib/rate-limit'
import { logRecovery, logTamperDetected } from '@/lib/audit'
import sharp from 'sharp'

interface RecoveryResult {
  success: boolean
  error?: string
  originalFilename?: string
  mimeType?: string
  fileBase64?: string
  integrityVerified?: boolean
  blockchainVerified?: boolean
}

/**
 * Full HSDC Recovery Pipeline:
 * 1. Authenticate user
 * 2. Extract encrypted data from stego image
 * 3. Look up metadata for decryption keys
 * 4. Verify blockchain integrity hash
 * 5. Decrypt with AES-256-GCM using RSA-unwrapped key
 * 6. Return original file
 */
export async function recoverFile(formData: FormData): Promise<RecoveryResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Authentication required' }
    }

    // Rate limit check
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

    // Look up metadata
    const { data: meta, error: dbError } = await supabase
      .from('metadata')
      .select('*')
      .eq('id', metadataId)
      .eq('user_id', user.id)
      .single()

    if (dbError || !meta) {
      return { success: false, error: 'File metadata not found or access denied' }
    }

    if (meta.status === 'REVOKED') {
      return { success: false, error: 'This file has been revoked and cannot be recovered' }
    }

    // Obtain stego image buffer: prefer server-side stored file, fallback to uploaded file
    let stegoBuffer: Buffer | null = null

    if (meta.stego_filename) {
      try {
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('stego')
          .download(meta.stego_filename)

        if (!downloadError && fileData) {
          // `fileData` is a Blob in modern runtimes; convert to Buffer
          // If running in Node, `fileData.arrayBuffer` should work via polyfill
          const ab = await (fileData as any).arrayBuffer()
          stegoBuffer = Buffer.from(ab)
        }
      } catch (err) {
        console.warn('Failed to download stego from storage, will fallback to uploaded file:', err)
      }
    }

    if (!stegoBuffer) {
      if (!stegoFile) {
        return { success: false, error: 'Stego image not provided and server copy unavailable' }
      }
      stegoBuffer = Buffer.from(await stegoFile.arrayBuffer())
    }

    // Process with Sharp to get raw pixels
    const image = sharp(stegoBuffer)
    const imageMetadata = await image.metadata()
    const { width, height } = imageMetadata

    if (!width || !height) {
      return { success: false, error: 'Cannot read stego image dimensions' }
    }

    // Get raw RGBA pixels
    const rawPixels = await image.raw().ensureAlpha().toBuffer()

    // Step 1: Extract stego seed from activity logs
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

    // Step 2: Extract encrypted data from stego image
    let extractResult
    try {
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

    // Step 3: Verify blockchain integrity hash
    const extractedHash = computeHash(extractResult.extractedData)
    let blockchainVerified = false

    if (meta.blockchain_hash) {
      const blockchain = getBlockchainService()
      const blockchainRecord = await blockchain.verifyHash(meta.blockchain_hash)
      blockchainVerified = blockchainRecord !== null && blockchainRecord.hash === extractedHash
    }

    // Also compare against stored integrity hash
    const integrityVerified = extractedHash === meta.integrity_hash

    if (!integrityVerified) {
      return {
        success: false,
        error: 'Integrity hash mismatch - encrypted data does not match stored hash',
      }
    }

    // Step 4: Decrypt with AES-256-GCM
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

    // Log recovery using audit logger
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

/**
 * Verify a blockchain hash without full recovery
 */
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
