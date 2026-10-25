# Configuration and Secrets

**Status:** Proposed security baseline — owner approval required  
**Purpose:** Prevent credentials and environment-specific configuration from leaking into source control, client code, logs, or artifacts.

## 1. What counts as a secret?

Examples include:
- database passwords and connection strings containing credentials;
- session signing/encryption secrets and application keys;
- OAuth client secrets or private API keys;
- deployment tokens and cloud credentials;
- SMTP credentials;
- production-only webhook signing secrets.

Treat session cookies, access tokens, CSRF tokens, and recovery tokens as sensitive even when short-lived.

## 2. Rules

1. Never commit secrets to Git.
2. Never place private secrets in frontend variables exposed to the browser (including `NEXT_PUBLIC_*`).
3. Never print passwords, cookies, tokens, or full credential-bearing connection strings to logs.
4. Use separate credentials for local, CI, staging, and production.
5. Give each credential the least privileges it needs.
6. Rotate credentials after suspected or confirmed exposure.
7. Prefer a hosting platform's secret manager or protected CI variables for hosted environments.
8. Use placeholder-only example files such as `.env.example`; never put real values in examples.
9. Restrict production secret access to the minimum number of maintainers.
10. Document secret names and purpose, not their values.

## 3. Repository hygiene

- Confirm `.env`, `.env.*` secret-bearing files, local config, certificates, keys, dumps, and generated artifacts are ignored as appropriate.
- Do not ignore the safe placeholder template if the team uses `.env.example`.
- Review `git status` and staged files before every commit.
- Enable secret scanning if available.
- Remember that removing a leaked value from the latest commit does not revoke it or remove every copy from Git history.

If a secret is exposed:
1. Revoke or rotate it immediately.
2. Check provider access logs for suspicious use where available.
3. Update every environment that used the old value.
4. Remove the secret from active code and follow the repository's history-cleanup process if necessary.
5. Record the incident without copying the secret into the incident notes.

## 4. Configuration inventory

Maintain an inventory table like this, filling in exact property names from the actual codebase.

| Variable/config item | Used by | Secret? | Required in | Notes |
|---|---|---|---|---|
| Database JDBC URL | Backend | Usually non-secret alone; may contain secrets if embedded | All backend environments | Keep credentials separate if supported |
| Database username/password | Backend | Yes | All backend environments | Least-privilege database user |
| Frontend API base URL | Frontend | No, if it contains no credentials | Build/runtime as configured | Public browser-visible value |
| Session secret/key | Backend/hosting | Yes | Hosted backend if required | Generate strong random value |
| Allowed frontend origin(s) | Backend | No | Per environment | Exact origin allowlist |
| CSRF/session settings | Backend/frontend | Depends | Per environment | Verify actual framework configuration |
| Error monitoring DSN | Relevant app | Depends on provider | If enabled | Treat according to provider's exposure model |

This is a template, not a verified list of variables currently implemented.

## 5. Local `.env` and Spring Boot

Do not assume Spring Boot automatically loads a plain shell `.env` file. If the current local workflow uses `source .env`, that exports variables into the shell process; the application then receives them through the process environment. Document and test the actual method.

Keep the file untracked and use placeholders in examples. Confirm `.gitignore` is in place. Never paste a live database password into source files or issue descriptions.

## 6. Browser-visible configuration

Values embedded in a Next.js browser bundle should be treated as public. A user can inspect them.

Allowed examples:
- public API base URL;
- non-sensitive public feature flags.

Never expose:
- database credentials;
- private signing keys;
- session secrets;
- privileged API keys;
- private service endpoints that rely on secrecy for access control.

Security must be enforced on the server, not by hiding a URL or variable.

## 7. Cookies, CORS, and CSRF

If the chosen design uses cookie-based server-side sessions:

- Set `HttpOnly` on session cookies.
- Set `Secure` in HTTPS environments.
- Choose `SameSite` based on the actual frontend/API origin relationship.
- Restrict CORS to known origins.
- Do not use wildcard origins with credentialed requests.
- Require and validate CSRF protection for applicable state-changing requests.
- Test login, logout, session expiry, and CSRF in a real browser after deployment.
- Do not store session IDs in `localStorage`.

Exact settings depend on final topology and framework behavior; verify rather than copying a generic configuration blindly.

## 8. Production access and rotation

- Use individual accounts where possible; avoid shared production credentials.
- Remove access promptly when a developer no longer needs it.
- Rotate credentials on exposure, ownership change, or according to the provider's policy.
- Ensure the old credential is invalidated, not merely replaced in a local file.
- Audit access to production database and deployment secrets where tooling supports it.

## 9. Checklist

- [ ] Secret-bearing local files are ignored.
- [ ] Placeholder examples contain no real secrets.
- [ ] No private values appear in frontend bundles.
- [ ] Production credentials differ from development credentials.
- [ ] Database user privileges are limited.
- [ ] Hosted secrets are stored in a secure configuration facility.
- [ ] Cookie, CORS, and CSRF configuration matches actual origins.
- [ ] Secret scanning and rotation procedure are understood.
