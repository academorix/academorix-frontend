# ADR-00XX — `<title>`

- **Status:** Proposed | Accepted | Deprecated | Superseded by ADR-00YY
- **Date:** `YYYY-MM-DD` — TODO
- **Deciders:** `<name>`, `<name>` (leads + technical-owner) — TODO
- **Technical scope:** `<packages / apps affected>` — TODO
- **Related ADRs:** — TODO (link ADRs this one depends on / obsoletes)

> Copy to `docs/adr/00XX-<slug>.md`. Owning agent: `docs-adr-steward`.

## Context

TODO(solution-architect): one or two paragraphs on WHY we're making this
decision. What's the current state? What forced the decision? What are we
optimising for and what are we willing to trade off?

Include:
- The trigger (customer requirement, technical debt, external constraint, ...)
- The scope (which module(s) / service(s) / API(s) this changes)
- The stakeholders (who's affected, who has to migrate)

## Decision

TODO(solution-architect): the decision, in one paragraph, imperative voice.
"We will do X." Not "we might" or "we should consider". A decision is a
commitment.

Then a short bulleted list of the concrete architectural choices:

- **Storage:** Postgres for the primary table; Redis for the cache. NOT S3.
- **Wire format:** JSON, envelope-shaped `{ data: T }`.
- **Auth:** Sanctum PAT + HS256 inter-service JWT (per `security-lead`).
- **Tenancy:** Row-level via `tenant_id`, per `tenancy-columns.md`.

## Alternatives considered

TODO(solution-architect): at least two alternatives, each with the reason it
was rejected. If you can't name a real alternative, the decision was probably
too small for an ADR — inline it in the code / spec instead.

### Alternative A — `<one-line name>`

What it would look like, and why we're NOT doing it.

### Alternative B — `<one-line name>`

Same shape.

## Consequences

TODO(solution-architect): the honest consequences of the decision. Positive,
negative, and neutral.

### Positive

- We can now do X.
- Y becomes easier because Z.

### Negative

- Migration cost: N engineer-days.
- Runtime cost: +Nms per request.
- Ongoing maintenance: new component that must be patched / monitored.

### Neutral

- Some things change but the trade is even.

## Rollout

TODO(solution-architect): how this ADR gets implemented. Phased or all-at-once?
Feature-flagged? Dark-launched? Reversible?

- Phase 1 (Week N-N): `<what lands>` behind feature flag `<name>`.
- Phase 2 (Week N-N): flip the flag on.
- Phase 3 (Week N-N): remove the flag + the old code path.

## Reversibility

TODO(solution-architect): how do we undo this if it goes wrong?

- **Reversible via feature flag:** flip `<flag-name>` off, redeploy. Time to
  revert: 5 minutes.
- **Reversible via data migration:** run `<migration-name>` in reverse. Time
  to revert: N hours.
- **Not reversible:** what state we'd need to accept if we choose to walk back.

## Compliance + security notes

TODO(security-lead): any GDPR / PDPL / SOC2 / HIPAA implications. Link the
threat model if one was authored (`threat-modeler` agent).

- PII touched: yes / no. If yes, which fields, which lifecycle.
- Retention policy: `<N days / months / years>` per `docs/retention/<slug>.md`.
- Audit trail: yes / no. If yes, which events.

## Migration guide (for consumers)

TODO(delivery-lead): if downstream consumers need to change anything, spell it
out here. Otherwise delete this section.

```typescript
// Before
oldApi.do(x);

// After
newApi.do(x, { option: 'value' });
```

## References

- Prior discussions: `<link to Slack / RFC / meeting notes>`
- Related steering: `.kiro/steering/<file>.md`
- Related spec: `.kiro/specs/<slug>/design.md`
- External references: `<link>`
