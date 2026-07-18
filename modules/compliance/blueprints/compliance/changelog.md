# compliance — changelog

Every change to this module lands here in reverse-chronological order. Follow
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) semantics + tag every
change with its wave / spec / ADR reference.

## Unreleased

Nothing yet.

## v0.1.0 — inaugural release

### Added

- **Module scaffold** — `modules/compliance/` created following the storage /
  subscription blueprint shape. Priority 30 (Wave 5, after entitlements +
  subscription + storage + notifications).
- **Eight owned entities** with dedicated schemas:
  - `ConsentCategory` (`ccg_`) — catalogue of consent categories (essential /
    functional / marketing / analytics / ai-training / minor-parental).
    Platform-default rows on `tenant_id=null`; tenant overrides duplicate the
    row with a tenant_id.
  - `ConsentRecord` (`cns_`) — immutable subject × category × decision
    snapshots. Withdrawal writes a new row, never mutates.
  - `Dsar` (`dsr_`) — data-subject-request state machine.
  - `DsarArtefact` (`dsa_`) — per-module contribution to a DSAR bundle.
  - `LegalHold` (`lhd_`) — freezes retention on a subject / tenant / case /
    class scope.
  - `RetentionRun` (`rtr_`) — audit trail of every retention sweep.
  - `Subprocessor` (`spr_`) — versioned VPC / DPA registry.
  - `SafeguardingIncident` (`sfi_`) — minor-safeguarding report inbox.
- **Four owned traits** — `HasConsent`, `IsRetentionAware`, `HasLegalHold`,
  `IsDsarContributor` — composed by downstream models to opt into compliance
  orchestration.
- **Five attributes** — `#[DsarExportable]`, `#[DsarErasable]`,
  `#[ConsentRequired]`, `#[RetentionPolicy]`, `#[LegalHoldable]` — declared on
  consumer classes; discovered at boot into the DsarContributorRegistry
  - RetentionPolicyResolver + LegalHoldGate + ConsentGate registries.
- **Event catalogue** — 23 published events covering the consent lifecycle, DSAR
  state transitions, legal-hold lifecycle, retention-sweep outcomes,
  subprocessor changes, safeguarding-incident lifecycle, and breach detection.
- **Wire contracts** — versioned `contracts/consent-given.v1.json` +
  `contracts/dsar-completed.v1.json` for cross-service consumers.
- **HTTP surface** — three hosts (tenant / platform-admin / central) covering
  DSAR self-serve, consent give / withdraw, subprocessor feed, safeguarding
  report / triage / escalate, legal-hold CRUD, breach dashboard, retention-run
  inspection.
- **Bindings** — 15 registered container bindings for the runtime orchestrators
  (DsarOrchestrator, RetentionRunner, LegalHoldGate, ConsentGate,
  SubprocessorFeedRenderer, BreachDetector, BreachNotifier,
  SafeguardingEscalator, DataClassScanner, ComplianceReportGenerator, ...).
- **Async surface** — 14 queued jobs covering the DSAR runner + assembler +
  deliverer, retention sweep, legal-hold expiry, breach signature scan,
  safeguarding escalation, compliance report generation.
- **Notifications** — 12 user-facing notifications (DSAR lifecycle, consent
  withdrawal confirmations, legal-hold apply / release, safeguarding incident
  lifecycle, breach detection + notification, subprocessor changes).
- **Policies** — 8 authorization policies with fine-grained abilities per
  entity + guard.
- **Permissions** — tenant + platform_admin guard permission strings seeded via
  `ConsompliancePermissionSeeder`.
- **Entitlement consumption** — three declared entitlements
  (`compliance.dsars.month`, `compliance.legal-holds.max`,
  `compliance.retention-runs.month`) sourced from the entitlements module.
- **Feature keys** — 9 feature keys published against
  `feature-flag::FeatureFlag` gating the plan-tier-differentiated behaviours
  (DSAR SLA extension, custom retention overrides, breach-feed API access,
  EU-only data residency, enterprise-only bulk-erase, etc.).
- **Self-declared compliance regimes** in `compliance.json` — GDPR, CCPA, SOC 2
  Type 2, PCI DSS, COPPA, FERPA — with per-article evidence.
- **Field classification** in `data-classes.json` — every column across the
  eight entities tagged per foundation's five-tier taxonomy.
- **Subprocessor list** — inaugural entries covering S3, CloudFront, Cloudflare
  (CDN + R2), Amazon SES / SendGrid, PostHog, Sentry, ClamAV / Cloudmersive, and
  the payment providers routed via subscription module.

### Notes

- Consent categories are **seeded**, not baked. Platform ships six default
  category rows via `compliance:seed-consent-categories`; tenants override with
  their own duplicates carrying a `tenant_id`.
- **No safeguarding case management** — the module receives + triages +
  escalates + closes SafeguardingIncidents; a dedicated case-management workflow
  lives in a future `safeguarding` module.
- **No breach primary detection** — compliance subscribes to signals from
  storage / audit / tenants / auth (future); primary detection lives in each
  signal-emitting module. Compliance owns the notification workflow.

### ULID prefixes registered (in `modules/foundation/data/ulid-prefixes.json`)

- `ccg_` → `ConsentCategory`
- `cns_` → `ConsentRecord`
- `dsr_` → `Dsar`
- `dsa_` → `DsarArtefact`
- `lhd_` → `LegalHold`
- `rtr_` → `RetentionRun`
- `spr_` → `Subprocessor`
- `sfi_` → `SafeguardingIncident`

### Migration path

Green-field module. No migration from prior state. Existing modules add
`#[DsarExportable]` / `#[DsarErasable]` on their own timeline; the DSAR runner
degrades gracefully when a contributor module is absent (logs a warning, marks
the artefact as `skipped_no_contributor`).
