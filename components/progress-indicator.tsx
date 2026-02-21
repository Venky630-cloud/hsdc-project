import { cn } from '@/lib/utils'

interface ProgressIndicatorProps {
  stage: string
  progress: number
  message: string
  stages: { key: string; label: string }[]
}

export function ProgressIndicator({
  stage,
  progress,
  message,
  stages,
}: ProgressIndicatorProps) {
  const currentIndex = stages.findIndex((s) => s.key === stage)

  return (
    <div className="space-y-4">
      {/* Stage indicators */}
      <div className="flex items-center gap-1">
        {stages.map((s, i) => (
          <div key={s.key} className="flex items-center flex-1">
            <div
              className={cn(
                'flex items-center justify-center w-6 h-6 rounded-full text-xs font-mono shrink-0 transition-colors',
                i < currentIndex
                  ? 'bg-accent text-accent-foreground'
                  : i === currentIndex
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground',
              )}
            >
              {i < currentIndex ? '\u2713' : i + 1}
            </div>
            {i < stages.length - 1 && (
              <div
                className={cn(
                  'flex-1 h-0.5 mx-1 transition-colors',
                  i < currentIndex ? 'bg-accent' : 'bg-border',
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Stage labels */}
      <div className="flex justify-between">
        {stages.map((s, i) => (
          <span
            key={s.key}
            className={cn(
              'text-[10px] font-mono',
              i === currentIndex ? 'text-primary' : 'text-muted-foreground',
            )}
          >
            {s.label}
          </span>
        ))}
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Message */}
      <p className="text-xs text-muted-foreground font-mono text-center">
        {message}
      </p>
    </div>
  )
}
