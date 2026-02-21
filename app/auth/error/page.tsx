import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>
}) {
  const params = await searchParams

  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-background p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-2 text-primary">
            <Shield className="h-8 w-8" />
            <span className="text-2xl font-bold tracking-tight font-mono">HSDC</span>
          </div>
          <Card className="w-full border-border bg-card">
            <CardHeader className="text-center">
              <CardTitle className="text-xl text-card-foreground flex items-center justify-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Authentication Error
              </CardTitle>
            </CardHeader>
            <CardContent>
              {params?.error ? (
                <p className="text-sm text-muted-foreground text-center font-mono">
                  Error: {params.error}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground text-center">
                  An unspecified authentication error occurred.
                </p>
              )}
              <div className="mt-4 text-center">
                <Link
                  href="/auth/login"
                  className="text-sm text-primary underline underline-offset-4 hover:text-primary/80"
                >
                  Return to Login
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
