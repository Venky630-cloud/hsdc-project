# Enterprise Services Architecture

This document defines the enterprise microservices topology for HSDC Vault SaaS.

## Service Topology

- **auth-service**: Identity, login, token issuance, MFA, and session hardening.
- **api-service**: Gateway-routed orchestration for tenant and vault API commands.
- **admin-service**: Internal operator and tenant-admin controls protected by RBAC.
- **payments-service**: Billing lifecycle, subscription upgrades, and payment reconciliation.
- **worker-service**: Queue-backed async processing for scans, exports, and notifications.
- **analytics-service**: Event ingestion, aggregation, and operational/business dashboards.

## End-to-End Workflow

1. Client sends request through edge load balancer to API gateway.
2. Gateway forwards authentication calls to **auth-service**.
3. Authenticated access token and org context are attached to downstream calls.
4. **api-service** validates tenant plan and routes request by capability:
   - write path: vault metadata and object-storage coordination,
   - admin path: controlled action request to **admin-service**,
   - billing path: entitlement checks with **payments-service**,
   - async path: enqueue task for **worker-service**.
5. Every service writes immutable audit events to `audit_logs`.
6. Domain events are streamed to **analytics-service** for KPIs and threat analytics.
7. Worker completion status updates API projections for user-facing job visibility.

## Reliability and Security Controls

- Correlation IDs are propagated end-to-end for traceability.
- Idempotency keys are required on mutating endpoints.
- Zero-trust service identity via mTLS and signed service tokens.
- Centralized policy engine for RBAC/ABAC checks.
- Vault data access is tenant-scoped and policy-evaluated.
- Audit logs are append-only and protected against tampering.

## Deployment and Operations

- Each service deploys independently with canary support.
- Horizontal autoscaling configured per queue depth and latency SLAs.
- Circuit breakers and retries isolate downstream failures.
- SLOs monitored for auth latency, API success rate, payment integrity, and worker throughput.
- Disaster recovery: multi-zone Postgres, object storage replication, and replayable event streams.
