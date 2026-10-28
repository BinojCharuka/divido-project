# Divido

**Status:** In development — product and technical decisions may still be proposed and require owner approval.

Divido is a personal-finance application inspired by the Japanese Kakeibo approach. Its intended MVP helps an individual record income and expenses, plan monthly budgets, review spending, and reflect on financial habits. The exact approved scope is defined in [`docs/01-product/mvp-scope.md`](docs/01-product/mvp-scope.md) and related product documents.

> Do not treat proposed documentation as a frozen specification. Check the status of each requirement and decision before implementation.

## Repository layout

```text
divido/
├── AGENTS.md
├── README.md
├── docs/       # Product, UX, requirements, architecture, API, data, testing and delivery docs
├── frontend/   # Next.js application
└── backend/    # Spring Boot application
```

See [`docs/README.md`](docs/README.md) for the documentation entry point and [`docs/DOCUMENTATION_INDEX.md`](docs/DOCUMENTATION_INDEX.md) for the document register.

## Read this first

1. [`AGENTS.md`](AGENTS.md) — project-wide rules for developers and AI coding agents.
2. [`docs/README.md`](docs/README.md) — how to navigate the documentation.
3. [`docs/DOCUMENTATION_RULES.md`](docs/DOCUMENTATION_RULES.md) — status labels and change-control expectations.
4. [`docs/DOCUMENTATION_INDEX.md`](docs/DOCUMENTATION_INDEX.md) — document inventory and status.
5. [`docs/01-product/mvp-scope.md`](docs/01-product/mvp-scope.md) — proposed MVP scope (not frozen).
6. [`docs/10-phases/README.md`](docs/10-phases/README.md) — proposed implementation phases.
7. [`docs/TRACEABILITY_MATRIX.md`](docs/TRACEABILITY_MATRIX.md) — requirement-to-implementation links.

If a linked file is not present in the repository yet, do not assume its contents; check the index/status register and ask the project owner if it blocks the task.

## Technology overview

The current project notes describe the following stack; verify it against the actual repository and configuration before relying on it:

- **Frontend:** Next.js
- **Backend:** Spring Boot
- **Language/runtime:** Java 21 for the backend
- **Database:** PostgreSQL hosted on Neon
- **Schema migrations:** Flyway

These are project notes, not a substitute for checking the current code, dependency files, environment, or database schema.

## Local development

The exact commands depend on the package scripts, Maven configuration, and environment variables currently in the repository. Inspect the relevant files before running commands.

### Frontend

1. Open a terminal in `frontend/`.
2. Check `package.json` for the package manager and available scripts.
3. Install dependencies using the package manager and lockfile used by the repository.
4. Configure the required local environment variables without committing secrets.
5. Run the development script defined in `package.json`.

### Backend

1. Open a terminal in `backend/`.
2. Check `pom.xml` and the Java version required by the project.
3. Configure the required database and application settings through local environment variables or an untracked local configuration.
4. Confirm the target database and Flyway migration state before starting the application.
5. Run the Maven command supported by the repository, then verify the health endpoint if one is configured.

Do not copy production credentials into source files. Never commit `.env` files, passwords, tokens, or other secrets. The repository's current configuration and the relevant document [`docs/09-release-operations/configuration-and-secrets.md`](docs/09-release-operations/configuration-and-secrets.md) should determine the exact setup.

## Development workflow

- Work from an approved requirement or story with clear acceptance criteria.
- Agree on API contracts before frontend and backend integration.
- Keep database schema changes in new Flyway migrations; never rewrite migrations already applied to a shared database.
- Run relevant tests and report the exact results.
- Update the documentation index and traceability matrix when approved requirements or contracts change.
- Follow the repository's branching and pull-request rules when those documents are available and approved.

## Documentation status

The documentation is authored in numbered folders `docs/00-governance` to `docs/10-phases` and is awaiting owner review. Most decisions are still `PROPOSED` or `OPEN`. Planned files that do not exist are marked `NOT CREATED` in the index. Start with [`docs/DOCUMENTATION_INDEX.md`](docs/DOCUMENTATION_INDEX.md) and do not interpret an example, draft, or planned file as an approved contract.

## Security reminder

Never commit credentials, `.env`, real personal data, or real financial records. If a database credential has been exposed, rotate it and update the local secret configuration safely.
