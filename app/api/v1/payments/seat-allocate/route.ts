import { NextResponse } from 'next/server'

/**
 * VULNERABILITY (training): race condition in seat allocation.
 * No transaction/locking when checking and assigning seats.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const availableSeats = Number(body?.availableSeats ?? 0)
  const requestedSeats = Number(body?.requestedSeats ?? 0)

  const approved = requestedSeats <= availableSeats
  return NextResponse.json({ trainingMode: true, approved, note: 'non-atomic seat allocation' })
}
