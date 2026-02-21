import Link from 'next/link'
import { Shield, Lock, Eye, Link2, ArrowRight, FileKey, Database, Fingerprint } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-svh bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-2 text-primary">
          <Shield className="h-6 w-6" />
          <span className="text-lg font-bold tracking-tight font-mono">HSDC</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/auth/login">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
              Login
            </Button>
          </Link>
          <Link href="/auth/sign-up">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              Get Started
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center px-6 py-20 md:py-32 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-1.5 mb-6">
          <Lock className="h-3 w-3 text-primary" />
          <span className="text-xs font-mono text-muted-foreground">AES-256-GCM + RSA-2048</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground text-balance max-w-3xl leading-tight">
          Hybrid Steganographic Data Camouflage
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-xl text-pretty leading-relaxed">
          Military-grade encryption hidden within ordinary images. Your data is
          encrypted, concealed, and blockchain-verified.
        </p>
        <div className="flex items-center gap-4 mt-8">
          <Link href="/auth/sign-up">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
              Start Encrypting
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="#features">
            <Button size="lg" variant="outline" className="border-border text-foreground hover:bg-secondary">
              How It Works
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="px-6 py-16 md:py-24">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-12 text-balance">
            Three Layers of Protection
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard
              icon={<FileKey className="h-6 w-6" />}
              title="AES-256-GCM Encryption"
              description="Files are encrypted with a randomly generated AES key, then the key itself is wrapped with RSA-2048 public key cryptography."
            />
            <FeatureCard
              icon={<Eye className="h-6 w-6" />}
              title="LSB Steganography"
              description="Encrypted data is embedded into carrier images using least-significant-bit encoding with seeded PRNG pixel ordering."
            />
            <FeatureCard
              icon={<Link2 className="h-6 w-6" />}
              title="Blockchain Integrity"
              description="SHA-256 hashes are recorded on-chain for tamper-proof verification. Any modification to the data is instantly detectable."
            />
          </div>
        </div>
      </section>

      {/* Pipeline Section */}
      <section className="px-6 py-16 md:py-24 border-t border-border">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-12 text-balance">
            The HSDC Pipeline
          </h2>
          <div className="space-y-6">
            <PipelineStep
              number={1}
              title="Upload & Validate"
              description="Select your secret file and a carrier image. The system validates file types, sizes, and image capacity."
            />
            <PipelineStep
              number={2}
              title="Encrypt"
              description="Your file is encrypted with AES-256-GCM. The symmetric key is wrapped with RSA-2048 for secure storage."
            />
            <PipelineStep
              number={3}
              title="Embed"
              description="Encrypted data is hidden inside the carrier image using 2-bit LSB steganography with randomized pixel ordering."
            />
            <PipelineStep
              number={4}
              title="Hash & Verify"
              description="A SHA-256 integrity hash is computed and stored on the blockchain for tamper detection."
            />
            <PipelineStep
              number={5}
              title="Download"
              description="You receive a stego image that looks identical to the original but contains your encrypted data."
            />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="px-6 py-16 md:py-20 border-t border-border">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          <StatBlock label="Encryption" value="AES-256" />
          <StatBlock label="Key Wrapping" value="RSA-2048" />
          <StatBlock label="Integrity" value="SHA-256" />
          <StatBlock label="Concealment" value="LSB-2bit" />
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-16 md:py-20 border-t border-border">
        <div className="max-w-2xl mx-auto text-center">
          <Database className="h-8 w-8 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-3 text-balance">
            Ready to Secure Your Data?
          </h2>
          <p className="text-muted-foreground mb-6 text-pretty leading-relaxed">
            Create an account to start encrypting, hiding, and verifying your
            sensitive files with the HSDC platform.
          </p>
          <Link href="/auth/sign-up">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
              Create Account
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-6 border-t border-border">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Fingerprint className="h-4 w-4 text-primary" />
            <span className="text-xs font-mono">HSDC v1.0 - Phase 1</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Hybrid Steganographic Data Camouflage System
          </p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-6 space-y-3">
      <div className="text-primary">{icon}</div>
      <h3 className="font-semibold text-card-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  )
}

function PipelineStep({
  number,
  title,
  description,
}: {
  number: number
  title: string
  description: string
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-mono font-bold shrink-0">
        {number}
      </div>
      <div>
        <h3 className="font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed mt-1">{description}</p>
      </div>
    </div>
  )
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-xl md:text-2xl font-bold text-primary font-mono">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  )
}
