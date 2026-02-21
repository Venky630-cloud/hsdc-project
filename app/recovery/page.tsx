'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FileUploader } from '@/components/file-uploader'
import { ProgressIndicator } from '@/components/progress-indicator'
import { recoverFile } from '@/actions/recover'
import { getUserFiles } from '@/actions/upload'
import {
  Download,
  Shield,
  CheckCircle,
  AlertTriangle,
  XCircle,
} from 'lucide-react'
import type { RecoveryStage } from '@/lib/types'

const RECOVERY_STAGES = [
  { key: 'extracting', label: 'Extract' },
  { key: 'verifying', label: 'Verify' },
  { key: 'decrypting', label: 'Decrypt' },
  { key: 'complete', label: 'Done' },
]

interface FileRecord {
  id: string
  original_filename: string
  status: string
  created_at: string
  stego_filename?: string | null
}

export default function RecoveryPage() {
  const [stegoImage, setStegoImage] = useState<File | null>(null)
  const [selectedFileId, setSelectedFileId] = useState<string>('')
  const [files, setFiles] = useState<FileRecord[]>([])
  const [processing, setProcessing] = useState(false)
  const [stage, setStage] = useState<RecoveryStage>('extracting')
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState('')
  const [result, setResult] = useState<{
    success: boolean
    error?: string
    originalFilename?: string
    mimeType?: string
    fileBase64?: string
    integrityVerified?: boolean
    blockchainVerified?: boolean
  } | null>(null)

  useEffect(() => {
    getUserFiles().then(({ files: f }) => {
      setFiles(
        (f || [])
          .filter((file: FileRecord) => file.status === 'ACTIVE')
          .map((file: FileRecord) => ({
            id: file.id,
            original_filename: file.original_filename,
            status: file.status,
            created_at: file.created_at,
            stego_filename: (file as any).stego_filename || null,
          })),
      )
    })
  }, [])

  const handleRecover = useCallback(async () => {
    if (!selectedFileId) return

    setProcessing(true)
    setResult(null)

    const stages: { stage: RecoveryStage; progress: number; message: string; delay: number }[] = [
      { stage: 'extracting', progress: 20, message: 'Extracting hidden data from stego image...', delay: 0 },
      { stage: 'verifying', progress: 55, message: 'Verifying blockchain hash integrity...', delay: 800 },
      { stage: 'decrypting', progress: 85, message: 'Decrypting with AES-256-GCM...', delay: 1600 },
    ]

    for (const s of stages) {
      setTimeout(() => {
        setStage(s.stage)
        setProgress(s.progress)
        setMessage(s.message)
      }, s.delay)
    }

    const selectedRecord = files.find((f) => f.id === selectedFileId)

    const formData = new FormData()
    formData.append('metadataId', selectedFileId)
    // Only append stegoImage if user provided one AND server copy is not available
    if (!selectedRecord?.stego_filename && stegoImage) {
      formData.append('stegoImage', stegoImage)
    }

    try {
      const res = await recoverFile(formData)
      if (res.success) {
        setStage('complete')
        setProgress(100)
        setMessage('File recovered successfully')
      } else {
        setStage('error')
        setProgress(0)
        // Safe error message - no stack traces exposed
        setMessage(res.error || 'Recovery failed. Please try again.')
      }
      setResult(res)
    } catch (err) {
      setStage('error')
      setProgress(0)
      // Generic error handling
      setMessage('An unexpected error occurred. Please try again.')
      setResult({ success: false, error: 'Unexpected error occurred' })
    } finally {
      setProcessing(false)
    }
  }, [stegoImage, selectedFileId])

  const handleDownload = useCallback(() => {
    if (!result?.fileBase64 || !result.originalFilename) return
    const link = document.createElement('a')
    link.href = `data:${result.mimeType || 'application/octet-stream'};base64,${result.fileBase64}`
    link.download = result.originalFilename
    link.click()
  }, [result])

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Download className="h-5 w-5 text-primary" />
          File Recovery
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Extract and decrypt a file from a stego image
        </p>
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-sm text-card-foreground">Recovery Inputs</CardTitle>
          <CardDescription className="text-muted-foreground">
            Upload the stego image and select which file to recover
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-card-foreground">
              Select File Record
            </label>
            <Select value={selectedFileId} onValueChange={setSelectedFileId}>
              <SelectTrigger className="bg-secondary border-border text-card-foreground">
                <SelectValue placeholder="Choose file to recover..." />
              </SelectTrigger>
              <SelectContent>
                {files.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    <span className="font-mono text-xs">{f.original_filename}</span>
                    <span className="text-muted-foreground text-xs ml-2">
                      ({new Date(f.created_at).toLocaleDateString()})
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <FileUploader
            label="Stego Image"
            accept="image/png,image/bmp,image/tiff"
            description="The stego image containing hidden data"
            onFileSelect={setStegoImage}
          />
          <Button
            onClick={handleRecover}
            disabled={!stegoImage || !selectedFileId || processing}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {processing ? 'Recovering...' : 'Extract & Decrypt'}
          </Button>
        </CardContent>
      </Card>

      {(processing || result) && (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-sm text-card-foreground">Recovery Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <ProgressIndicator
              stage={stage}
              progress={progress}
              message={message}
              stages={RECOVERY_STAGES}
            />
          </CardContent>
        </Card>
      )}

      {result && !processing && (
        <Card className={`border ${result.success ? 'border-accent/50' : 'border-destructive/50'} bg-card`}>
          <CardContent className="pt-6 space-y-4">
            {result.success ? (
              <>
                <div className="flex items-center gap-2 text-accent">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-semibold text-sm">Recovery Successful</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">File:</span>
                    <span className="text-xs text-card-foreground font-mono">
                      {result.originalFilename}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Integrity:</span>
                    {result.integrityVerified ? (
                      <span className="text-xs text-accent flex items-center gap-1">
                        <Shield className="h-3 w-3" /> Verified
                      </span>
                    ) : (
                      <span className="text-xs text-destructive flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> TAMPERING DETECTED
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Blockchain:</span>
                    {result.blockchainVerified ? (
                      <span className="text-xs text-accent flex items-center gap-1">
                        <Shield className="h-3 w-3" /> Verified
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Not verified</span>
                    )}
                  </div>
                </div>
                <Button
                  onClick={handleDownload}
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90 gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download Recovered File
                </Button>
              </>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="text-sm font-semibold">{result.error}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
