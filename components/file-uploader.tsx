'use client'

import { useCallback, useState, useRef } from 'react'
import { Upload, X, FileIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileUploaderProps {
  accept?: string
  maxSize?: number
  label: string
  description?: string
  onFileSelect: (file: File | null) => void
  className?: string
}

export function FileUploader({
  accept,
  maxSize = 50 * 1024 * 1024,
  label,
  description,
  onFileSelect,
  className,
}: FileUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(
    (f: File) => {
      setError(null)
      if (f.size > maxSize) {
        setError(`File exceeds ${Math.round(maxSize / 1024 / 1024)}MB limit`)
        return
      }
      setFile(f)
      onFileSelect(f)
    },
    [maxSize, onFileSelect],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const f = e.dataTransfer.files[0]
      if (f) handleFile(f)
    },
    [handleFile],
  )

  const handleRemove = () => {
    setFile(null)
    setError(null)
    onFileSelect(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className={cn('space-y-2', className)}>
      <label className="text-sm font-medium text-card-foreground">{label}</label>
      {!file ? (
        <div
          className={cn(
            'relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors cursor-pointer',
            dragOver
              ? 'border-primary bg-primary/5'
              : 'border-border bg-secondary/50 hover:border-primary/50',
          )}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
          }}
        >
          <Upload className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground text-center">
            Drop file here or click to browse
          </p>
          {description && (
            <p className="text-xs text-muted-foreground/70 mt-1">{description}</p>
          )}
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handleFile(f)
            }}
            className="sr-only"
            aria-label={label}
          />
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-secondary/50 p-3">
          <FileIcon className="h-5 w-5 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-card-foreground truncate font-mono">
              {file.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {(file.size / 1024).toFixed(1)} KB
            </p>
          </div>
          <button
            onClick={handleRemove}
            className="shrink-0 rounded p-1 hover:bg-muted transition-colors"
            aria-label="Remove file"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      )}
      {error && <p className="text-xs text-destructive font-mono">{error}</p>}
    </div>
  )
}
