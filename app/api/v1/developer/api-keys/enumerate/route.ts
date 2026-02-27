import { NextResponse } from 'next/server'

/**
 * VULNERABILITY (training): API key enumeration flaw.
 * Predictable key format is disclosed for testing detection controls.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const tenant = searchParams.get('tenant') || 'default'
  const sampleKeys = Array.from({ length: 3 }).map((_, i) => `${tenant}_key_${i + 1000}`)

  return NextResponse.json({ trainingMode: true, sampleKeys })
}
