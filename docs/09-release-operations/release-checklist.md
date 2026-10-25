# Release Checklist

**Status:** Proposed go/no-go checklist — adapt to the actual release process  
**Use:** Run before a production release and after deployment. Mark each applicable item Pass, Fail, Blocked, or N/A; never mark untested items as Pass.

## 1. Release metadata

| Field | Value |
|---|---|
| Release/version tag | |
| Commit SHA | |
| Date/time and timezone | |
| Release owner | |
| Frontend artifact/build | |
| Backend artifact/build | |
| Database migration version | |
| Target environment | |
| Planned deployment window | |
| Recovery/rollback owner | |

## 2. Scope and approvals

- [ ] Included changes are linked to issues and approved requirements.
- [ ] Known limitations and follow-up issues are documented.
- [ ] Product decisions required for this release are approved.
- [ ] Pull requests have the required review.
- [ ] Release owner has approved the go/no-go decision.
- [ ] No unreviewed change is being added directly to the release.

## 3. Build and test

- [ ] Frontend lint/typecheck/tests pass where configured.
- [ ] Frontend production build succeeds.
- [ ] Backend compile and unit tests pass.
- [ ] Required integration/API tests pass.
- [ ] Security and cross-user isolation tests pass for relevant areas.
- [ ] OpenAPI contract is valid and matches implementation.
- [ ] Regression checklist is completed.
- [ ] Critical end-to-end user journeys pass in a release-like environment.
- [ ] Test results are recorded with build/commit identity.
- [ ] No unresolved release-blocking defect remains, or the owner has documented an explicit exception and risk acceptance.

## 4. Configuration and secrets

- [ ] Production configuration is verified without exposing secret values.
- [ ] Secrets are stored in the approved secret/configuration facility.
- [ ] No secrets are committed or embedded in browser bundles.
- [ ] Database points to the intended production environment.
- [ ] CORS, cookie, HTTPS, and CSRF settings match actual origins.
- [ ] Logs and error reporting redact sensitive information.
- [ ] Required credentials and access are available to authorized release personnel only.

## 5. Database and migration

- [ ] Migration diff reviewed.
- [ ] Migration tested from the supported starting schema.
- [ ] Applied migrations were not edited.
- [ ] Migration order and application compatibility are documented.
- [ ] Backup/restore capability and latest successful backup status verified according to provider.
- [ ] Destructive or long-running data changes have an approved plan.
- [ ] Rollback/recovery limitations are understood.
- [ ] No migration will accidentally target a development or unrelated database.

## 6. Deployment readiness

- [ ] Exact artifacts/commit are identified.
- [ ] Deployment order is documented.
- [ ] Expected downtime/session effects are understood.
- [ ] Health/readiness checks are available and their meanings are known.
- [ ] Monitoring and logs are accessible to the release owner.
- [ ] Recovery steps and decision authority are clear.
- [ ] Relevant stakeholders/users will be informed if necessary.

## 7. Go/no-go decision

**Go only when** required checks pass, the target environment is correct, the migration plan is safe, and the release owner accepts the documented residual risk.

- [ ] GO
- [ ] NO-GO
- [ ] Conditional approval — attach owner, risk, mitigation, and deadline.

Decision and rationale:

## 8. Post-deployment verification

- [ ] Deployed commit/build matches the release record.
- [ ] Backend health/readiness responds as expected.
- [ ] Database connectivity and migration version are correct.
- [ ] Frontend loads and reaches the correct API.
- [ ] Login/logout and protected routes work.
- [ ] A safe synthetic critical journey passes where appropriate.
- [ ] Transaction create/list behavior works without using real user data.
- [ ] Dashboard/aggregate smoke check matches expected synthetic values where appropriate.
- [ ] Error rates and logs show no unexpected regression.
- [ ] No secret appears in browser responses, logs, or public artifacts.
- [ ] Release record is complete and issues are filed for any defects.

## 9. If deployment fails

- [ ] Stop further rollout if possible.
- [ ] Identify whether the failure is application, configuration, database, or external dependency.
- [ ] Follow the approved recovery plan; do not blindly reverse data migrations.
- [ ] Verify data integrity after mitigation.
- [ ] Confirm authentication and core journeys after recovery.
- [ ] Record incident timeline and follow-up work.
- [ ] Add regression coverage where appropriate.

## 10. Final record

| Field | Value |
|---|---|
| Outcome | Success / Recovered / Aborted |
| Actual deployment time | |
| Post-deploy test result | |
| Incident/issue links | |
| Recovery performed | |
| Follow-up owner and due date | |
| Approver | |
