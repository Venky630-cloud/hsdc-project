'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileUploader } from '@/components/file-uploader'
import { ProgressIndicator } from '@/components/progress-indicator'
import { uploadAndProcess } from '@/actions/upload'
import { Shield, Download, CheckCircle, AlertTriangle } from 'lucide-react'
import type { UploadStage } from '@/lib/types'

const UPLOAD_STAGES = [
  { key: 'validating', label: 'Validate' },
  { key: 'encrypting', label: 'Encrypt' },
  { key: 'embedding', label: 'Embed' },
  { key: 'hashing', label: 'Hash' },
  { key: 'storing', label: 'Store' },
  { key: 'complete', label: 'Done' },
]

export default function UploadPage() {
  const [secretFile, setSecretFile] = useState<File | null>(null)
  const [carrierImage, setCarrierImage] = useState<File | null>(null)
  const [processing, setProcessing] = useState(false)
  const [stage, setStage] = useState<UploadStage>('validating')
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState('')
  const [result, setResult] = useState<{
    success: boolean
    error?: string
    stegoImageBase64?: string
    integrityHash?: string
    blockchainTxId?: string
    metadataId?: string
  } | null>(null)

  // Validate files client-side before submission
  const validateFiles = useCallback((): string | null => {
    const MAX_SIZE_MB = 50
    const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024

    if (!secretFile) return 'Please select a secret file'
    if (!carrierImage) return 'Please select a carrier image'

    if (secretFile.size > MAX_SIZE_BYTES) {
      return `Secret file exceeds ${MAX_SIZE_MB}MB limit`
    }
    if (carrierImage.size > MAX_SIZE_BYTES) {
      return `Carrier image exceeds ${MAX_SIZE_MB}MB limit`
    }

    // Validate carrier image type
    const validImageTypes = ['image/png', 'image/bmp', 'image/tiff']
    if (!validImageTypes.includes(carrierImage.type)) {
      return 'Carrier image must be PNG, BMP, or TIFF'
    }

    return null
  }, [secretFile, carrierImage])

  const handleUpload = useCallback(async () => {
    // Client-side validation first
    const validationError = validateFiles()
    if (validationError) {
      setResult({ success: false, error: validationError })
      return
    }

    if (!secretFile || !carrierImage) return

    setProcessing(true)
    setResult(null)

    // Simulate pipeline stages for UI feedback
    const stages: { stage: UploadStage; progress: number; message: string; delay: number }[] = [
      { stage: 'validating', progress: 10, message: 'Validating file types and sizes...', delay: 0 },
      { stage: 'encrypting', progress: 30, message: 'Encrypting with AES-256-GCM...', delay: 500 },
      { stage: 'embedding', progress: 55, message: 'Embedding via LSB steganography...', delay: 1000 },
      { stage: 'hashing', progress: 75, message: 'Computing SHA-256 integrity hash...', delay: 1500 },
      { stage: 'storing', progress: 90, message: 'Storing on blockchain...', delay: 2000 },
    ]

    // Start progress animation
    for (const s of stages) {
      setTimeout(() => {
        setStage(s.stage)
        setProgress(s.progress)
        setMessage(s.message)
      }, s.delay)
    }

    // Actually process
    const formData = new FormData()
    formData.append('secretFile', secretFile)
    formData.append('carrierImage', carrierImage)

    try {
      const res = await uploadAndProcess(formData)
      if (res.success) {
        setStage('complete')
        setProgress(100)
        setMessage('Pipeline complete - stego image ready')
      } else {
        setStage('error')
        setProgress(0)
        // Safe error message - never expose stack traces
        setMessage(res.error || 'Upload failed. Please try again.')
      }
      setResult(res)
    } catch (err) {
      setStage('error')
      setProgress(0)
      // Safe error handling - generic message
      setMessage('An unexpected error occurred. Please try again.')
      setResult({ success: false, error: 'Unexpected error occurred' })
    } finally {
      setProcessing(false)
    }
  }, [secretFile, carrierImage])

  const handleDownloadStego = useCallback(() => {
    if (!result?.stegoImageBase64) return
    const link = document.createElement('a')
    link.href = `data:image/png;base64,${result.stegoImageBase64}`
    link.download = `hsdc_stego_${Date.now()}.png`
    link.click()
  }, [result])

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Upload & Encrypt
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Encrypt a file and hide it inside a carrier image
        </p>
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-sm text-card-foreground">Select Files</CardTitle>
          <CardDescription className="text-muted-foreground">
            Choose a secret file and a carrier image (PNG, BMP, or TIFF)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FileUploader
            label="Secret File"
            description="PDF, TXT, JSON, images, ZIP (max 10MB)"
            onFileSelect={setSecretFile}
          />
          <FileUploader
            label="Carrier Image"
            accept="image/png,image/bmp,image/tiff"
            description="PNG, BMP, or TIFF (larger = more capacity)"
            onFileSelect={setCarrierImage}
          />
          <Button
            onClick={handleUpload}
            disabled={!secretFile || !carrierImage || processing}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {processing ? 'Processing...' : 'Encrypt & Embed'}
          </Button>
        </CardContent>
      </Card>

      {/* Progress */}
      {(processing || result) && (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-sm text-card-foreground">Pipeline Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ProgressIndicator
              stage={stage}
              progress={progress}
              message={message}
              stages={UPLOAD_STAGES}
            />
          </CardContent>
        </Card>
      )}

      {/* Result */}
      {result && !processing && (
        <Card className={`border ${result.success ? 'border-accent/50' : 'border-destructive/50'} bg-card`}>
          <CardContent className="pt-6 space-y-4">
            {result.success ? (
              <>
                <div className="flex items-center gap-2 text-accent">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-semibold text-sm">Upload Successful</span>
                </div>
                <div className="space-y-2 text-xs font-mono text-muted-foreground">
                  <p>
                    <span className="text-card-foreground">Hash: </span>
                    {result.integrityHash?.slice(0, 16)}...
                  </p>
                  <p>
                    <span className="text-card-foreground">TX: </span>
                    {result.blockchainTxId?.slice(0, 18)}...
                  </p>
                  <p>
                    <span className="text-card-foreground">ID: </span>
                    {result.metadataId}
                  </p>
                </div>
                <Button
                  onClick={handleDownloadStego}
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90 gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download Stego Image
                </Button>
              </>
            ) : (
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                <span className="text-sm">{result.error}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
