import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export async function validateApiKey(request: Request) {
  const apiKey = request.headers.get('x-api-key')
  if (!apiKey) return null

  // 1. Compute the SHA-256 hash of the incoming key
  const incomingHash = crypto.createHash('sha256').update(apiKey).digest('hex')

  const supabase = await createClient()
  
  // 2. Lookup the hash in the database
  const { data, error } = await supabase
    .from('api_keys')
    .select('user_id')
    .eq('key_hash', incomingHash)
    .eq('is_active', true)
    .single()

  if (error || !data) return null

  // 3. Update 'last_used_at' for audit trail
  await supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('key_hash', incomingHash)

  return data.user_id // Return the owner's ID
}
