'use client'

import { useState } from 'react'
import { hideFile, cryptoShredFile } from '@/actions/lifecycle'

// Define the expected shape of our database row
interface FileRecord {
  id: string
  original_filename: string
  file_size: number
  status: string
  created_at: string
}

export function CisoDataTable({ data }: { data: FileRecord[] }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const PAGE_SIZE = 5

  // 1. Filter logic (Search)
  const filteredData = data.filter(file => 
    file.original_filename.toLowerCase().includes(searchTerm.toLowerCase()) &&
    file.status !== 'REVOKED' && // Do not show hidden files
    file.status !== 'EXPIRED'    // Do not show shredded files
  )

  // 2. Pagination Math
  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE)
  const startIndex = (currentPage - 1) * PAGE_SIZE
  const paginatedData = filteredData.slice(startIndex, startIndex + PAGE_SIZE)

  // 3. Action Handlers
  const handleHide = async (id: string) => {
    setLoadingId(id)
    await hideFile(id)
    setLoadingId(null)
  }

  const handleShred = async (id: string) => {
    if (!window.confirm("WARNING: This will permanently destroy the cryptographic keys. The file will be unrecoverable. Proceed?")) return
    setLoadingId(id)
    await cryptoShredFile(id)
    setLoadingId(null)
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-2xl">
      {/* Table Toolbar */}
      <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
        <h3 className="text-lg font-semibold text-slate-200">Active Cryptographic Vault</h3>
        <input 
          type="text" 
          placeholder="Search encrypted files..." 
          className="bg-slate-900 border border-slate-700 text-slate-200 px-4 py-2 rounded focus:outline-none focus:border-cyan-500 transition"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            setCurrentPage(1) // Reset to page 1 on search
          }}
        />
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-400">
          <thead className="text-xs text-slate-500 uppercase bg-slate-900/50 border-b border-slate-800">
            <tr>
              <th className="px-6 py-4">Filename</th>
              <th className="px-6 py-4">Size (Bytes)</th>
              <th className="px-6 py-4">Encrypted Date</th>
              <th className="px-6 py-4 text-right">Lifecycle Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-500">No active files found.</td>
              </tr>
            ) : (
              paginatedData.map((file) => (
                <tr key={file.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition">
                  <td className="px-6 py-4 font-medium text-slate-200">{file.original_filename}</td>
                  <td className="px-6 py-4">{file.file_size.toLocaleString()}</td>
                  <td className="px-6 py-4">{new Date(file.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right space-x-3">
                    <button 
                      onClick={() => handleHide(file.id)}
                      disabled={loadingId === file.id}
                      className="text-slate-400 hover:text-white transition disabled:opacity-50"
                    >
                      Hide
                    </button>
                    <button 
                      onClick={() => handleShred(file.id)}
                      disabled={loadingId === file.id}
                      className="text-red-500 hover:text-red-400 font-semibold transition disabled:opacity-50"
                    >
                      {loadingId === file.id ? 'Shredding...' : 'Crypto-Shred'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-slate-800 flex justify-between items-center bg-slate-950">
          <span className="text-sm text-slate-500">
            Page <strong className="text-slate-300">{currentPage}</strong> of <strong className="text-slate-300">{totalPages}</strong>
          </span>
          <div className="flex space-x-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-slate-800 text-slate-300 rounded hover:bg-slate-700 disabled:opacity-50 transition"
            >
              Prev
            </button>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-slate-800 text-slate-300 rounded hover:bg-slate-700 disabled:opacity-50 transition"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
