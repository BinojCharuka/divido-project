# Phase 04 — Decision Summary

**Status:** PROPOSED — none of these decisions is approved. Approval requires the project owner's explicit choice, recorded with date and approver in the [decision log](../00-governance/decision-log.md).
**Last updated:** 2026-11-05
**Applies to:** DIV-027 (Spending Insights), DIV-028 (Monthly Reflection)

The "Recommended" lines are proposals from the Phase 04 audit. They are not approvals.

## What each feature needs

| Feature | Blocked until |
|---|---|
| DIV-027 Spending Insights | DEC-030, DEC-031, DEC-032, DEC-033, DEC-041 and existing DEC-004, DEC-011 are decided |
| DIV-028 Monthly Reflection | DEC-030, DEC-034, DEC-035, DEC-036, DEC-038, DEC-039, DEC-040 are decided **and** DIV-036 is completed and verified. V6 must not be written before then |
| Copy for both features | DEC-042 |

Existing proposed decisions these features rely on: `DEC-004` (the four groups, used by every insight), `DEC-011` (90 days, three distinct spending days), `DEC-005`, `DEC-008` and `DEC-020` (no account balances; savings target; planned and actual income).

---

## DEC-029 — Production UI direction
- **Proposed behavior:** Keep the Figma visual design (shell, tokens, theme). Production routes mount tested, API-backed feature components. `FigmaApp` is a development-only reference.
- **Reason:** Commit `5f5f435` mounted the prototype on production routes, where it calculates money in the browser and reports failed saves as successes. PR #23 implements this direction and is awaiting review.
- **Alternatives:** (a) Rebuild `FigmaApp` to be API-backed in place: a single 4,000-line untested component with high regression risk. (b) Restore the older plain shell: discards recent design work.
- **User impact:** Correct figures and honest errors. Page interiors aren't pixel-identical to the prototype until restyled.
- **Data/privacy impact:** Removes financial data from browser storage; restores session gating.
- **Migration impact:** None.
- **Recommended:** Keep the design, use real components. Needs agreement with the other developer.
- **Owner approval:** PENDING

## DEC-030 — MVP inclusion of Insights and Reflection
- **Proposed behavior:** Both features are in the MVP.
- **Reason:** `mvp-scope.md` lists them and requirements say "Must", but user stories say "P1 — confirm MVP inclusion", the tracker says P2 and `DECISION_REQUIRED`, and all those statuses are `PROPOSED`.
- **Alternatives:** Include one; defer both to after release.
- **User impact:** Adds reflection and spending understanding, the product's mindful-finance purpose.
- **Data/privacy impact:** Reflections add sensitive free text to what is stored.
- **Migration impact:** Reflection requires V6 (see DEC-036). Insights requires none.
- **Recommended:** Include both, and set priorities to match.
- **Owner approval:** PENDING

## DEC-031 — Insight observation types and thresholds
- **Proposed behavior:** Only these, as deterministic templates from server-computed facts:
  - `LARGEST_GROUP`: at least 3 distinct spending days in the month.
  - `GROUP_OVER_PLAN`: a plan exists, the group budget is above 0, and spending is above it.
  - `MONTH_CHANGE`: at least 3 distinct spending days in both compared ranges.
  - `REPEATED_CATEGORY`: a category on at least 3 distinct days within the lookback, reported as a count and dates, with no "regular" or "habit" label.
- **Reason:** BR-026 says three days isn't a full habit definition, and no regularity algorithm is approved. These report what happened without claiming a pattern.
- **Alternatives:** Define a regularity algorithm now; launch with figures and no observations.
- **User impact:** Factual statements that appear only with enough evidence.
- **Data/privacy impact:** Derived on request from the user's own records. Nothing stored. Descriptions and payment methods unused.
- **Migration impact:** None.
- **Recommended:** Approve these four. Exclude predictions, scores, advice and causal claims.
- **Owner approval:** PENDING

## DEC-032 — Lookback boundaries (refines DEC-011)
- **Proposed behavior:** 90 calendar days inclusive, ending on the earlier of today or the selected month's last day. "Today" uses the user's stored timezone (default `Asia/Colombo`). Transaction dates are not shifted.
- **Reason:** BR-025 leaves boundaries and timezone undefined; this follows the `DEC-028` month policy.
- **Alternatives:** Three calendar months; a lookback that ignores the selected month.
- **User impact:** A stated, predictable period.
- **Data/privacy impact:** None.
- **Migration impact:** None.
- **Recommended:** As proposed.
- **Owner approval:** PENDING

## DEC-033 — Insights API shape
- **Proposed behavior:** `GET /api/v1/insights?month=YYYY-MM`, replacing the proposed `from`/`to`. No user-selected ranges in MVP. Computed on request.
- **Reason:** Summaries, budgets and comparisons are monthly, and a free date range has no budget to compare with. The prototype's selector changed only a label.
- **Alternatives:** Keep `from`/`to`; two endpoints.
- **User impact:** Month navigation matching Budget and Dashboard.
- **Data/privacy impact:** None.
- **Migration impact:** None.
- **Recommended:** As proposed.
- **Owner approval:** PENDING

## DEC-034 — Reflection questions
- **Proposed behavior:** Version 1 question set, all optional:
  - `what-went-well`: "What went well with your money this month?"
  - `what-felt-difficult`: "What felt difficult or surprising?"
  - `what-to-change`: "What would you like to change next month?"
