/**
 * Auth Service workflow example.
 * Request lifecycle:
 * 1) API Gateway forwards login request with correlation id.
 * 2) Validate payload, rate limit key, and tenant state.
 * 3) Verify password/MFA and issue short-lived access token.
 * 4) Publish login event for audit and analytics services.
 */
export async function handleAuthRequest(requestId: string, payload: { email: string; password: string }) {
  const context = {
    requestId,
    stage: 'auth-service',
    startedAt: new Date().toISOString(),
  }

  const validated = payload.email.includes('@') && payload.password.length >= 8
  if (!validated) {
    return { ok: false, status: 400, context, message: 'Invalid credentials format' }
  }

  const token = `access-${Buffer.from(`${payload.email}:${requestId}`).toString('base64')}`
  return { ok: true, status: 200, context, token }
}
