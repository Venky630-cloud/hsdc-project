'use server'

import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

// ==========================================
// GENERATE A NEW CRYPTOGRAPHIC API KEY
// ==========================================
export async function generateApiKey(name: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // 1. Generate 32 bytes of secure entropy
    const entropy = crypto.randomBytes(32).toString('hex')
    
    // 2. Construct the Plaintext Key (The user sees this ONCE)
    const plaintextKey = `hsdc_live_${entropy}`
    
    // 3. Construct the UI Prefix (e.g., "hsdc_live_a1b2...")
    const keyPrefix = `hsdc_live_${entropy.substring(0, 4)}...`
    
    // 4. Compute the mathematical one-way hash for storage
    const keyHash = crypto.createHash('sha256').update(plaintextKey).digest('hex')

    // 5. Store the Hash, discard the Plaintext
    const { error: dbError } = await supabase
      .from('api_keys')
      .insert({
        user_id: user.id,
        name: name,
        key_prefix: keyPrefix,
        key_hash: keyHash,
        is_active: true
      })

    if (dbError) throw new Error(dbError.message)

    // 6. Audit Logging (WSTG-LOGG-001)
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      action: 'API_KEY_GENERATED',
      details: { name, prefix: keyPrefix }
    })

    // 7. Return the plaintext key strictly to the requesting browser memory
    return { success: true, plaintextKey }

  } catch (error) {
    console.error('API Key Generation Error:', error)
    return { success: false, error: 'Failed to generate cryptographic key' }
  }
}

// ==========================================
// LIST ACTIVE API KEYS (FOR THE DASHBOARD UI)
// ==========================================
export async function listApiKeys() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data, error } = await supabase
      .from('api_keys')
      .select('id, name, key_prefix, created_at, last_used_at')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return { success: true, keys: data }
  } catch (error) {
    return { success: false, error: 'Failed to fetch API keys' }
  }
}

// ==========================================
// REVOKE AN API KEY (KILL SWITCH)
// ==========================================
export async function revokeApiKey(keyId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Hard delete to ensure the hash is physically removed from the database
    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', keyId)
      .eq('user_id', user.id)

    if (error) throw new Error(error.message)

    await supabase.from('activity_logs').insert({
      user_id: user.id,
      action: 'API_KEY_REVOKED',
      details: { keyId }
    })

    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to revoke API key' }
  }
}
