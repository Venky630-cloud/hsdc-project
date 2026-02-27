# BUSINESS_LOGIC_RULES

## User Lifecycle Rules
- New users must complete onboarding steps in strict order.
- Trusted device approvals expire and can be manually revoked.
- Recovery chain uses email recovery, backup code, then support approval fallback.
- Password rotation reminder is sent after policy interval.

## Organization & Role Rules
- Role hierarchy: owner > admin > manager > member > auditor.
- Temporary role assignment must include expiry timestamp.
- Department/project vaults inherit policy constraints unless overridden.
- Legal hold blocks delete operations and restore purges.

## Vault Rules
- Upload requires plan entitlement and policy validation.
- File classification defaults to `confidential` unless explicitly set.
- File lock requires approval for unlock in restricted vaults.
- Version history write must append; no destructive edits.

## Billing Rules
- Trial expiry downgrades tenant to free unless invoice paid.
- Seat allocation and release update seat ledger and invoice projections.
- Usage billing considers storage GB and API request counts.
- Refund/dispute flow must preserve immutable invoice references.

## Worker Rules
- High-priority security jobs preempt normal jobs.
- Failed jobs retry with backoff until max attempts.
- Dead-letter queue receives exhausted jobs.
- Worker heartbeat stale threshold triggers alert.

## Analytics Rules
- Tenant dashboards should be tenant-scoped by default.
- Security alerts aggregate suspicious auth + vault events.
- KPI reports include API latency and billing conversion metrics.