- **Reason:** The wireframes label these "sample questions only" and require approval.
- **Alternatives:** Traditional four-part Kakeibo questions; different wording.
- **User impact:** Sets the tone of the feature.
- **Data/privacy impact:** Prompts invite personal content.
- **Migration impact:** `question_set_version` allows later changes without rewriting answers.
- **Recommended:** Approve or edit the wording.
- **Owner approval:** PENDING

## DEC-035 — Maximum answer length
- **Proposed behavior:** 2,000 characters per answer, in both API and UI.
- **Reason:** OpenAPI says 5,000, the prototype says 1,000, and `reflections-api.md` requires a defined limit. Long enough for reflection while limiting stored sensitive text. OpenAPI stays at 5,000 until this is decided.
- **Alternatives:** 1,000; 5,000.
- **User impact:** A visible character count.
- **Data/privacy impact:** Less stored free text.
- **Migration impact:** None if enforced in the service.
- **Recommended:** 2,000.
- **Owner approval:** PENDING

## DEC-036 — Legacy `monthly_reflections` table
- **Proposed behavior:** New table `reflections` in V6. The legacy table stays untouched. Whether to convert its one known row is decided only after a read-only inspection of its structure and content.
- **Reason:** The table exists only in production, with an unknown structure and a lost source, so reusing the name would make fresh and production databases differ.
- **Alternatives:** Reuse the legacy table; migrate automatically.
- **User impact:** Without conversion, the person who wrote that row won't see it in the new feature.
- **Data/privacy impact:** That row may hold personal text and stays in place. Later retention must account for it.
- **Migration impact:** V6 creates a separate table, after DIV-036.
- **Recommended:** As proposed. Inspect once valid credentials exist.
- **Owner approval:** PENDING

## DEC-037 — Dependency on profile and onboarding
- **Proposed behavior:** Phase 04 doesn't wait for DIV-022 and DIV-023.
- **Reason:** The tracker's graph places Insights after onboarding, but neither feature uses them technically.
- **Alternatives:** Keep the ordering.
- **User impact:** Features can ship before guided onboarding.
- **Data/privacy impact:** None.
- **Migration impact:** None.
- **Recommended:** Remove the dependency.
- **Owner approval:** PENDING

## DEC-038 — Reflection editing, deletion and retention
- **Proposed behavior:** Editable at any time. Permanent user-initiated delete. Kept until deleted or the account is removed. No server drafts and no browser drafts. No analytics over answers. History lists never include answer text.
- **Reason:** `data-retention.md` identifies this content as sensitive and requires these rules.
- **Alternatives:** Lock past months; soft delete; time-limited retention.
- **User impact:** Full control; unsaved text is lost if the tab closes.
- **Data/privacy impact:** Strongest control for the user. Backups may retain content until their own expiry (DIV-033, DIV-035).
- **Migration impact:** `ON DELETE CASCADE` from `app_users`.
- **Recommended:** As proposed.
- **Owner approval:** PENDING

## DEC-039 — Concurrent reflection edits
- **Proposed behavior:** Optimistic version check. A stale save returns `409 REFLECTION_CONFLICT`; two simultaneous first saves can't overwrite each other.
- **Reason:** Silently losing written text is worse than for budget numbers, so this is a deliberate exception to `DEC-028`'s last-write-wins.
- **Alternatives:** Last write wins, matching budgets.
- **User impact:** An occasional conflict notice instead of silent loss.
- **Data/privacy impact:** None.
- **Migration impact:** A `version` column in V6.
- **Recommended:** Version check.
- **Owner approval:** PENDING

## DEC-040 — Blank submissions and future months
- **Proposed behavior:** Blank answers are dropped. An all-blank save and any future month return `400`. "Skip" saves nothing.
- **Reason:** Avoids empty rows and reflections on months that haven't happened. The current month is allowed.
- **Alternatives:** Store empty reflections; allow future months.
- **User impact:** Clear validation messages.
- **Data/privacy impact:** None.
- **Migration impact:** None.
- **Recommended:** As proposed.
- **Owner approval:** PENDING

## DEC-041 — Insight calculation rules
- **Proposed behavior:**
  - `sharePercent` and `changePercent`: 1 decimal place, `HALF_UP`, `null` when the base is zero; never adjusted to total 100.
  - Current-month comparison uses the same day range of the previous month, clamped to that month's length.
  - Trend covers six calendar months; months before the first transaction show no activity rather than a zero.
  - Refunds aren't netted, since no refund concept exists.
  - Current category group applies to past expenses, per `DEC-028`, and the UI says so.
- **Reason:** Consistent with `DEC-028` and avoids misleading comparisons.
- **Alternatives:** Compare only complete months; 12-month trend.
- **User impact:** Honest comparisons, labelled partial months.
- **Data/privacy impact:** None.
- **Migration impact:** None.
- **Recommended:** As proposed.
- **Owner approval:** PENDING

## DEC-042 — User-facing "Kakeibo" wording
- **Proposed behavior:** Owner decides whether the UI names the Kakeibo method. Internal group identifiers (`NEEDS`, `WANTS`, `CULTURE`, `UNEXPECTED`) don't change either way.
- **Reason:** Commit `b44c9c7` (2026-11-05) removed user-facing Kakeibo wording, while product documents and the Phase 04 brief describe a Kakeibo-inspired product.
- **Alternatives:** (a) Keep the removal and use "spending groups". (b) Restore the wording. (c) Plain labels in the UI, with the method explained in one place.
- **User impact:** Product identity and copy.
- **Data/privacy impact:** None.
- **Migration impact:** None.
- **Recommended:** No recommendation; this is a brand decision between the owner and the other developer. New Phase 04 copy will follow the decision and in the meantime uses the four group names alone.
- **Owner approval:** PENDING
