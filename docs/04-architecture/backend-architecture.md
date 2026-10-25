# Backend Architecture

**Status:** Proposed — verify against the existing Spring Boot codebase

## 1. Goals

Use a modular Spring Boot application with clear separation between HTTP concerns, business rules, and persistence. Avoid adding layers that only pass data through without a clear reason.

## 2. Suggested package structure

Adapt to current package naming and code; do not duplicate existing classes or create parallel patterns.

```text
backend/src/main/java/<base-package>/
├── config/                  # Security, CORS, Jackson, app configuration
├── common/
│   ├── error/               # Error response and exception mapping
│   ├── web/                 # Shared web utilities
│   └── validation/
├── auth/
│   ├── controller/
│   ├── service/
│   ├── dto/
│   └── model/
├── user/
├── category/
├── income/
├── transaction/
├── budget/
├── dashboard/
├── insight/
└── reflection/
```

A feature can use controller/service/repository/entity/dto folders as appropriate. Prefer feature-oriented packages over one enormous global `controller`, `service`, and `repository` package if that matches the current codebase.

## 3. Request handling layers

- **Controller:** HTTP binding, request validation trigger, status code, response DTO.
- **Service/domain:** business rules, authenticated user context, transaction boundaries, calculations.
- **Repository:** database access scoped to the relevant user where practical.
- **Entity/model:** persistence representation; never expose JPA entities directly as public API contracts.
- **DTO:** explicit request and response shape.
- **Exception handler:** stable, safe error mapping.

## 4. Transaction boundaries

Use database transactions for operations that must succeed or fail together, such as saving a transaction and any associated data that is required by the domain. Do not wrap unrelated remote calls in long database transactions.

## 5. Authorization pattern

- Resolve authenticated user identity from Spring Security/session context.
- Pass that identity into service methods or a trusted current-user abstraction.
- Scope queries by user ID and record ID.
- For nested resources, verify ownership of both parent and child.
- Do not trust a user ID in request JSON as authority.
- Add tests for attempts to read/update/delete another user's records.

## 6. Validation

- Validate shape and basic constraints at the request DTO boundary.
- Validate domain conditions in the service layer (e.g. category is active and usable by the current user).
- Enforce database constraints as a final integrity layer where possible.
- Return field-level errors with stable field names.
- Do not return raw database constraint names or stack traces.

## 7. Financial calculations

- Use `BigDecimal` for money and explicit rounding/scale policy.
- Do not use `double`/`float` for authoritative monetary calculations.
- Define calculation methods once and reuse them across dashboard/budget/insights.
- Ensure all queries use consistent user, period, category/group, and deletion filters.
- Test boundary cases: zero values, very large values, month boundaries, edits, deletions/restores, and group mapping changes.

## 8. Persistence and migrations

- PostgreSQL is the target relational database.
- Flyway migration files are append-only after application to a shared environment.
- Do not edit the already-applied `V1__init.sql`; create a new versioned migration.
- Use foreign keys, unique constraints, check constraints, and indexes intentionally.
- Ensure indexes support user-scoped queries and common month/date filters.
- Do not use Hibernate schema auto-update as a substitute for Flyway in shared/staging/production environments.

## 9. Session and security framework

A server-side session with an HttpOnly cookie is proposed. Spring Session JDBC may be suitable, but exact compatibility with the current Spring Boot version and dependencies must be verified in `pom.xml` before adoption. Do not assume a specific version or add a dependency blindly.

CSRF behavior, cookie flags, CORS, session expiry, and reverse-proxy settings must be tested in the actual deployment topology.

## 10. Testing expectations

- Unit tests for domain calculations and validators.
- Repository tests for user scoping and query behavior.
- Integration tests for controllers, security, CSRF, session expiry, and error responses.
- Migration tests against PostgreSQL-compatible infrastructure.
- No test should depend on production secrets or mutable production data.
