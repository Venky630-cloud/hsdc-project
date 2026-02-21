/**
 * Environment Variable Validator
 * 
 * Validates critical environment variables at server startup.
 * Ensures all required secrets are present before the application initializes.
 * 
 * This runs ONLY on the server and never in the browser.
 */

declare const process: { env: Record<string, string | undefined> }

interface EnvironmentValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Validate presence and format of critical environment variables
 */
export function validateEnvironment(): EnvironmentValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Required Supabase credentials
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL is not set')
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set')
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    errors.push('SUPABASE_SERVICE_ROLE_KEY is not set')
  }

  // Required RSA keys for encryption
  if (!process.env.RSA_PRIVATE_KEY) {
    errors.push('RSA_PRIVATE_KEY is not set')
  }
  if (!process.env.RSA_PUBLIC_KEY) {
    errors.push('RSA_PUBLIC_KEY is not set')
  }

  // Optional but recommended
  if (!process.env.NODE_ENV) {
    warnings.push('NODE_ENV is not explicitly set')
  }

  // Validate RSA key format if present
  if (process.env.RSA_PRIVATE_KEY && !process.env.RSA_PRIVATE_KEY.includes('-----BEGIN')) {
    errors.push('RSA_PRIVATE_KEY does not appear to be valid PEM format')
  }
  if (process.env.RSA_PUBLIC_KEY && !process.env.RSA_PUBLIC_KEY.includes('-----BEGIN')) {
    errors.push('RSA_PUBLIC_KEY does not appear to be valid PEM format')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Initialize and validate environment on server startup
 * Call this in middleware.ts or during app initialization
 */
export function initializeEnvironment(): void {
  if (typeof window !== 'undefined') {
    // Running in browser - should never happen for env validation
    return
  }

  const result = validateEnvironment()

  if (!result.valid) {
    const errorMessage = `Critical environment variables missing:\n${result.errors.map((e) => `  - ${e}`).join('\n')}`
    console.error(errorMessage)
    throw new Error(errorMessage)
  }

  if (result.warnings.length > 0) {
    console.warn(
      `Environment warnings:\n${result.warnings.map((w) => `  - ${w}`).join('\n')}`,
    )
  }

  console.info('✓ Environment validation passed')
}

/**
 * Get a required environment variable or throw
 */
export function getRequiredEnv(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Required environment variable ${key} is not set`)
  }
  return value
}

/**
 * Get an optional environment variable
 */
export function getOptionalEnv(key: string, defaultValue?: string): string | undefined {
  return process.env[key] ?? defaultValue
}
