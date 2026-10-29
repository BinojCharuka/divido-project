# Divido frontend

Next.js (App Router, `cacheComponents` enabled) frontend for Divido. The API contract is in [`docs/05-api/authentication-api.md`](../docs/05-api/authentication-api.md).

## Run locally

The backend runs on `http://localhost:8080` and the frontend on `http://localhost:3000`. These are different origins, so the backend must be started for local HTTP with this origin allowed:

```bash
# backend, with your local database settings (DB_URL, DB_USERNAME, DB_PASSWORD)
SESSION_COOKIE_SECURE=false DIVIDO_CORS_ALLOWED_ORIGINS=http://localhost:3000 ./mvnw spring-boot:run
```

```bash
# frontend
npm install
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080 npm run dev
```

`NEXT_PUBLIC_API_BASE_URL` is built into the browser bundle. Leave it empty when the API is served from the same origin as the frontend. Never put secrets in a `NEXT_PUBLIC_` variable.

## Authentication

- `lib/api/client.ts` is the only code that calls the API. It sends cookies (`credentials: "include"`), adds the masked CSRF token from `GET /api/v1/auth/csrf` in the `X-XSRF-TOKEN` header of every state-changing request, retries once after `403 CSRF_INVALID`, and turns error responses into `ApiError`.
- `lib/auth/AuthProvider.tsx` learns the session from `GET /api/v1/auth/me` on start-up. A `401 UNAUTHENTICATED` from any request ends the session in the UI.
- The session and CSRF cookies are `HttpOnly`. Nothing reads them, and nothing is stored in `localStorage` or `sessionStorage`.
- Registration does not sign the user in (`DEC-025`); it goes to `/sign-in?notice=registered`.
- Sign-out and an ended session reload `/sign-in` with a full page load. With `cacheComponents`, Next.js keeps recently visited routes mounted but hidden, so a client-side navigation would keep the previous user's data in memory. Sign-in and sign-up forms also clear the password when hidden.
- `/onboarding` is a placeholder signed-in page until onboarding is specified.
- Route guards (`components/auth/SessionGate.tsx`) only steer navigation. The backend enforces authentication on every request.

## Checks

```bash
npm run lint
npm run typecheck
npm test          # Vitest + React Testing Library, against an in-memory fake API
npm run build
```

## End-to-end tests

`npm run test:e2e` runs Playwright in Chromium against a running backend at `E2E_API_BASE_URL` (default `http://localhost:8080`); it builds and starts the frontend on port 3000 itself. Use a disposable local database, never a shared or production one. For example:

```bash
docker run -d --name divido-e2e-db -e POSTGRES_DB=divido_e2e -e POSTGRES_USER=divido_e2e \
  -e POSTGRES_PASSWORD=divido_e2e -p 127.0.0.1:55432:5432 postgres:18-alpine

# in backend/
DB_URL=jdbc:postgresql://127.0.0.1:55432/divido_e2e DB_USERNAME=divido_e2e DB_PASSWORD=divido_e2e \
  SESSION_COOKIE_SECURE=false DIVIDO_CORS_ALLOWED_ORIGINS=http://localhost:3000 ./mvnw spring-boot:run

# in frontend/ (first run: npx playwright install chromium)
npm run test:e2e

docker rm -f divido-e2e-db
```

The tests create synthetic `@example.com` accounts.
