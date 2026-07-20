# academorix/compliance

Cross-cutting compliance substrate. Wave 5 infrastructure. The **only**
canonical orchestrator for GDPR / CCPA data-subject rights, consent evidence,
retention execution, legal-hold policy, subprocessor / VPC registry, minor
safeguarding reporting, and breach-notification workflow.

See `modules/compliance/blueprints/compliance/readme.md` for the full design
narrative.

## Eight aggregates

- `ConsentCategory` — platform + tenant consent catalogue.
- `ConsentRecord` — immutable subject x category snapshots.
- `Dsar` — data-subject-request state machine.
- `DsarArtefact` — per-module DSAR bundle contribution.
- `LegalHold` — retention freeze at subject / tenant / case / class scope.
- `RetentionRun` — audit trail of every retention sweep.
- `Subprocessor` — versioned VPC registry.
- `SafeguardingIncident` — minor-safeguarding report inbox.

## Attribute contracts

Downstream modules opt into the compliance orchestration via attributes:

- `#[DsarExportable]` / `#[DsarErasable]` — model is a DSAR contributor.
- `#[ConsentRequired]` — action or job is gated on a consent category.
- `#[RetentionPolicy]` — model carries an inline retention policy.
- `#[LegalHoldable]` — model participates in legal-hold checks.

Registries hydrated at boot via `#[HydratesFrom]` on the interfaces.
