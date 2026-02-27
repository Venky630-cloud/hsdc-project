import { NextResponse } from 'next/server'

/**
 * Intentionally vulnerable endpoint for security training.
 * Vulnerabilities:
 * - Unsafely echoes user-provided query input
 * - Demonstrates SQL injection risk in comments
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') ?? ''

  // DO NOT USE IN REAL SYSTEMS:
  // const sql = `SELECT * FROM metadata WHERE filename LIKE '%${query}%'`
  return NextResponse.json({
    trainingMode: true,
    query,
    simulatedSql: `SELECT * FROM metadata WHERE filename LIKE '%${query}%'`,
    message: 'This endpoint intentionally demonstrates injection-prone query construction.',
  })
}
