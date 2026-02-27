# ATTACK_SURFACE_MAP

## High-Risk Training Endpoints
- `GET /api/v1/vault/share?ownerId=&fileId=` → IDOR scenario.
- `POST /api/v1/auth/weak-validate` → weak JWT validation.
- `POST /api/v1/subscriptions/check` → plan bypass edge case.
- `POST /api/v1/admin/emergency-shutdown` → missing auth branch.
- `POST /api/v1/payments/webhook` → signature validation bug.
- `POST /api/v1/payments/seat-allocate` → race condition simulation.
- `GET /api/v1/developer/api-keys/enumerate` → API key enumeration.
- `POST /api/v1/vault/upload` → weak upload validation.
- `POST /api/v1/org/roles/assign-temp` → role expiry logic flaw.
- `GET /api/v1/analytics/tenant-overview` → cross-tenant leak path.

## Existing Training Endpoints
- `GET /api/v1/vault/insecure-dump`
- `GET /api/v1/vault/insecure-search`
- `GET /api/v1/vault/debug-token`

## Notes
These routes are intentionally vulnerable for penetration testing labs and must never be enabled in hardened production deployments.
