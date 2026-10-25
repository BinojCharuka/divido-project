# Divido Project Principles

**Status:** PROPOSED

## Purpose

These principles guide product decisions and implementation. They do not replace the detailed requirements or security design.

## Product principles

1. **Fast daily use:** recording an ordinary expense should require minimal effort.
2. **Clarity over complexity:** show understandable money summaries and explain calculations.
3. **Kakeibo-inspired planning:** use Needs, Wants, Culture, and Unexpected as the four top-level budget groups.
4. **No invented financial facts:** insights must be based on stored records and clearly identify estimates.
5. **User control:** users can review, edit, and correct their records.
6. **Privacy by default:** personal finance records are private to the account owner.
7. **Mobile usability:** core transaction and budget flows must work on mobile layouts.
8. **Incremental delivery:** build, test, and review vertical slices rather than writing the entire application at once.

## Engineering principles

- Keep frontend and backend responsibilities separate and connected through documented API contracts.
- Use server-side validation even when the frontend validates inputs.
- Store money using exact decimal types: PostgreSQL `NUMERIC` and Java `BigDecimal`.
- Use Flyway for database schema changes.
- Never rewrite an applied shared migration.
- Hash passwords with a suitable adaptive password-hashing algorithm through a maintained security library; never encrypt or store passwords as plaintext.
- Authorize every access to user-owned data on the backend.
- Keep secrets out of source control.
- Make errors actionable without exposing sensitive details.
- Write automated tests for acceptance criteria and security-sensitive behaviour.

## Collaboration principles

- One user story should have a clear owner and stable ID.
- Frontend and backend developers agree on the contract before integration.
- Every pull request references its story and demonstrates tests.
- Do not merge incomplete or unreviewed contract changes into the main branch.
- When uncertain, record an open question instead of silently making a product decision.
