# Branching Strategy

**Status:** Proposed — owner approval required  
**Model:** Lightweight short-lived feature branches for a two-developer team.

## 1. Branches

- `main` — the stable shared branch; should remain buildable.
- `feature/<issue-number>-<short-name>` — new functionality.
- `fix/<issue-number>-<short-name>` — bug fix.
- `docs/<issue-number>-<short-name>` — documentation-only change.
- `chore/<issue-number>-<short-name>` — tooling, dependency, or maintenance task.

Examples:

```text
feature/24-expense-entry
fix/31-month-total-rounding
docs/18-api-error-contract
chore/12-backend-ci
```

Use the actual issue number. Keep names short and descriptive.

## 2. Branch rules

- Branch from the latest `main`.
- Keep branches short-lived and focused.
- Do not commit directly to `main` for normal feature work.
- Push early enough to make collaboration and backup possible.
- Open a draft PR if early feedback will prevent rework.
- Bring the latest `main` into the branch before merge and rerun relevant checks.
- Delete the branch after merge unless it is needed for a specific reason.

## 3. Release branch policy

Do not create long-lived `develop`, `staging`, or `release/*` branches unless deployment needs justify them. For a small team, short-lived branches reduce merge overhead.

If a release branch is introduced later, document:

- What can be merged into it.
- Who approves release fixes.
- How migrations are tested.
- How fixes are back-ported.
- How the release is tagged and deployed.

## 4. Hotfixes

For a production-critical fix:

1. Create a `fix/...` branch from the deployed version or latest stable `main`, depending on the release process.
2. Add a regression test where possible.
3. Review the risk and migration impact.
4. Merge through the normal PR path unless emergency policy explicitly permits otherwise.
5. Deploy and verify.
6. Ensure the fix is also present in the ongoing development line.

The project owner should define what qualifies as an emergency bypass. Do not invent one during an incident.

## 5. Database migration coordination

- Each migration needs a unique, ordered version.
- Before creating a migration, inspect merged and open PRs for reserved versions.
- Do not edit a migration that has already been applied in a shared environment.
- If two branches need migrations, coordinate the final sequence and renumber only unapplied migrations before they become shared/applied.
- Test the final combined migration sequence.

## 6. Example workflow

```bash
git checkout main
git pull --ff-only
git checkout -b feature/24-expense-entry

# make changes, add tests, then:
git status
git diff --check
git add <specific-files>
git commit -m "feat(transactions): add expense creation"
git push -u origin feature/24-expense-entry
```

Open a PR on GitHub, request review, address comments, and merge only after required checks pass. Replace `<specific-files>` with the intended paths; avoid blindly staging secrets or unrelated files.

## 7. Why not Git Flow by default?

A two-person MVP team usually benefits from fewer long-lived branches and less merge ceremony. Revisit this strategy if multiple production versions, parallel release trains, or formal release approvals become necessary.
