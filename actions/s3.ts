'use server'

import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

// 1. Initialize the strict IAM Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

// ==========================================
// PRE-SIGNED UPLOAD TICKET (EXPIRES 60s)
// ==========================================
export async function getPresignedUploadUrl(contentType: string = 'application/octet-stream') {
  try {
    // 1. Authenticate the request (WSTG-ATHN)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // 2. Generate a cryptographically random filename
    // We prepend the user.id to enforce strict tenant isolation in the S3 bucket
    const uniqueFilename = `${user.id}/${crypto.randomUUID()}`

    // 3. Define the strict AWS action boundaries
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
      Key: uniqueFilename,
      ContentType: contentType, // Crucial for protecting binary integrity
    })

    // 4. Mathematically sign the URL
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 })

    return { success: true, signedUrl, key: uniqueFilename }
  } catch (error) {
    console.error('S3 Presign Error:', error)
    return { success: false, error: 'Failed to generate secure upload ticket' }
  }
}

// ==========================================
// PRE-SIGNED DOWNLOAD TICKET (EXPIRES 60s)
// ==========================================
export async function getPresignedDownloadUrl(fileKey: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // WSTG-ATHZ-002: Path Traversal Protection
    // Physically prevent User A from requesting User B's files by checking the prefix
    if (!fileKey.startsWith(`${user.id}/`)) {
      console.warn(`SECURITY ALERT: IDOR attempt by user ${user.id} on key ${fileKey}`)
      throw new Error('Forbidden: Access Denied')
    }

    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
      Key: fileKey,
      // VAPT FIX: Force the browser to download the file instead of rendering it
      ResponseContentDisposition: `attachment; filename="hsdc_stego_vault_image.png"`,
    })

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 })
    return { success: true, signedUrl }
  } catch (error) {
    console.error('S3 Download Error:', error)
    return { success: false, error: 'Failed to generate secure download ticket' }
  }
}
