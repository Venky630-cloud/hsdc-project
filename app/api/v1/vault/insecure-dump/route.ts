import { NextResponse } from 'next/server'

/**
 * Intentionally vulnerable endpoint for security training.
 * Vulnerabilities:
 * - No authentication
 * - Returns sensitive mock secrets
 */
export async function GET() {
  return NextResponse.json({
    trainingMode: true,
    warning: 'Intentionally vulnerable endpoint for secure coding exercises only',
    leakedData: {
      fakeMasterKey: 'MASTER_KEY_PLAINTEXT_EXAMPLE',
      fakeDbPassword: 'super-secret-password',
      fakeApiToken: 'token_1234567890',
    },
  })
}
