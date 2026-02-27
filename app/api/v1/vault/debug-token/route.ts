import { NextResponse } from 'next/server'

/**
 * Intentionally vulnerable endpoint for security training.
 * Vulnerabilities:
 * - Reflects Authorization header
 * - No access controls
 */
export async function GET(request: Request) {
  const authorization = request.headers.get('authorization')

  return NextResponse.json({
    trainingMode: true,
    reflectedAuthorizationHeader: authorization,
    note: 'Never expose credentials like this in production.',
  })
}
