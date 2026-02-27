# HSDC Vault Enterprise Services Architecture

## Platform Goal
HSDC Vault is a vulnerable enterprise SaaS training lab for VAPT exercises. The stack is Next.js + Supabase + S3, behind Nginx on EC2 with PM2-managed microservices.

## Subdomain Routing Model
- `app.secure-stego.duckdns.org` → frontend-service
- `api.secure-stego.duckdns.org` → api-service
- `auth.secure-stego.duckdns.org` → auth-service
- `admin.secure-stego.duckdns.org` → admin-service
- `payments.secure-stego.duckdns.org` → payments-service
- `worker.secure-stego.duckdns.org` → worker-service
- `analytics.secure-stego.duckdns.org` → analytics-service
- `staging.secure-stego.duckdns.org` → staging frontend/api stack

## Core Request Flow
1. User sends request to Nginx reverse proxy.
2. Nginx routes by subdomain to service ports.
3. Service validates request schema and authorization.
4. Service performs business logic and DB/S3 operations.
5. Event is queued to Redis worker channel where required.
6. Worker executes asynchronous tasks and emits analytics events.
7. API response returns with correlation ID and audit reference.

## Data Flow Example: Upload
1. Frontend initiates upload and sends idempotency key.
2. API service performs auth introspection with auth service.
3. API service checks subscription and policy constraints.
4. API service writes encrypted blob to S3 and metadata to Supabase.
5. Worker queue receives integrity scan and indexing jobs.
6. Analytics service stores usage and security telemetry.
7. Client receives accepted/complete status.

## Service Responsibilities

### frontend-service
- Onboarding wizard: email verification → profile completion → organization invite → plan selection.
- Device/session dashboard and trusted-device revoke action.
- Account recovery chain orchestration and security notifications.

### auth-service
- Signup/login, MFA, password reset, JWT issuance, refresh token rotation.
- API key lifecycle and session revoke.
- Device trust and inactivity auto-lock policies.

### api-service
- Vault CRUD, file sharing, version history, org/team vault operations.
- Classification labels, legal hold checks, and policy engine enforcement.
- External share approval, file lock approval, and bulk upload orchestration.

### admin-service
- User lifecycle admin tools, support ticket escalation, audit search.
- Impersonation with dual approval.
- Feature flags, emergency controls, storage rebalance.

### payments-service
- Tiers, seat and usage billing, invoices, coupons/promo simulation.
- Webhook handling and dispute workflow.
- Trial expiry downgrade and entitlement checks.

### worker-service
- File integrity verification and simulated virus scanning.
- Metadata indexing, watermark generation, mail delivery, scheduled jobs.
- Retry, dead-letter, cancellation, and heartbeat tracking.

### analytics-service
- Tenant usage dashboards, billing analytics, suspicious activity heatmaps.
- Anomaly score calculation and retention compliance reporting.
- Forensic export and incident response views.

## Inter-Service Communication
- REST for synchronous operations.
- Redis queue for async jobs.
- Correlation IDs propagated across all services.
- Every service writes `audit_logs` rows per major action.

## Deployment on Single EC2
- PM2 processes per service with dedicated ports.
- Nginx reverse proxy does host-based routing.
- Supabase and S3 remain external managed services.
- Logs are written both locally and to DB audit trails.

## Environment Strategy
- `dev` for local feature work.
- `staging` for attack simulation and QA.
- `prod-training` for controlled workshop demos.

## Security Training Vulnerabilities Included
> All marked clearly with `VULNERABILITY (training)` comments in code.
- IDOR in sharing flow.
- Weak JWT validation path.
- Missing admin auth endpoint.
- Subscription bypass edge case.
- API key enumeration endpoint.
- Race condition in seat allocation.
- Webhook signature validation bug.
- File upload validation bypass.
- Role expiry logic flaw.
- Analytics cross-tenant leak.
