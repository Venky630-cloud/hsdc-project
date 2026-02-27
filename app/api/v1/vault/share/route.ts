import { NextResponse } from 'next/server'

/**
 * VULNERABILITY (training): IDOR in sharing flow.
 * The caller can pass ownerId directly; endpoint does not verify ownership.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const ownerId = searchParams.get('ownerId')
  const fileId = searchParams.get('fileId')

  return NextResponse.json({
    trainingMode: true,
    ownerId,
    fileId,
    shareUrl: `https://app.secure-stego.duckdns.org/shared/${ownerId}/${fileId}`,
  })
}
