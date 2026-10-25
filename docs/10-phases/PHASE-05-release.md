# Phase 05 — Release Readiness and Launch

**Status:** Proposed — production release only after owner approval  
**Primary outcome:** Release a verified build with secure configuration, a tested migration/recovery plan, and operational visibility.

## Goal

Ensure the complete MVP is reliable enough for its intended users and the team can detect and respond to issues after launch.

## Entry criteria

- Required MVP phases are complete and integrated.
- Hosting provider, domains/origins, database plan, and deployment topology are known.
- Production security and data-retention policies are approved.
- Release owner and recovery authority are assigned.
- A release candidate can be identified by immutable commit/build.

## Workstreams

### REL-01 — Hosting and configuration
- [ ] Configure frontend and backend environments.
- [ ] Configure HTTPS/TLS and exact allowed origins.
- [ ] Configure session cookie and CSRF behavior for the actual deployment topology.
- [ ] Store secrets in the chosen secure configuration facility.
- [ ] Confirm production database permissions and connection settings.
- [ ] Ensure production secrets are not exposed in browser bundles or logs.

### REL-02 — CI/CD and release process
- [ ] Configure required frontend/backend checks in CI.
- [ ] Build identifiable release artifacts.
- [ ] Define deployment order and migration compatibility.
- [ ] Define approval, rollback, and emergency response roles.
- [ ] Record release notes and known limitations.

### REL-03 — Data recovery and operations
- [ ] Confirm provider backup and restore capabilities.
- [ ] Define recovery point/time objectives appropriate to the product.
- [ ] Run a restore drill in a non-production environment.
- [ ] Configure safe logs and minimum useful monitoring/alerts.
- [ ] Test incident and secret-rotation procedures.
- [ ] Define operational log retention and access.

### QA-01 — Final verification
- [ ] Run full required automated suite.
- [ ] Complete regression checklist.
- [ ] Run critical end-to-end journeys in a release-like environment.
- [ ] Verify authorization, CSRF, user isolation, and error handling.
- [ ] Verify migrations against the supported starting schema.
- [ ] Check responsive/accessibility behavior on agreed devices/viewports.
- [ ] Verify health/readiness and post-deploy smoke tests.

### REL-04 — Launch decision
- [ ] Review P0/P1 defects and documented exceptions.
- [ ] Confirm release checklist is complete.
- [ ] Owner explicitly approves go/no-go.
- [ ] Deploy the identified release.
- [ ] Verify critical paths after deployment.
- [ ] Record outcome, build ID, migration version, and follow-up issues.

## Exit criteria

- [ ] Production configuration is reviewed and secrets are protected.
- [ ] Required test and regression evidence is recorded.
- [ ] Backup/restore strategy is verified, not merely documented.
- [ ] Monitoring and incident response have been exercised where configured.
- [ ] Release owner approves launch.
- [ ] Post-deployment verification passes.
- [ ] Known issues and support ownership are documented.

## Do not launch if

- A critical cross-user data exposure remains.
- Financial calculations are known to be incorrect.
- A migration has an unassessed risk of data loss.
- Production secrets are exposed or shared insecurely.
- There is no credible recovery path for the current release risk.
- Core authentication and transaction journeys fail.
- Release-critical requirements are still ambiguous.

## After launch

- Monitor errors, latency, authentication failures, and database health.
- Triage user-reported issues and security concerns promptly.
- Fix defects with regression tests.
- Avoid deploying unrelated changes while investigating an incident.
- Review the launch and update roadmap priorities based on evidence.
