'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { generateApiKey, listApiKeys, revokeApiKey } from '@/actions/api-keys'
import { Shield, Key, Copy, Check, Trash2, AlertCircle } from 'lucide-react'

export default function DeveloperPage() {
  const [keys, setKeys] = useState<any[]>([])
  const [newKeyName, setNewKeyName] = useState('')
  const [plaintextKey, setPlaintextKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)

  // Load existing keys on mount
  useEffect(() => {
    loadKeys()
  }, [])

  async function loadKeys() {
    const res = await listApiKeys()
    if (res.success) setKeys(res.keys || [])
  }

  const handleGenerate = async () => {
    if (!newKeyName) return
    setLoading(true)
    const res = await generateApiKey(newKeyName)
    if (res.success && res.plaintextKey) {
      setPlaintextKey(res.plaintextKey)
      setNewKeyName('')
      await loadKeys()
    }
    setLoading(false)
  }

  const handleRevoke = async (id: string) => {
    if (confirm('Are you sure? Any scripts using this key will immediately fail.')) {
      const res = await revokeApiKey(id)
      if (res.success) await loadKeys()
    }
  }

  const copyToClipboard = () => {
    if (plaintextKey) {
      navigator.clipboard.writeText(plaintextKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Key className="h-6 w-6 text-cyan-500" />
            Developer Settings
          </h1>
          <p className="text-slate-400">Manage API keys for programmatic vault access</p>
        </div>
      </div>

      {/* API Key Generation */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white text-sm uppercase tracking-wider">Create New API Key</CardTitle>
          <CardDescription>Give your key a name to identify its purpose (e.g., "Python Automation")</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Input 
            placeholder="Key Name" 
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            className="bg-slate-950 border-slate-800 text-white"
          />
          <Button 
            onClick={handleGenerate} 
            disabled={loading || !newKeyName}
            className="bg-cyan-600 hover:bg-cyan-500 text-white"
          >
            {loading ? 'Generating...' : 'Generate Key'}
          </Button>
        </CardContent>
      </Card>

      {/* Plaintext Key Reveal (Shown once) */}
      {plaintextKey && (
        <Card className="border-cyan-500/50 bg-cyan-950/20 animate-in fade-in zoom-in duration-300">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2 text-cyan-400">
              <AlertCircle className="h-5 w-5" />
              <span className="font-bold">Save this key now!</span>
            </div>
            <p className="text-sm text-slate-300">
              For security, this key will never be shown again. If you lose it, you must revoke it and create a new one.
            </p>
            <div className="flex items-center gap-2 bg-slate-950 p-3 rounded border border-slate-800">
              <code className="flex-1 text-cyan-300 font-mono break-all">{plaintextKey}</code>
              <Button size="icon" variant="ghost" onClick={copyToClipboard} className="text-slate-400 hover:text-white">
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <Button variant="outline" className="w-full border-slate-700 text-slate-400" onClick={() => setPlaintextKey(null)}>
              I have saved my key
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Existing Keys Table */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white text-sm uppercase tracking-wider">Active API Keys</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {keys.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-4">No active API keys found.</p>
            ) : (
              keys.map((key) => (
                <div key={key.id} className="flex items-center justify-between p-4 bg-slate-950 rounded border border-slate-800">
                  <div>
                    <p className="text-white font-medium">{key.name}</p>
                    <p className="text-xs text-slate-500 font-mono">{key.key_prefix}</p>
                    <p className="text-[10px] text-slate-600 uppercase mt-1">Created: {new Date(key.created_at).toLocaleDateString()}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleRevoke(key.id)} className="text-slate-500 hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
