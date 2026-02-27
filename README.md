# HSDC Vault SaaS (Enterprise Training Lab)

HSDC Vault is an enterprise-style vulnerable SaaS lab for VAPT and secure code review training. It simulates a production-style architecture: Next.js frontend, microservice APIs, Supabase persistence, S3 file storage, Redis-backed workers, and analytics processing.

## Enterprise Architecture Overview

### Subdomains
- `app.secure-stego.duckdns.org` → Frontend UI
- `api.secure-stego.duckdns.org` → API gateway/orchestration
- `auth.secure-stego.duckdns.org` → Auth lifecycle service
- `admin.secure-stego.duckdns.org` → Admin and support operations
- `payments.secure-stego.duckdns.org` → Billing and subscriptions
- `worker.secure-stego.duckdns.org` → Async jobs and queue processing
- `analytics.secure-stego.duckdns.org` → Usage and anomaly analytics
- `staging.secure-stego.duckdns.org` → Staging environment

### Services Directory
- `services/frontend-service/service.ts`
- `services/api-service/service.ts`
- `services/auth-service/service.ts`
- `services/admin-service/service.ts`
- `services/payments-service/service.ts`
- `services/worker-service/service.ts`
- `services/analytics-service/service.ts`

### Key Artifacts
- `ARCHITECTURE_SERVICES.md` - complete enterprise workflows.
- `BUSINESS_LOGIC_RULES.md` - rules matrix for testing scenarios.
- `ATTACK_SURFACE_MAP.md` - vulnerable endpoints and attack vectors.
- `scripts/010_enterprise_services_schema.sql` - base enterprise schema.
- `scripts/011_enterprise_advanced_schema.sql` - expanded advanced schema.
- `deploy/nginx.enterprise.conf` - host-based reverse proxy mapping.

## Training Vulnerability Notice
This repository intentionally includes insecure endpoints and logic flaws for training (IDOR, weak JWT validation, missing auth, race conditions, and cross-tenant data exposure).

⚠️ Never deploy these vulnerable paths in a hardened production system.
