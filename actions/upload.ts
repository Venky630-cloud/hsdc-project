'use server'

import { createClient } from '@/lib/supabase/server'
import { encrypt, computeHash, generateSecureId } from '@/lib/crypto'
import { embed, calculateCapacity } from '@/lib/stego'
import { getBlockchainService } from '@/lib/blockchain'
import { uploadLimiter, checkRateLimit } from '@/lib/rate-limit'
import { logUpload, logTamperDetected, logRevoke } from '@/lib/audit'
import sharp from 'sharp'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_IMAGE_TYPES = ['image/png', 'image/bmp', 'image/tiff']
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'text/plain',
  'application/json',
  'image/png',
  'image/jpeg',
  'application/zip',
  'application/octet-stream',
]

interface UploadResult {
  success: boolean
  error?: string
  metadataId?: string
  blockchainTxId?: string
  integrityHash?: string
  stegoImageBase64?: string
}

/**
 * Full HSDC Upload Pipeline:
 * 1. Validate inputs
 * 2. Encrypt file with AES-256-GCM (key wrapped with RSA-2048)
 * 3. Embed encrypted data into carrier image via LSB steganography
 * 4. Compute SHA-256 integrity hash
 * 5. Store hash on (mock) blockchain
 * 6. Save metadata to Supabase
 * 7. Return stego image for download
 */
export async function uploadAndProcess(formData: FormData): Promise<UploadResult> {
  try {
    // Auth check
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Authentication required' }
    }

    // Rate limit check
    try {
      await checkRateLimit(user.id, uploadLimiter)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Rate limit exceeded',
      }
    }

    // Extract files from FormData
    const secretFile = formData.get('secretFile') as File | null
    const carrierImage = formData.get('carrierImage') as File | null

    if (!secretFile || !carrierImage) {
      return { success: false, error: 'Both a secret file and carrier image are required' }
    }

    // Validate file sizes
    if (secretFile.size > MAX_FILE_SIZE) {
      return { success: false, error: `Secret file exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` }
    }
    if (carrierImage.size > MAX_FILE_SIZE) {
      return { success: false, error: `Carrier image exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` }
    }

    // Validate file types
    if (!ALLOWED_FILE_TYPES.includes(secretFile.type) && secretFile.type !== '') {
      return { success: false, error: `File type ${secretFile.type} is not allowed` }
    }
    if (!ALLOWED_IMAGE_TYPES.includes(carrierImage.type)) {
      return { success: false, error: 'Carrier must be a PNG, BMP, or TIFF image' }
    }

    // Read files into buffers
    const secretBuffer = Buffer.from(await secretFile.arrayBuffer())
    const carrierBuffer = Buffer.from(await carrierImage.arrayBuffer())

    // Step 1: Encrypt the secret file
    let encryptionResult
    try {
      encryptionResult = encrypt(secretBuffer)
    } catch {
      return { success: false, error: 'Encryption failed. Ensure RSA keys are configured.' }
    }

    // Step 2: Process carrier image with Sharp
    const image = sharp(carrierBuffer)
    const metadata = await image.metadata()
    const { width, height, channels } = metadata

    if (!width || !height) {
      return { success: false, error: 'Cannot read carrier image dimensions' }
    }

    // Check capacity
    const capacity = calculateCapacity(width, height, channels || 3)
    if (encryptionResult.encryptedData.length > capacity) {
      return {
        success: false,
        error: `Encrypted data (${encryptionResult.encryptedData.length} bytes) exceeds image capacity (${capacity} bytes). Use a larger carrier image.`,
      }
    }

    // Get raw pixel data (force RGBA for consistency)
    const rawPixels = await image.raw().ensureAlpha().toBuffer()

    // Step 3: Embed encrypted data using steganography
    const stegoSeed = `hsdc:${user.id}:${generateSecureId(8)}`
    const stegoResult = embed(
      rawPixels,
      width,
      height,
      4, // RGBA
      encryptionResult.encryptedData,
      stegoSeed,
    )

    // Step 4: Reconstruct stego image as PNG
    const stegoImage = await sharp(stegoResult.stegoImageBuffer, {
      raw: { width, height, channels: 4 },
    })
      .png({ compressionLevel: 0 }) // lossless to preserve LSB data
      .toBuffer()

    // Step 5: Compute integrity hash
    const integrityHash = computeHash(encryptionResult.encryptedData)

    // Step 6: Store on mock blockchain
    const blockchain = getBlockchainService()
    const blockchainRecord = await blockchain.storeHash(integrityHash, user.id)

    // Step 7: Save metadata to Supabase
    const encryptedFilename = `enc_${generateSecureId(8)}.bin`
    const stegoFilename = `stego_${generateSecureId(8)}.png`

    const { data: metadataRow, error: dbError } = await supabase
      .from('metadata')
      .insert({
        user_id: user.id,
        original_filename: secretFile.name,
        encrypted_filename: encryptedFilename,
        stego_filename: stegoFilename,
        file_size: secretFile.size,
        mime_type: secretFile.type || 'application/octet-stream',
        encryption_algo: encryptionResult.algorithm,
        iv: encryptionResult.iv,
        auth_tag: encryptionResult.authTag,
        encrypted_key: encryptionResult.encryptedKey,
        blockchain_hash: integrityHash,
        blockchain_tx_id: blockchainRecord.txId,
        blockchain_network: blockchainRecord.network,
        integrity_hash: integrityHash,
        status: 'ACTIVE',
      })
      .select('id')
      .single()

    if (dbError) {
      return { success: false, error: `Database error: ${dbError.message}` }
    }

    // Upload stego image to Supabase storage for later recovery (server-side retrieval)
    try {
      const { error: storageError } = await supabase.storage
        .from('stego')
        .upload(stegoFilename, stegoImage, { contentType: 'image/png', upsert: false })

      if (storageError) {
        console.warn('Supabase storage upload warning:', storageError.message)
        // Not a hard failure; client still receives base64 image, but recovery-from-server will be unavailable
      }
    } catch (err) {
      console.warn('Supabase storage upload failed:', err)
    }

    // Log the upload activity using centralized audit logger
    await logUpload(user.id, metadataRow.id, secretFile.name, secretFile.size, {
      encryption_algo: encryptionResult.algorithm,
      stego_seed: stegoSeed,
      capacity_used: stegoResult.capacityUsed,
      capacity_total: stegoResult.capacityTotal,
      pixels_modified: stegoResult.pixelsModified,
    })

    // Return the stego image as base64 for client download
    const stegoBase64 = stegoImage.toString('base64')

    return {
      success: true,
      metadataId: metadataRow.id,
      blockchainTxId: blockchainRecord.txId,
      integrityHash,
      stegoImageBase64: stegoBase64,
    }
  } catch (error) {
    console.error('Upload pipeline error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

/**
 * Get user's file metadata list
 */
export async function getUserFiles() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { files: [], error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('metadata')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return { files: [], error: error.message }
  return { files: data || [], error: null }
}

/**
 * Get user's activity logs
 */
export async function getUserActivityLogs(limit: number = 50) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { logs: [], error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return { logs: [], error: error.message }
  return { logs: data || [], error: null }
}

/**
 * Revoke a file (mark as REVOKED)
 */
export async function revokeFile(metadataId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase
    .from('metadata')
    .update({ status: 'REVOKED', updated_at: new Date().toISOString() })
    .eq('id', metadataId)
    .eq('user_id', user.id)

  if (error) return { success: false, error: error.message }

  // Log file revocation using audit logger
  await logRevoke(user.id, metadataId)

  return { success: true }
}
