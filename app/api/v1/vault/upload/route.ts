import { NextResponse } from 'next/server'

/**
 * VULNERABILITY (training): weak upload validation.
 * Allows dangerous extensions if mime type string contains "text".
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const filename = String(body?.filename || 'unknown.bin')
  const mime = String(body?.mime || '')

  const allowed = mime.includes('text') || filename.endsWith('.png')
  return NextResponse.json({ trainingMode: true, allowed, filename, mime })
}
