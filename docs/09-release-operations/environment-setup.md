# Environment Setup

**Status:** Proposed — verify against the actual repository and hosting choices  
**Purpose:** Make local development reproducible and reduce environment-specific failures.

## 1. Environment separation

Maintain separate configuration and data for:

- **Local development:** developer-owned credentials and synthetic data.
- **Test/CI:** disposable or isolated test database and synthetic fixtures.
- **Staging (recommended):** production-like configuration for integration and release checks.
- **Production:** real users and data; access limited to authorized maintainers.

Never point automated tests at production. Do not reuse production credentials in local development.

## 2. Prerequisites

Verify exact versions in the repository before publishing a final setup guide. Current project assumptions are:

- Java 21 and Maven for Spring Boot.
- Node.js and the package manager selected by the frontend lockfile for Next.js.
- PostgreSQL-compatible database access.
- Git and access to the repository.
- Required environment variables supplied securely.

Do not install an arbitrary package manager or upgrade framework versions solely to match this document. Check the actual `pom.xml`, frontend `package.json`, lockfile, and CI configuration.

## 3. Clean checkout setup

Suggested process:

1. Clone the repository.
2. Read root `README.md` and `AGENTS.md`, then the relevant docs.
3. Install the documented Java, Node.js, and package-manager versions.
4. Create local configuration from a checked-in example file containing placeholder values only.
5. Supply database credentials and other secrets through a local untracked environment file or secure environment configuration.
6. Start the database connection target or local PostgreSQL service.
7. Start the backend and verify the documented health endpoint.
8. Start the frontend and verify a basic page loads.
9. Run the documented tests.
10. Record any setup step that required undocumented intervention and update the docs.

## 4. Configuration conventions

Use clear, environment-specific names. Example names below are illustrative and must be aligned to actual application properties:

```text
# Backend examples — placeholders only
SPRING_PROFILES_ACTIVE=local
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/divido
SPRING_DATASOURCE_USERNAME=<local_database_user>
SPRING_DATASOURCE_PASSWORD=<local_database_password>

# Frontend example — only if the project uses this convention
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

Never commit real values. `NEXT_PUBLIC_` variables are exposed to browser code; never put passwords, private API keys, database URLs with credentials, or session secrets in them.

Do not assume Spring Boot automatically reads a shell `.env` file. Use the repository's documented method for exporting variables or configuring the runtime. If a local shell workflow requires sourcing `.env`, document that exact workflow and ensure the file is ignored by Git.

## 5. Database setup and migration

- Verify the intended database host and database name before running migrations.
- Confirm the target is local/test/staging, not production.
- Inspect Flyway history and current schema before making changes.
- Run migrations using the configured application/Flyway workflow.
- Do not manually edit the schema to make an application error disappear.
- Do not edit a migration that has already been applied in a shared environment; create a new migration.
- Use only synthetic test data in seed scripts.

## 6. Local run commands

Verified on 2026-11-18 (DIV-022/023/029/035). The step-by-step commands are in the repository [README](../../README.md#local-development). In short:

| Part | How it runs |
|---|---|
| PostgreSQL 18 and Mailpit | `compose.yaml` at the repository root: `docker compose up -d`, with the database password in the root `.env` (template `.env.example`). The database listens on `127.0.0.1:5435`. Mailpit's SMTP is on `127.0.0.1:1025`; its inbox at http://localhost:8025 shows password reset emails. |
| Backend | From `backend/`: copy `.env.example` to `.env.local`, load it with `set -a && . ./.env.local && set +a`, then `./mvnw spring-boot:run`. Flyway migrates the local database on startup. |
| Frontend | From `frontend/`: `npm ci`, copy `.env.example` to `.env.local` (`NEXT_PUBLIC_API_BASE_URL=http://localhost:8080`), then `npm run dev`. |

Use `backend/.env.local` rather than `backend/.env` for the local settings, so a local run can never pick up settings meant for another environment by mistake. All `.env*` files except the `.env.example` templates are git-ignored.

### Backend tests (verified in DIV-003)

```bash
# From backend/; requires a running Docker daemon
./mvnw test
```

Spring context tests run against a disposable PostgreSQL container (Testcontainers, `postgres:18-alpine`) that Flyway migrates from scratch. They never use `.env` or the shared development database:

- every Spring test imports `TestcontainersConfiguration` (service connection for the datasource and Flyway);
- `src/test/resources/config/application.properties` replaces the `${DB_URL}` placeholder with an unresolvable host, so a test that is missing the import fails instead of connecting elsewhere;
- Surefire strips `DB_*`, `SPRING_DATASOURCE_*` and `SPRING_FLYWAY_*` environment variables;
- `TestDatabaseIsolationTest` checks that the datasource and Flyway point at the container.

If Docker is unavailable the tests fail. Do not point them at a shared database as a workaround.

## 7. Connectivity and CORS

- Confirm the frontend origin and backend origin for each environment.
- Configure CORS for only the required origins.
- If using cookie-based sessions across origins, verify credentials, `SameSite`, `Secure`, and CSRF behavior in a real browser.
- Do not use wildcard origins with credentialed requests.
- Test the actual deployed origin pair, not just localhost.

## 8. Environment health checklist

- [ ] Correct Java and Node versions.
- [ ] Correct package manager and lockfile.
- [ ] Required environment variables present and validated.
- [ ] No secrets committed.
- [ ] Database points to the intended environment.
- [ ] Flyway state and schema are understood.
- [ ] Backend health endpoint responds as documented.
- [ ] Frontend can reach backend.
- [ ] Authentication and CSRF flow works in the browser.
- [ ] Tests run with synthetic data.
- [ ] Setup steps are reproducible by the other developer.
