'use client'

import { useState, useCallback } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { verifyBlockchainHash } from '@/actions/recover'
import { Link2, Search, CheckCircle, XCircle, Shield } from 'lucide-react'

export default function BlockchainPage() {
  const [hash, setHash] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [result, setResult] = useState<{
    verified: boolean
    record?: {
      txId: string
      network: string
      timestamp: string
      hash: string
    } | null
    error?: string
  } | null>(null)

  const handleVerify = useCallback(async () => {
    if (!hash.trim()) return
    setVerifying(true)
    setResult(null)

    try {
      const res = await verifyBlockchainHash(hash.trim())
      setResult(res)
    } catch (err) {
      setResult({
        verified: false,
        error: err instanceof Error ? err.message : 'Verification failed',
      })
    } finally {
      setVerifying(false)
    }
  }, [hash])

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Link2 className="h-5 w-5 text-primary" />
          Blockchain Verification
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Verify file integrity hashes against the blockchain ledger
        </p>
      </div>

      {/* Info Card */}
      <Card className="border-border bg-card">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-card-foreground font-medium">Mock Blockchain (Phase 1)</p>
              <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                Currently using a mock blockchain service that stores hashes in Supabase.
                Phase 2 will integrate real Polygon/Ethereum smart contracts for
                on-chain hash storage and verification.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verify Hash */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-sm text-card-foreground">Verify Hash</CardTitle>
          <CardDescription className="text-muted-foreground">
            Enter a SHA-256 integrity hash to verify against the blockchain
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={hash}
              onChange={(e) => setHash(e.target.value)}
              placeholder="Enter SHA-256 hash..."
              className="bg-secondary border-border text-card-foreground font-mono text-xs placeholder:text-muted-foreground"
            />
            <Button
              onClick={handleVerify}
              disabled={!hash.trim() || verifying}
              className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0 gap-2"
            >
              <Search className="h-4 w-4" />
              {verifying ? 'Verifying...' : 'Verify'}
            </Button>
          </div>

          {result && (
            <div className={`rounded-lg border p-4 ${result.verified ? 'border-accent/50 bg-accent/5' : 'border-destructive/50 bg-destructive/5'}`}>
              <div className="flex items-center gap-2 mb-3">
                {result.verified ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-accent" />
                    <span className="text-sm font-semibold text-accent">Hash Verified</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-destructive" />
                    <span className="text-sm font-semibold text-destructive">
                      {result.error || 'Hash Not Found'}
                    </span>
                  </>
                )}
              </div>

              {result.verified && result.record && (
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">TX ID:</span>
                    <span className="text-card-foreground break-all">{result.record.txId}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Network:</span>
                    <Badge variant="outline" className="border-primary/30 text-primary text-[10px]">
                      {result.record.network}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Timestamp:</span>
                    <span className="text-card-foreground">
                      {new Date(result.record.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* How it works */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-sm text-card-foreground">How Verification Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-xs text-muted-foreground">
            <div className="flex items-start gap-3">
              <span className="text-primary font-mono font-bold">1.</span>
              <p>When a file is encrypted, a SHA-256 hash of the ciphertext is computed</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-primary font-mono font-bold">2.</span>
              <p>This hash is stored on the blockchain with a unique transaction ID</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-primary font-mono font-bold">3.</span>
              <p>During recovery, the extracted data is re-hashed and compared</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-primary font-mono font-bold">4.</span>
              <p>Any tampering will produce a different hash, failing verification</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
