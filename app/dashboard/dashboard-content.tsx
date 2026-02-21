'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Shield,
  FileKey,
  Activity,
  Link2,
  Upload,
  Download,
  Clock,
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import type { UserProfile } from '@/lib/types'

interface DashboardContentProps {
  profile: UserProfile | null
  recentFiles: Array<Record<string, unknown>>
  recentLogs: Array<Record<string, unknown>>
  totalFiles: number
  activeFiles: number
}

export function DashboardContent({
  profile,
  recentFiles,
  recentLogs,
  totalFiles,
  activeFiles,
}: DashboardContentProps) {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome, {profile?.display_name || 'Operator'}
          </h1>
          <p className="text-sm text-muted-foreground font-mono">
            {profile?.role === 'ADMIN' ? 'Administrator' : 'Secure Vault'} - Phase 1
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/upload">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
              <Upload className="h-4 w-4" />
              New Upload
            </Button>
          </Link>
          <Link href="/recovery">
            <Button variant="outline" className="border-border text-foreground hover:bg-secondary gap-2">
              <Download className="h-4 w-4" />
              Recovery
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<FileKey className="h-4 w-4" />} label="Total Files" value={totalFiles} />
        <StatCard icon={<Shield className="h-4 w-4" />} label="Active" value={activeFiles} />
        <StatCard icon={<Link2 className="h-4 w-4" />} label="Blockchain Hashes" value={recentFiles.filter((f) => f.blockchain_hash).length} />
        <StatCard icon={<Activity className="h-4 w-4" />} label="Recent Actions" value={recentLogs.length} />
      </div>

      {/* Recent Files + Activity */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Files */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-card-foreground flex items-center gap-2">
              <FileKey className="h-4 w-4 text-primary" />
              Recent Files
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Last 5 encrypted files
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentFiles.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No files yet. Start by uploading one.
              </p>
            ) : (
              <div className="space-y-3">
                {recentFiles.map((file) => (
                  <div
                    key={file.id as string}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-card-foreground truncate font-mono">
                        {file.original_filename as string}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(file.created_at as string).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge
                      variant={file.status === 'ACTIVE' ? 'default' : 'destructive'}
                      className={
                        file.status === 'ACTIVE'
                          ? 'bg-accent/20 text-accent border-accent/30'
                          : ''
                      }
                    >
                      {file.status as string}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Log */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-card-foreground flex items-center gap-2">
              <Activity className="h-4 w-4 text-accent" />
              Activity Log
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Recent operations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No activity yet.
              </p>
            ) : (
              <div className="space-y-3">
                {recentLogs.slice(0, 8).map((log) => (
                  <div
                    key={log.id as string}
                    className="flex items-center gap-3 py-1.5"
                  >
                    <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-card-foreground font-mono">
                        {log.action as string}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(log.created_at as string).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: number
}) {
  return (
    <Card className="border-border bg-card">
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center gap-2 mb-2 text-primary">{icon}</div>
        <p className="text-2xl font-bold text-card-foreground font-mono">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  )
}
