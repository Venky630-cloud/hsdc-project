# HSDC Vault SaaS

HSDC Vault is a secure-storage SaaS platform focused on tenant isolation, auditable workflows, and enterprise-grade extensibility.

## Enterprise Architecture Overview

The repository now includes an enterprise service layout under `/services`:

- `auth-service`: identity verification, JWT lifecycle, and MFA checks.
- `api-service`: orchestration layer for tenant-safe API workflows.
- `admin-service`: privileged administrative operations and governance actions.
- `payments-service`: subscription billing and invoice/payment event handling.
- `worker-service`: asynchronous processing for long-running jobs.
- `analytics-service`: event ingestion and cross-tenant observability metrics.

Additional enterprise assets:

- `ARCHITECTURE_SERVICES.md`: full workflow specification across services.
- `scripts/010_enterprise_services_schema.sql`: SQL schema for organizations, subscriptions, shared links, audit logs, and workers.
- `/app/api/v1/vault/*`: includes intentionally vulnerable training endpoints for secure code review practice.

## Local Development

1. Install dependencies: `pnpm install`
2. Start app: `pnpm dev`
3. Open: `http://localhost:3000`

## Security Note

Training endpoints in `app/api/v1/vault` are intentionally insecure and must not be enabled in production.
