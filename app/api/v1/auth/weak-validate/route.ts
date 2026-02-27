import { NextResponse } from 'next/server'

/**
 * VULNERABILITY (training): weak JWT validation example.
 * Accepts token if it merely contains 3 dot-separated parts without signature verification.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const token = String(body?.token || '')
  const accepted = token.split('.').length === 3

  return NextResponse.json({ trainingMode: true, accepted, reason: 'shape-only-jwt-validation' })
}
