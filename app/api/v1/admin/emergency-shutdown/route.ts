import { NextResponse } from 'next/server'

/**
 * VULNERABILITY (training): missing admin auth check.
 * This endpoint should require privileged authentication.
 */
export async function POST() {
  return NextResponse.json({
    trainingMode: true,
    status: 'shutdown_queued',
    note: 'No admin auth enforced in this lab endpoint.',
  })
}
