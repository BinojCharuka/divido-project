# Logging and Monitoring

**Status:** Proposed operational baseline — implementation/provider to be confirmed  
**Purpose:** Detect failures and security issues while minimizing exposure of personal financial information.

## 1. Goals

Operations should make it possible to answer:
- Is the frontend reachable?
- Is the backend starting and responding?
- Can the backend reach the database?
- Are errors or latency increasing?
- Are migrations failing?
- Are authentication or authorization failures unusually frequent?
- Did a deployment cause a regression?

Do not add monitoring tools solely because they are listed here. First decide what the hosting provider already supplies and what the MVP needs.

## 2. Log safe events

Useful events include:
- application startup/shutdown and build identifier;
- migration start/success/failure with version;
- health/readiness result;
- request method, route template, status, duration, and correlation ID;
- unexpected exception category;
- login success/failure counts without logging credentials;
- rate-limit or authorization-denial events where useful;
- deployment and configuration-change metadata without secret values.

## 3. Never log

- passwords or password-reset tokens;
- session IDs, cookies, authorization headers, CSRF tokens, API keys;
- database passwords or full credential-bearing connection strings;
- complete transaction descriptions or unnecessary financial payloads;
- personal financial data that is not required for diagnosis;
- full request bodies by default.

Avoid putting user IDs, emails, or transaction IDs in high-cardinality metrics labels. If an identifier is necessary for a restricted audit event, minimize it and apply appropriate retention/access controls.

## 4. Structured logs and correlation

Prefer structured logs with stable fields:
- timestamp and timezone;
- severity;
- service name and environment;
- build/commit identifier;
- route template rather than raw URL with sensitive query parameters;
- HTTP status and duration;
- correlation/request ID;
- safe error code.

Do not accept an arbitrary client-supplied correlation ID without length/format validation; otherwise it can create log injection or oversized entries. Do not return stack traces to users.

## 5. Health and readiness

Separate the meaning of:
- **Liveness:** the process is running and not irrecoverably stuck.
- **Readiness:** the service can safely receive traffic, including required dependencies.
- **Business smoke test:** a critical user journey actually works.

The existing `/api/v1/health` endpoint is reported to work locally, but its exact implementation and semantics must be verified. Do not expose database credentials or detailed infrastructure topology through health responses. A health response alone does not prove login, transaction persistence, or dashboard calculations work.

## 6. Metrics to consider

Start with a small set:
- request count and error rate by route template/status class;
- request latency percentiles;
- backend process restarts and startup failures;
- database connection failures and pool saturation;
- migration failures;
- frontend error rate and failed API requests;
- deployment success/failure;
- disk/memory/CPU metrics if supported by hosting.

Financial amounts, descriptions, or individual transaction details must not be metric labels.

## 7. Alerts

Possible initial alerts, subject to provider capability and owner approval:
- service unavailable or repeated failed health checks;
- sustained increase in 5xx responses;
- database connection failures;
- deployment failure;
- migration failure;
- sudden spike in authentication failures, if safely measured.

Choose thresholds based on a baseline; arbitrary thresholds can create noisy alerts. Every alert should identify an owner and a first response action.

## 8. Error monitoring

If an error-monitoring service is adopted:
- configure data scrubbing before sending events;
- remove cookies, headers, credentials, and financial payloads;
- review source-map and browser-data settings;
- restrict dashboard access;
- define retention and deletion policy;
- verify a synthetic test error to prove the integration works.

Do not claim an error-monitoring integration exists until a test event has been observed and verified.

## 9. Incident response

When a production incident occurs:

1. Record the time, environment, build, symptoms, and impact.
2. Protect users and data first; stop a risky rollout if appropriate.
3. Check recent deployments, health signals, logs, and database/migration status.
4. Avoid posting secrets or personal data in incident chat/issues.
5. Apply the approved rollback or recovery plan.
6. Verify core journeys and data integrity after mitigation.
7. Document root cause, contributing factors, and follow-up actions.
8. Add a regression test for the defect where possible.

For suspected credential exposure, rotate/revoke the secret promptly and inspect access logs where available.

## 10. Retention and access

Define retention periods based on operational needs, legal obligations, provider capability, and privacy expectations. Restrict access to logs and monitoring dashboards. Avoid indefinite retention by default. Document how a user-data deletion request interacts with operational logs, subject to applicable obligations.

## 11. Operational checklist

- [ ] Logs are structured enough to diagnose errors.
- [ ] Secrets and financial payloads are redacted.
- [ ] Health/readiness semantics are documented.
- [ ] Error rates and service availability are visible.
- [ ] Alerts have an owner and response steps.
- [ ] Monitoring access is restricted.
- [ ] Retention is defined.
- [ ] An incident and secret-rotation process exists.
- [ ] A synthetic alert/error has been tested if monitoring is configured.
