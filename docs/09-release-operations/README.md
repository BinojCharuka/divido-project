# Set 9 — Release & Operations

**Status:** Proposed operational guidance — owner approval required  
**Scope:** Local development, test/staging, production configuration, deployment, monitoring, recovery, and release readiness.

## Purpose

This set describes how Divido should be configured, deployed, checked, and supported safely as it moves beyond local development. It is intentionally provider-neutral where the hosting provider or deployment architecture has not yet been confirmed.

## Documents

- [Environment setup](environment-setup.md) — local prerequisites, configuration, database connectivity, and reproducible setup.
- [Deployment plan](deployment-plan.md) — environment promotion, migration order, deployment patterns, and recovery.
- [Configuration and secrets](configuration-and-secrets.md) — environment variables, credentials, cookies, CORS/CSRF, and secret rotation.
- [Logging and monitoring](logging-and-monitoring.md) — operational signals, safe logs, alerts, and incident response.
- [Release checklist](release-checklist.md) — go/no-go checks before and after deployment.

## Related documentation

- [Governance and change control](../00-governance/README.md)
- [Product scope and decisions](../01-product/README.md)
- [Architecture](../04-architecture/README.md)
- [API contracts](../05-api/README.md)
- [Data and migration policy](../06-data/README.md)
- [Development workflow](../07-development/README.md)
- [Testing and QA](../08-testing/README.md)
- [Phase plan](../10-phases/README.md)

## Critical operational principles

1. Never commit credentials or place secrets in source code, screenshots, logs, or issue comments.
2. Separate local, test/staging, and production configuration and data.
3. Use HTTPS in hosted environments; configure cookies, CORS, and CSRF consistently with the real frontend/API origins.
4. Apply database migrations deliberately and verify them before deploying application code that depends on them.
5. A health endpoint does not by itself prove the whole application is ready; verify database connectivity and critical journeys separately.
6. Prefer reversible application releases, but never assume database changes can be rolled back safely.
7. Test restore/recovery procedures before relying on them.
8. Do not claim a deployment, backup, alert, or monitoring integration exists until it has been configured and tested.
9. Keep all proposed provider-specific details provisional until the owner confirms the hosting architecture.

## Provider-specific information still to decide

- Frontend hosting provider and project.
- Backend hosting provider and runtime.
- Production PostgreSQL/Neon plan and backup/restore options.
- Domain names and TLS termination.
- CI/CD platform and required approvals.
- Log/metrics/error-monitoring provider.
- Backup retention and recovery objectives.
- Release approval owner and rollback authority.

Record decisions in `docs/00-governance/decision-log.md` or a relevant ADR before finalizing production instructions.
