'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Shield,
  LayoutDashboard,
  Upload,
  Download,
  Link2,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/upload', label: 'Upload & Encrypt', icon: Upload },
  { href: '/recovery', label: 'Recovery', icon: Download },
  { href: '/blockchain', label: 'Blockchain', icon: Link2 },
  { href: '/admin', label: 'Admin', icon: Settings },
]

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <div className="flex min-h-svh bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col border-r border-sidebar-border bg-sidebar">
        <div className="flex items-center gap-2 px-6 py-5 border-b border-sidebar-border">
          <Shield className="h-6 w-6 text-sidebar-primary" />
          <span className="text-lg font-bold tracking-tight font-mono text-sidebar-foreground">
            HSDC
          </span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                  active
                    ? 'bg-sidebar-accent text-sidebar-primary'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground',
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="px-3 py-4 border-t border-sidebar-border">
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="flex flex-1 flex-col">
        <header className="flex md:hidden items-center justify-between px-4 py-3 border-b border-border bg-card">
          <div className="flex items-center gap-2 text-primary">
            <Shield className="h-5 w-5" />
            <span className="text-sm font-bold font-mono">HSDC</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </header>

        {/* Mobile Nav Overlay */}
        {mobileOpen && (
          <div className="md:hidden border-b border-border bg-card px-4 py-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm',
                    active
                      ? 'bg-secondary text-primary'
                      : 'text-muted-foreground hover:bg-secondary',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-secondary"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
