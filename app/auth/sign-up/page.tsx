'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Shield, UserPlus } from 'lucide-react'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (password !== repeatPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
            `${window.location.origin}/dashboard`,
          data: {
            display_name: displayName || email.split('@')[0],
          },
        },
      })
      if (error) throw error
      router.push('/auth/sign-up-success')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

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
                <UserPlus className="h-4 w-4 text-primary" />
                Create Account
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Register for secure access
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignUp}>
                <div className="flex flex-col gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="display-name" className="text-card-foreground">Display Name</Label>
                    <Input
                      id="display-name"
                      type="text"
                      placeholder="Agent Smith"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="bg-secondary border-border text-card-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email" className="text-card-foreground">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="operator@hsdc.io"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-secondary border-border text-card-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password" className="text-card-foreground">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-secondary border-border text-card-foreground"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="repeat-password" className="text-card-foreground">Confirm Password</Label>
                    <Input
                      id="repeat-password"
                      type="password"
                      required
                      value={repeatPassword}
                      onChange={(e) => setRepeatPassword(e.target.value)}
                      className="bg-secondary border-border text-card-foreground"
                    />
                  </div>
                  {error && (
                    <p className="text-sm text-destructive font-mono">{error}</p>
                  )}
                  <Button
                    type="submit"
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Creating account...' : 'Register'}
                  </Button>
                </div>
                <div className="mt-4 text-center text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <Link
                    href="/auth/login"
                    className="text-primary underline underline-offset-4 hover:text-primary/80"
                  >
                    Login
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
          <p className="text-xs text-muted-foreground font-mono text-center">
            All credentials are hashed with bcrypt
          </p>
        </div>
      </div>
    </div>
  )
}
