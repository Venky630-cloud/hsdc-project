'use server'

import { createClient } from '@/lib/supabase/server'

export async function exportAuditLogs() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // SOC 2 requires specific forensic headers: Timestamp, Action, Resource, IP
  const { data, error } = await supabase
    .from('activity_logs')
    .select('created_at, action, resource_id, ip_address, details')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw new Error('Failed to fetch audit logs')
  return data
}
