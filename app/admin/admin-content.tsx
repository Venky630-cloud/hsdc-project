'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Settings, Users, FileKey, Activity, Clock, AlertTriangle } from 'lucide-react'

interface AdminContentProps {
  totalUsers: number
  totalFiles: number
  recentLogs: Array<Record<string, unknown>>
}

export function AdminContent({
  totalUsers,
  totalFiles,
  recentLogs,
}: AdminContentProps) {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          Admin Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          System overview and monitoring
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="border-border bg-card">
          <CardContent className="pt-4 pb-4">
            <Users className="h-4 w-4 text-primary mb-2" />
            <p className="text-2xl font-bold text-card-foreground font-mono">{totalUsers}</p>
            <p className="text-xs text-muted-foreground">Total Users</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="pt-4 pb-4">
            <FileKey className="h-4 w-4 text-accent mb-2" />
            <p className="text-2xl font-bold text-card-foreground font-mono">{totalFiles}</p>
            <p className="text-xs text-muted-foreground">Total Files</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="pt-4 pb-4">
            <Activity className="h-4 w-4 text-primary mb-2" />
            <p className="text-2xl font-bold text-card-foreground font-mono">{recentLogs.length}</p>
            <p className="text-xs text-muted-foreground">Recent Actions</p>
          </CardContent>
        </Card>
      </div>

      {/* System Activity Log */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-sm text-card-foreground flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            System Activity Log
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            All user actions across the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No activity recorded yet.
            </p>
          ) : (
            <div className="space-y-2">
              {recentLogs.map((log) => {
                // Detect suspicious activities for tamper alerts
                const isSuspicious = 
                  (log.action as string) === 'RECOVERY' && 
                  !(log.details as Record<string, unknown>)?.integrity_verified
                
                return (
                  <div
                    key={log.id as string}
                    className={`flex items-center gap-3 py-2 border-b border-border last:border-0 ${
                      isSuspicious ? 'bg-destructive/5' : ''
                    }`}
                  >
                    {isSuspicious ? (
                      <AlertTriangle className="h-3 w-3 text-destructive shrink-0" />
                    ) : (
                      <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
                    )}
                    <div className="flex-1 min-w-0 flex items-center gap-3">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-mono shrink-0 ${
                          isSuspicious 
                            ? 'border-destructive/30 text-destructive bg-destructive/5'
                            : 'border-primary/30 text-primary'
                        }`}
                      >
                        {isSuspicious && '⚠ '}{log.action as string}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-mono truncate">
                        {(log.user_id as string)?.slice(0, 8)}...
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {new Date(log.created_at as string).toLocaleString()}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Phase 2 Notice */}
      <Card className="border-border bg-card">
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <p className="text-sm text-card-foreground font-medium">Phase 2 Features Coming Soon</p>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-md mx-auto">
              Real blockchain integration (Polygon/Ethereum), user management,
              file analytics, and advanced audit trails will be available in Phase 2.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
