# GitHub Workflow

**Status:** Proposed — owner approval required  
**Goal:** Make every change traceable, reviewable, and recoverable.

## 1. Repository hygiene

- Keep `frontend/`, `backend/`, and `docs/` in the agreed repository structure unless the owner approves a change.
- Commit source, tests, migrations, and documentation; do not commit credentials, session data, personal financial data, build outputs, or dependency caches.
- Keep `.gitignore` aligned with the actual toolchains and local secret files.
- Protect the default branch from direct pushes if repository settings allow.
- Require pull requests for changes to shared code, API contracts, schema, security, and release configuration.

## 2. Issue-first work

Create an issue before substantial implementation. A good issue includes:

- Short, outcome-oriented title.
- User story or technical purpose.
- Scope and explicit non-goals.
- Acceptance criteria.
- Links to use case, requirement, API, data model, and phase.
- Dependencies and open decisions.
- Owner and priority.
- Test approach.

Use [the issue template](issue-template.md). For tiny typo fixes, an issue may be optional if the team explicitly agrees.

## 3. Labels

Suggested labels:

- `type:feature`
- `type:bug`
- `type:tech-debt`
- `type:docs`
- `area:frontend`
- `area:backend`
- `area:database`
- `area:api`
- `area:security`
- `priority:p0`, `priority:p1`, `priority:p2`, `priority:p3`
- `status:blocked`
- `needs:decision`

Use a smaller set if label maintenance becomes overhead. Avoid having multiple competing labels that mean the same thing.

## 4. Commit messages

Prefer small commits with a clear imperative subject. A lightweight convention is:

```text
feat(transactions): add expense creation
fix(auth): reject invalid session
docs(api): clarify validation errors
test(budget): cover month boundary
chore(ci): add backend test job
```

This convention is proposed; consistency matters more than strict adherence to a particular tool. Avoid messages such as `update`, `changes`, or `final fix`.

## 5. Pull requests

- Use [the PR template](pull-request-template.md).
- Link the issue, preferably with `Closes #123` when merging should close it.
- Keep one PR focused on one outcome.
- Include migrations and API contract updates when the feature requires them.
- Add tests and report the commands actually run.
- Provide screenshots or a short recording for meaningful UI changes, using synthetic data.
- Identify breaking changes, migration concerns, security implications, and deployment order.
- Do not mark checks complete unless they were run.

## 6. Review expectations

Reviewers should check:

- Does the implementation satisfy the acceptance criteria?
- Are user ownership and authorization enforced server-side?
- Is validation correct at both API and database boundaries where appropriate?
- Does the frontend handle empty/loading/error states?
- Does OpenAPI match actual behavior?
- Are migrations safe and ordered?
- Are tests meaningful and stable?
- Are secrets or sensitive values exposed in logs, screenshots, fixtures, or errors?
- Is the change smaller and clearer than reasonable alternatives?
- Are documentation and traceability updated?

Review comments should distinguish blocking issues from suggestions. The author should respond to every blocking comment and resolve it before merge.

## 7. CI and merge gate

Recommended checks as the project grows:

- Frontend install, lint, typecheck, unit tests, and production build.
- Backend compile, unit tests, integration tests, and static checks where configured.
- OpenAPI validation or contract checks.
- Migration verification against a disposable/test database.
- Secret scanning and dependency/security checks if available.

Do not claim CI is configured until the repository actually contains and passes those workflows. Required checks should pass before merge.

## 8. Merge strategy

Choose one merge strategy in repository settings. **Squash merge** is a reasonable default for a small team because it keeps the default branch history focused. If chosen:

- Use a meaningful final commit title.
- Keep the PR description informative because individual branch commits may be squashed.
- Delete merged branches when safe.

Do not rewrite shared branches after another developer has based work on them.

## 9. Conflicts and shared files

If both developers need to change `openapi.yaml`, migration files, security config, or shared types:

1. Agree who owns the contract or file for this change.
2. Communicate before editing.
3. Keep changes small and rebase/merge the latest default branch into the feature branch as appropriate.
4. Resolve conflicts semantically, not by blindly accepting one side.
5. Run tests after conflict resolution.

Migration version numbers must be coordinated to avoid duplicate versions.

## 10. Secrets and incidents

- Never paste secrets into issues or PR descriptions.
- If a credential is exposed, treat it as compromised: rotate/revoke it, inspect recent use, and remove it from active configuration. Deleting a commit alone does not make a leaked secret safe.
- Do not include personal finance records in screenshots or logs.
- Follow the security incident procedure defined by the project owner.

## 11. Documentation changes

Update relevant docs in the same PR when behavior or contracts change. If an implementation intentionally differs from proposed docs, get approval and update the docs rather than leaving conflicting sources of truth.
