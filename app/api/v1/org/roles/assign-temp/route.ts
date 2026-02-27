import { NextResponse } from 'next/server'

/**
 * VULNERABILITY (training): role expiry logic flaw.
 * If expiry is missing, role is granted permanently instead of rejected.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const expiresAt = body?.expiresAt || null
  const grantedUntil = expiresAt ?? 'never'

  return NextResponse.json({ trainingMode: true, grantedUntil })
}
