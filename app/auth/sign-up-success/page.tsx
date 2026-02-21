import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Shield, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function SignUpSuccessPage() {
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
                <CheckCircle className="h-5 w-5 text-accent" />
                Registration Complete
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Verify your identity to continue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center leading-relaxed">
                A confirmation link has been sent to your email. Please verify your
                account before signing in to access the HSDC secure vault.
              </p>
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
