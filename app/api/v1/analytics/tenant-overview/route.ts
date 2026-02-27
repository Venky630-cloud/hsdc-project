import { NextResponse } from 'next/server'

/**
 * VULNERABILITY (training): cross-tenant analytics leak.
 * `scope=all` returns aggregate metrics that should be restricted.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const scope = searchParams.get('scope') || 'tenant'

  const response = scope === 'all'
    ? { tenantA: 124, tenantB: 312, tenantC: 57 }
    : { currentTenant: 124 }

  return NextResponse.json({ trainingMode: true, scope, response })
}
