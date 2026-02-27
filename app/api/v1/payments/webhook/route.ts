import { NextResponse } from 'next/server'

/**
 * VULNERABILITY (training): webhook signature bug.
 * Uses startsWith instead of constant-time exact validation.
 */
export async function POST(request: Request) {
  const signature = request.headers.get('x-gateway-signature') || ''
  const expected = process.env.TRAINING_WEBHOOK_SECRET || 'demo-secret'
  const signatureAccepted = signature.startsWith(expected.slice(0, 4))

  return NextResponse.json({ trainingMode: true, signatureAccepted })
}
