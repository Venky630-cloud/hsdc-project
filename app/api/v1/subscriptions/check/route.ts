import { NextResponse } from 'next/server'

/**
 * VULNERABILITY (training): subscription bypass edge case.
 * Legacy flag enables upload without validating active payment status.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const hasActiveSubscription = body?.status === 'ACTIVE'
  const allowed = hasActiveSubscription || body?.legacyPlan === true

  return NextResponse.json({ trainingMode: true, allowed, hasActiveSubscription })
}
