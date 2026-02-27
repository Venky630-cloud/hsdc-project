'use client'

import { useState } from 'react'
import { exportAuditLogs } from '@/actions/audit'

export function ExportAuditButton() {
  const [loading, setLoading] = useState(false)

  const handleExport = async () => {
    setLoading(true)
    try {
      const logs = await exportAuditLogs()
      if (!logs || logs.length === 0) return

      // Define SOC 2 Standard CSV Headers
      const headers = ['Timestamp', 'Action', 'Resource ID', 'IP Address', 'Details']
      
      const csvRows = logs.map(log => {
        return [
          new Date(log.created_at).toISOString(),
          log.action,
          log.resource_id || 'N/A',
          log.ip_address || 'N/A',
          JSON.stringify(log.details).replace(/,/g, ';') // Prevent CSV column breaking
        ].join(',')
      })

      const csvContent = [headers.join(','), ...csvRows].join('\n')
      
      // Native Blob Generation (Zero Dependencies)
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `HSDC_Audit_Log_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button 
      onClick={handleExport} 
      disabled={loading}
      className="px-4 py-2 bg-slate-800 text-cyan-400 border border-cyan-800 rounded hover:bg-slate-700 transition"
    >
      {loading ? 'Generating...' : 'Export SOC 2 Audit Log (CSV)'}
    </button>
  )
}
