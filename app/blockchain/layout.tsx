import { DashboardShell } from '@/components/dashboard-shell'

export default function BlockchainLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>
}
