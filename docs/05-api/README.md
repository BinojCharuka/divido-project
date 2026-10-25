# Divido API Documentation

**Status:** Proposed contract — review against product decisions and backend implementation before freezing.  
**Set:** 5 — API Documentation  
**Base path:** `/api/v1`

## Purpose

This set is the shared frontend/backend contract. The frontend must not invent endpoints or response shapes; the backend must not silently change this contract without updating the OpenAPI specification, tests, and frontend integration.

## Documents
- [API conventions](api-conventions.md)
- [Authentication API](authentication-api.md)
- [Profile API](profile-api.md)
- [Categories API](categories-api.md)
- [Income sources API](income-sources-api.md)
- [Transactions API](transactions-api.md)
- [Budgets API](budgets-api.md)
- [Dashboard API](dashboard-api.md)
- [Insights API](insights-api.md)
- [Reflections API](reflections-api.md)
- [OpenAPI specification](openapi.yaml)

## Contract status

Every endpoint and schema is a proposal unless already implemented and verified in the current backend. The existing `GET /api/v1/health` endpoint is known to work from project discussion; its exact response shape should be checked in source code.

## Contract rules

- All user-specific operations derive the current user from the authenticated session.
- Do not accept a client-supplied user ID as proof of ownership.
- Use JSON request/response bodies unless the endpoint is explicitly bodyless.
- Use the error conventions in `api-conventions.md`.
- Define validation, pagination, date semantics, and decimal representation before implementation.
- If a behavior is undecided, mark it TBD and do not silently treat it as final.
