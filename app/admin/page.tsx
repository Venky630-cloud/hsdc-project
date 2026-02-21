import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminContent } from './admin-content'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Check admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'ADMIN'

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <p className="text-lg font-semibold text-foreground">Access Denied</p>
          <p className="text-sm text-muted-foreground">
            Administrator privileges required.
          </p>
        </div>
      </div>
    )
  }

  // Fetch admin data
  const { count: totalUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  const { count: totalFiles } = await supabase
    .from('metadata')
    .select('*', { count: 'exact', head: true })

  const { data: recentLogs } = await supabase
    .from('activity_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20)

  return (
    <AdminContent
      totalUsers={totalUsers || 0}
      totalFiles={totalFiles || 0}
      recentLogs={recentLogs || []}
    />
  )
}
