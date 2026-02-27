/**
 * Payments Service workflow example.
 * Request lifecycle:
 * 1) Receive billing command from API service.
 * 2) Verify organization subscription and payment method.
 * 3) Call external gateway and reconcile idempotency keys.
 * 4) Persist invoice state and send webhook events.
 */
export async function processPayment(requestId: string, orgId: string, amountCents: number) {
  const payment = {
    requestId,
    orgId,
    amountCents,
    service: 'payments-service',
  }

  if (amountCents <= 0) {
    return { ok: false, status: 422, payment, error: 'Amount must be positive' }
  }

  return {
    ok: true,
    status: 201,
    payment,
    transactionId: `txn_${requestId.slice(0, 8)}`,
  }
}
