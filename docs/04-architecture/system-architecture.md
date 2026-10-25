# System Architecture

**Status:** Proposed — repository verification and owner approval required

## 1. System context

```text
User's browser
    |
    | HTTPS
    v
Next.js frontend
    |
    | JSON over HTTPS; session cookie
    v
Spring Boot REST API
    |
    | JDBC / JPA, parameterized access
    v
PostgreSQL (Neon)
```

The frontend and backend may be deployed separately or behind one domain. The production topology must be decided because it affects cookie scope, CSRF, CORS, proxy headers, and redirect behavior.

## 2. Main components

### Next.js frontend
Responsibilities:
- Render pages, navigation, forms, and responsive UI.
- Perform immediate validation for usability.
- Call documented API endpoints through a centralized API client.
- Present loading, empty, success, validation, and error states.
- Format money and dates consistently.
- Never be the authority for authorization or persisted financial calculations.
- Never embed database credentials or server-only secrets in browser code.

### Spring Boot backend
Responsibilities:
- Authenticate requests and manage server-side sessions.
- Enforce authorization and per-user data isolation.
- Validate request data.
- Implement business rules and authoritative calculations.
- Coordinate persistence through repository/data-access code.
- Return documented response/error contracts.
- Emit safe operational logs.
- Own database migrations and schema compatibility.

### PostgreSQL
Responsibilities:
- Persist users, preferences, categories, income sources, transactions, monthly plans, and any approved insights/reflections.
- Enforce appropriate constraints and indexes.
- Support reliable transactions and migrations.
- Avoid storing session or financial information in undocumented structures.

### Flyway
Responsibilities:
- Apply ordered, versioned schema changes.
- Preserve migration history.
- Never modify a migration that has been applied in a shared or deployed environment; create a new migration.

## 3. Request lifecycle

1. User action triggers a frontend request.
2. Frontend API client attaches credentials according to the approved same-site/cross-site topology and handles CSRF token requirements.
3. Spring Security authenticates the session.
4. Controller parses and validates request shape.
5. Service enforces domain/business rules and authorization.
6. Repository reads/writes the database.
7. Backend returns a documented success or error response.
8. Frontend updates the UI only after a confirmed response.

Controllers should remain thin. Business rules should not be duplicated across controllers or hidden in UI components.

## 4. Deployment topology decision

Choose one before production:
- **Option A: same origin/reverse proxy** — frontend and `/api` share a site/origin. This often simplifies cookie and CORS policy.
- **Option B: separate frontend and API origins** — requires carefully configured credentialed requests, exact CORS allowlist, cookie domain/SameSite/Secure settings, and CSRF strategy.

Do not use wildcard CORS origins with credentials. Do not weaken cookie protections just to make local development work.

## 5. Environments

- Local development
- Automated test/CI
- Staging or preview
- Production

Each environment must have separate credentials and explicit configuration. Never use production data casually in local development. Prefer synthetic test data.

## 6. Architectural constraints

- Modular monolith first; no microservices for MVP.
- REST/JSON API under `/api/v1`.
- PostgreSQL is the source of truth.
- Flyway owns schema evolution.
- All personal data access is user-scoped.
- Money calculations use decimal-safe types.
- No bank synchronization, payment execution, or account-balance tracking in MVP.
- Architecture changes require an ADR and update to related docs.

## 7. Architecture diagram maintenance

When implementation changes the component boundaries or deployment topology, update this diagram and ADRs in the same pull request.
