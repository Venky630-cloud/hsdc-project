'use server'

import { createClient } from '@/lib/supabase/server'
import { encrypt, computeHash, generateSecureId } from '@/lib/crypto'
import { embed, calculateCapacity } from '@/lib/stego'
import { getBlockchainService } from '@/lib/blockchain'
import { uploadLimiter, checkRateLimit } from '@/lib/rate-limit'
import { logUpload } from '@/lib/audit'
import sharp from 'sharp'

// VAPT: Import Enterprise AWS SDK
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

// Initialize the strict IAM Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const MAX_FILE_SIZE = 50 * 1024 * 1024 // VAPT: Upgraded to 50MB for enterprise capacity

// VAPT: Swapped base64 string for the secure S3 Key reference
interface UploadResult {
  success: boolean
  error?: string
  metadataId?: string
  blockchainTxId?: string
  integrityHash?: string
  s3Key?: string 
}

export async function uploadAndProcess(formData: FormData): Promise<UploadResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Authentication required' }

    await checkRateLimit(user.id, uploadLimiter)

    const secretFile = formData.get('secretFile') as File
    const carrierImage = formData.get('carrierImage') as File

    if (!secretFile || !carrierImage) return { success: false, error: 'Files missing' }
    if (secretFile.size > MAX_FILE_SIZE) return { success: false, error: 'File too large' }

    const secretBuffer = Buffer.from(await secretFile.arrayBuffer())
    const carrierBuffer = Buffer.from(await carrierImage.arrayBuffer())

    // 1. Encrypt Payload
    const encryptionResult = encrypt(secretBuffer)

    // 2. Image Processing: Decode to RAW RGBA PIXELS
    const image = sharp(carrierBuffer)
    const metadata = await image.metadata()

    if (!metadata.width || !metadata.height)
      return { success: false, error: 'Invalid carrier image' }

    // Extract raw pixels - THIS IS CRITICAL FOR THE PRNG ENGINE
    const rawPixels = await image.raw().ensureAlpha().toBuffer()

    // 3. Validate Capacity
    const capacity = calculateCapacity(metadata.width, metadata.height, 4)
    if (encryptionResult.encryptedData.length > capacity)
      return { success: false, error: 'Carrier image too small' }

    // 4. Steganography Embedding
    const stegoSeed = `hsdc:${user.id}:${generateSecureId(8)}`

    const {
      stegoImageBuffer, 
      capacityUsed,
      capacityTotal,
      pixelsModified,
    } = await embed(
      rawPixels,                      // Arg 1: imageData
      metadata.width,                 // Arg 2: width
      metadata.height,                // Arg 3: height
      4,                              // Arg 4: channels (RGBA = 4)
      encryptionResult.encryptedData, // Arg 5: payload
      stegoSeed                       // Arg 6: seed
    )

    if (!stegoImageBuffer) return { success: false, error: 'Steganography failed' }

    // 5. Rebuild Lossless PNG
    const finalStegoImage = await sharp(stegoImageBuffer, {
      raw: { width: metadata.width, height: metadata.height, channels: 4 },
    })
      .png({ compressionLevel: 0 })
      .toBuffer()

    // 6. Integrity & Blockchain
    const integrityHash = computeHash(encryptionResult.encryptedData)
    const blockchain = getBlockchainService()
    const blockchainRecord = await blockchain.storeHash(integrityHash, user.id)

    // VAPT: Tenant Isolation (WSTG-ATHZ-002) - Prepend user ID to S3 Key
    const s3Key = `${user.id}/stego_${generateSecureId(8)}.png`

    // 7. Store securely in AWS S3 Enterprise Vault (Replaces Supabase Storage)
    try {
      const command = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME!,
        Key: s3Key,
        Body: finalStegoImage,
        ContentType: 'image/png',
      })
      await s3Client.send(command)
    } catch (s3Error) {
      console.error('AWS S3 Upload Error:', s3Error)
      return { success: false, error: 'Failed to stream payload to secure vault' }
    }

    // 8. Database Record
    const { data: metadataRow, error: dbError } = await supabase
      .from('metadata')
      .insert({
        user_id: user.id,
        original_filename: secretFile.name,
        stego_filename: s3Key, // Store the exact S3 Key locator
        file_size: secretFile.size,
        mime_type: secretFile.type || 'application/octet-stream',
        encryption_algo: encryptionResult.algorithm,
        iv: encryptionResult.iv,
        auth_tag: encryptionResult.authTag,
        encrypted_key: encryptionResult.encryptedKey,
        blockchain_hash: integrityHash,
        blockchain_tx_id: blockchainRecord.txId,
        integrity_hash: integrityHash,
        status: 'ACTIVE',
      })
      .select('id')
      .single()

    if (dbError) return { success: false, error: dbError.message }

    // 9. Audit Logging (Saving Seed for Recovery)
    await logUpload(user.id, metadataRow.id, secretFile.name, secretFile.size, {
      capacity_used: capacityUsed,
      capacity_total: capacityTotal,
      pixels_modified: pixelsModified,
      stego_seed: stegoSeed 
    })

    // 10. Return strictly the S3 Key, never the massive binary
    return {
      success: true,
      metadataId: metadataRow.id,
      blockchainTxId: blockchainRecord.txId,
      integrityHash,
      s3Key,
    }

  } catch (err) {
    console.error('Upload error:', err)
    return { success: false, error: 'Upload failed' }
  }
}

export async function getUserFiles() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated' }
    const { data, error } = await supabase
      .from('metadata')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (error) throw error
    return { success: true, files: data }
  } catch (err) {
    console.error('Fetch error:', err)
    return { success: false, error: 'Failed to fetch files' }
  }
}
