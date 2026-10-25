# Pull Request Template

Copy this content into `.github/pull_request_template.md` or adapt it to the repository's existing template.

## Summary

<!-- What changed and why? Keep this outcome-focused. -->

## Related issue and traceability

- Closes #
- User story / use case:
- Phase:
- API contract / OpenAPI operation:
- Data model or migration (if applicable):

## Change type

- [ ] Feature
- [ ] Bug fix
- [ ] Refactor / technical debt
- [ ] Documentation
- [ ] Build / CI / configuration
- [ ] Security-sensitive change

## Scope

**Included**
- 

**Not included**
- 

## Acceptance criteria

- [ ] Criterion 1:
- [ ] Criterion 2:
- [ ] Criterion 3:

## Implementation notes

<!-- Important decisions, alternatives, or limitations. -->

## Testing evidence

- [ ] Frontend lint / typecheck / tests (if applicable)
- [ ] Backend compile / unit tests (if applicable)
- [ ] Integration/API tests (if applicable)
- [ ] Migration tested (if applicable)
- [ ] Manual end-to-end journey tested (if applicable)

Commands actually run:

```text
# Add exact commands and results. Do not claim checks you did not run.
```

## Security and privacy

- [ ] Authorization and ownership rules checked
- [ ] Input validation checked
- [ ] No secrets or sensitive personal/financial data committed or logged
- [ ] CSRF/session behavior checked if relevant
- [ ] Error responses do not leak internals

Explain any item that is not applicable or remains incomplete:

## Database and deployment impact

- [ ] No schema change
- [ ] New Flyway migration included
- [ ] API contract updated
- [ ] Configuration or environment variables changed
- [ ] Deployment order / compatibility notes documented

Details:

## UI evidence (if applicable)

<!-- Add screenshots or recording using synthetic data. -->

## Documentation

- [ ] Relevant product / API / data / architecture docs updated
- [ ] OpenAPI matches implementation
- [ ] Traceability matrix / phase status updated
- [ ] Open decisions recorded; no assumptions silently frozen

## Reviewer checklist

- [ ] Acceptance criteria met
- [ ] Tests and CI pass
- [ ] Change is focused and understandable
- [ ] No unresolved blocking comments
- [ ] Migration, security, and compatibility risks addressed

## Known limitations / follow-up work

<!-- Link follow-up issues rather than expanding this PR without limit. -->
