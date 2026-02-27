'use client'

import { CisoDataTable } from '@/components/data-table'
import { ExportAuditButton } from '@/components/export-button'
import { SecurityLogo } from '@/components/logo'

export function DashboardContent({ 
  profile, 
  recentFiles, 
  recentLogs, 
  totalFiles, 
  activeFiles 
}: { 
  profile: any, 
  recentFiles: any[], 
  recentLogs: any[], 
  totalFiles: number, 
  activeFiles: number 
}) {
  
  // Mathematically calculate Vault Capacity Used
  const totalBytes = recentFiles.reduce((acc, f) => acc + Number(f.file_size || 0), 0)

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Command Center Header */}
      <div className="flex items-center justify-between bg-slate-900 p-6 rounded-lg border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-4">
          <SecurityLogo className="w-12 h-12 text-cyan-500" />
          <div>
            <h1 className="text-2xl font-bold text-white">HSDC Security Command Center</h1>
            <p className="text-slate-400">Welcome, Agent {profile?.username || 'Unknown'}</p>
          </div>
        </div>
        
        {/* SOC 2 Compliance Export */}
        <ExportAuditButton />
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-lg shadow-lg">
          <h4 className="text-slate-500 text-sm uppercase tracking-wider mb-2">Total Active Files</h4>
          <p className="text-3xl font-bold text-white">{activeFiles}</p>
        </div>
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-lg shadow-lg">
          <h4 className="text-slate-500 text-sm uppercase tracking-wider mb-2">Vault Capacity Used</h4>
          <p className="text-3xl font-bold text-cyan-400">{(totalBytes / 1024 / 1024).toFixed(2)} MB</p>
        </div>
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-lg shadow-lg">
          <h4 className="text-slate-500 text-sm uppercase tracking-wider mb-2">System Status</h4>
          <p className="text-3xl font-bold text-green-500 flex items-center">
            <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse mr-3"></span>
            Secure
          </p>
        </div>
      </div>

      {/* Interactive Data Table with Crypto-Shredding */}
      <CisoDataTable data={recentFiles} />
    </div>
  )
}
