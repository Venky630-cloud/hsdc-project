import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardContent } from './dashboard-content'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: files } = await supabase
    .from('metadata')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: logs } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  const { count: totalFiles } = await supabase
    .from('metadata')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const { count: activeFiles } = await supabase
    .from('metadata')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'ACTIVE')

  return (
    <DashboardContent
      profile={profile}
      recentFiles={files || []}
      recentLogs={logs || []}
      totalFiles={totalFiles || 0}
      activeFiles={activeFiles || 0}
    />
  )
}
