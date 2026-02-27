'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { logRecovery } from '@/lib/audit' // You can create a logShredding function later

// ==========================================
// SOFT DELETE: HIDE FROM DASHBOARD
// ==========================================
export async function hideFile(metadataId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Using your existing 'REVOKED' status from your database schema
  const { error } = await supabase
    .from('metadata')
    .update({ status: 'REVOKED' })
    .eq('id', metadataId)
    .eq('user_id', user.id)

  if (error) throw new Error('Failed to hide file')
  revalidatePath('/dashboard')
}

// ==========================================
// HARD DELETE: CRYPTO-SHREDDING
// ==========================================
export async function cryptoShredFile(metadataId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // 1. Destroy the cryptographic keys mathematically
  const { error: dbError } = await supabase
    .from('metadata')
    .update({ 
      iv: 'SHREDDED', 
      auth_tag: 'SHREDDED', 
      encrypted_key: 'SHREDDED',
      status: 'EXPIRED' 
    })
    .eq('id', metadataId)
    .eq('user_id', user.id)

  if (dbError) throw new Error('Crypto-shredding failed')

  // 2. Audit the destruction
  await supabase.from('activity_logs').insert({
    user_id: user.id,
    action: 'ADMIN_ACTION',
    resource_id: metadataId,
    details: { event: 'CRYPTO_SHRED_EXECUTED', methodology: 'Key Overwrite' }
  })

  revalidatePath('/dashboard')
}
