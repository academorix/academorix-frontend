# Launch readiness — pending tasks to move from Platform Phase → Product Phase → Production → Launch

**Status:** Working document — updated at every phase gate. **Owner:** Backend
architecture. **Last refresh:** 2026-07-22.

This is the single source of truth for what stands between the workspace as it
sits today and a customer-facing launch of the Stackra platform + the Stackra
(Academorix) product on it. Every bullet is scoped, prioritised, and (where
applicable) cross-referenced to the ADR / steering doc / spec that formalised
it.

## How to read this file

- **Priority** — `P0` blocks the next gate; `P1` blocks Production; `P2` blocks
  Launch; `P3` is nice-to-have.
- **Gate** — the phase the work belongs to: `PHASE` (still finishing the
  platform), `PRODUCT` (building the Stackra Sports product on top), `PROD`
  (production readiness), `LAUNCH` (customer-facing readiness).
- **Owner** — the sub-agent / role that owns it (see `.kiro/agents/`).
- **Blocked by** — hard prerequisites.
- **ADR / steering** — cross-reference.

## Phase entrance criteria at a glance

| Gate                        | Definition of done                                                                                                                                                                 |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Platform Phase COMPLETE** | Every service boots via `docker compose up`. Every service's `composer install` + `artisan migrate --seed` runs green on a fresh SQLite. Every ADR has a matching steering anchor. |
| **Product Phase ENTRANCE**  | Academorix Sports product Sprint 0 tasks (customer-visible surface) can start. Every framework primitive Sprint 0 needs is stable + documented.                                    |
| **Production ENTRANCE**     | Every service has: k8s manifests, blue/green deploy runbook, SLO + alerting on-call rotation, retention runner scheduled, DR drill on record.                                      |
| **Launch ENTRANCE**         | Legal (ToS, DPA, DSAR flow), commercial (pricing, checkout, invoicing), operational (support runbook, status page), and marketing (landing site, sign-up flow) surface all live.   |

---

## A. Platform-Phase blockers (P0 — still open)

Everything that must land BEFORE we can call the platform phase complete +
transition to product-phase work.

### A1. Docker build must go green for every service

- **Priority:** P0
- **Gate:** PHASE
- **Status:** In progress — smoke test as of 2026-07-22 fixed 4 issues + the
  composer install stage NOW resolves ~36s in before hitting a deeper
  workspace-wide composer-graph issue (§A1b). Dockerfile itself is sound.
- **Owner:** deploy-engineer + codebase-housekeeper
- **Cross-ref:** `docker/service.Dockerfile`, `docker/compose.dev.yml`.

Sub-tasks:

- [x] `.dockerignore` at repo root (prevents 4 GB build context).
- [x] `gnupg` in runtime stage (Doppler installer needs it).
- [x] `curl` in composer-vendor stage (installer prerequisite).
- [x] Composer stage on PHP 8.4 (some packages require ^8.4|^8.5).
- [x] `sanctum: ^4.0` (^5.0 doesn't exist yet).
- [x] `mattiverse/userstamps` → `wildside/userstamps` (wrong vendor name).
- [x] Broad SDK sweep — 62 orphan `-sdk` requires stripped.
- [x] `--ignore-platform-req` for ext-{pcntl,swoole,redis,pdo_pgsql,intl,
      bcmath,opcache,gd,zip,mbstring} in composer-vendor stage.
- [ ] **A1b — illuminate/\* version drift** (see below).
- [ ] `docker compose build identity` completes with exit 0.
- [ ] `docker compose build commerce | notifications | observability |     academorix-api`
      — repeat for the 4 remaining services.
- [ ] `docker compose up postgres redis identity` reaches `/health/ping`
      returning 200.
- [ ] `docker compose up` on the full stack — every service healthy.
- [ ] Multi-service scenario: identity issues a JWT, commerce accepts it +
      writes an audit event to observability. End-to-end sanity.

### A1b. illuminate/\* version drift across backend packages

- **Priority:** P0
- **Gate:** PHASE
- **Owner:** codebase-housekeeper

The composer smoke build surfaced a workspace-wide version-drift issue: some
backend packages pin `illuminate/*` to `^11.0`; some to `^11.0|^12.0|^13.0`;
some to `^13.0`; a few use `^13.0.0` ranges. Root `stackra/api` requires
`laravel/framework: ^13.8`, and `laravel/framework` v13 declares
`replace: { "illuminate/filesystem": "self.version", ... }` — so ANY package
that pins `illuminate/filesystem: ^11.0` conflicts.

Concrete error from the build:

```
Only one of these can be installed: illuminate/filesystem[v7...13.x-dev],
laravel/framework[v13.12...13.x-dev]. laravel/framework replaces
illuminate/filesystem and thus cannot coexist with it.
```

Fix path — one of:

- **A1b.i (chosen convention)** — every backend package widens `illuminate/*`
  constraints to include `^13.0`. Example: `"illuminate/filesystem": "^11.0"` →
  `"illuminate/filesystem": "^11.0|^12.0|^13.0"`. This is the least-disruptive
  fix and matches the pattern several packages already use.
- **A1b.ii** — every package drops its explicit `illuminate/*` requires and
  requires `laravel/framework: ^11.0|^12.0|^13.0` instead (transitive). Cleaner
  long-term but breaks packages that only need one illuminate sub-package (like
  the container).

Action items:

- [ ] Author `.kiro/reports/widen-illuminate-constraints.py` — walks every
      composer.json, finds every `illuminate/*` explicit require, widens the
      version constraint to include `^13.0`.
- [ ] Verify + repeat the smoke build.

Est: 2-3 hours to author + verify + repeat every service's build.

### A2. Every service's `composer install` + `artisan migrate --seed` runs green

- **Priority:** P0
- **Gate:** PHASE
- **Status:** Not yet attempted end-to-end. Blocked by A1.
- **Owner:** codebase-housekeeper + laravel-feature-builder
- **Cross-ref:** ADR-0011 (seeder discovery), ADR-0035 (migration DAG).

Sub-tasks:

- [ ] `composer install` succeeds inside every service container.
- [ ] `php artisan migrate --seed` completes green on a fresh SQLite in every
      service.
- [ ] `MigrationDagResolver::verify()` returns true for every service (no
      cycles, no missing parents). Currently 317 markers exist with zero
      declared parents — first pass. Real FK edges are added per-package as each
      domain gets touched next.
- [ ] Every seeder runs (dual-source enum-db-seed) without touching
      `SystemRowImmutable` invariants.

### A3. Contract-implementer split is respected across every framework package

- **Priority:** P0
- **Gate:** PHASE
- **Status:** Partially done. `authorization` + `access` is the reference pair.
  6 more candidate splits documented but not implemented.
- **Owner:** container-di-architecture-reviewer + backend-architecture-reviewer
- **Cross-ref:** ADR-0008, `.kiro/steering/contract-implementer-split.md`.

Sub-tasks:

- [ ] Audit every `packages/backend/framework/*` package that mixes contracts +
      implementers in one place. Split if the three-question test passes.
- [ ] Ship the candidate splits documented in the steering: `feature-flags` +
      `feature-flags-store`, `settings` + `settings-store`, `audit` +
      `audit-log`, `caching` + `caching-registry`, `scheduling` +
      `scheduling-runtime`, `events` + `events-bus`.

### A4. Every ADR reference in code is resolvable

- **Priority:** P0
- **Gate:** PHASE
- **Status:** Some historical ADR references (0006, 0016, 0021, 0025) resolve to
  different topics than the code references imply. Backend-side ADR numbering is
  a separate repo — the current workspace is the frontend clone and its ADRs run
  0024-0035. Consolidate before launch.
- **Owner:** docs-adr-steward
- **Cross-ref:** `docs/adr/README.md`.

Sub-tasks:

- [ ] Cross-reference every `ADR-NNNN` reference in code / steering / docs
      against the actual ADR files.
- [ ] File missing-reference issues + resolve by writing the missing ADRs OR
      updating the references to point at the correct existing ADR.

### A5. Data-first + spatie/laravel-data validation coverage on every write endpoint

- **Priority:** P0
- **Gate:** PHASE
- **Status:** Partial. Attribute-first validation is documented; audit needs to
  confirm every write endpoint uses Data attributes (not FormRequest).
- **Owner:** codebase-housekeeper + backend-architecture-reviewer
- **Cross-ref:** `.kiro/steering/data-first.md`,
  `.kiro/steering/php-attributes.md` §Spatie Laravel Data.

Sub-tasks:

- [ ] Grep for `extends FormRequest` — zero hits allowed.
- [ ] Grep for `public function rules(` on Data classes — zero hits allowed.
- [ ] Every action's `__invoke(<X>Data $data)` uses attribute-injected
      validation.

### A6. Migration-marker FK enrichment

- **Priority:** P1 (post A2 green)
- **Gate:** PHASE
- **Status:** 317 markers exist with zero declared FK parents. First pass. Each
  package needs to hand-enrich its markers with `#[DependsOn]` per its real FK
  graph.
- **Owner:** codebase-housekeeper per package
- **Cross-ref:** ADR-0035 §D1, `.kiro/reports/emit-migration-markers.py`.

Sub-tasks:

- [ ] For each of the 317 markers, review the paired migration file + declare
      every FK parent via `#[DependsOn]`. Estimate: 1-2 minutes per marker once
      you know the pattern, ~8 hours total.
- [ ] Run `MigrationDagResolver::verify()` in the test suite after each
      package's enrichment lands.

### A7. Octane audit rule enforcement — no P0, no P1 regressions

- **Priority:** P0
- **Gate:** PHASE
- **Status:** Green. Zero P0, zero P1 findings. Static audit wired to CI.
- **Owner:** backend-architecture-reviewer
- **Cross-ref:** `.kiro/reports/octane-static-audit.py`,
  `.kiro/steering/octane-first-di.md`, `.github/workflows/php.yml`.

Ongoing enforcement — every PR that introduces a P0 finding fails CI.

### A8. Test coverage — foundation + framework packages

- **Priority:** P1
- **Gate:** PHASE
- **Status:** ADR-0035's MigrationDagResolver has 9 Pest test cases. Other
  framework packages need parity coverage.
- **Owner:** test-mutation-engineer
- **Cross-ref:** `.kiro/steering/testing.md`, individual package's
  `tests/Feature/` folders.

Sub-tasks:

- [ ] Every framework package's public API has feature-test coverage above 80%.
- [ ] Every attribute has a discovery test (bind an `InMemoryDiscovery`, feed a
      fake target, assert the consumer wired correctly).
- [ ] Mutation testing (`composer test:mutation`) runs green above 70% MSI per
      package.

---

## B. Product Phase — Academorix Sports

The customer-visible product built on top of the platform. Everything below
starts when Section A gates.

### B1. Domain modules — the 21 modules under `apps/academorix/src/modules/sports/`

- **Priority:** P0 (Product Phase)
- **Gate:** PRODUCT
- **Owner:** laravel-feature-builder
- **Cross-ref:** `.kiro/steering/hierarchy.md` §Modules.

Existing (scaffolded, need real implementation):

- age-group, athlete, athlete-enrollment, athlete-guardian, attendance, awards,
  coaching, competition, development, drills, event, formations, match, medical,
  performance, private-sessions, progress, registrations, registry, season,
  session.

Sub-tasks per module:

- [ ] Domain model + `Contracts/Data/<Model>Interface` + migration + factory +
      seeder.
- [ ] Every CRUD action (`#[AsAction]`) with `#[RequirePermission]` + Spatie
      Data validation + repository dispatch.
- [ ] Marker class + `#[DependsOn]` graph populated.
- [ ] Feature test per action (happy + every failure path).
- [ ] SDK companion (typed wire contract for future service-to-service
      consumption from academorix-ai).

### B2. Business modules under `apps/academorix/src/modules/{finance,growth,products}/`

- **Priority:** P0 (Product Phase)
- **Gate:** PRODUCT
- **Owner:** laravel-feature-builder + product-lead

Finance (16 modules): chargeback, coupon, digital-passes, dunning, expenses,
gateway, invoice, marketplace-fee, membership, order, payment, payout, refund,
tax, transaction, wallet.

Growth (5 modules): analytics, attribution, leads, marketing, referrals.

Products (catalogue).

Sub-tasks — same shape as B1 per module.

### B3. Safeguarding (moved to academorix — ADR-0032 §D5)

- **Priority:** P0
- **Gate:** PRODUCT
- **Owner:** laravel-feature-builder + security-compliance-reviewer
- **Cross-ref:** `apps/academorix/src/modules/platform/safeguarding/`

- [ ] Minor-consent flow (guardian consent capture, per-Application consent
      revocation).
- [ ] Age gate (COPPA / age-of-consent-per-region).
- [ ] Background-check integration surface.

### B4. AI persona catalogue for academorix-ai

- **Priority:** P0 (Product Phase)
- **Gate:** PRODUCT
- **Owner:** laravel-feature-builder + product-lead

- [ ] Personas: Coach Assistant, Parent Assistant, Admin Assistant, Staff
      Assistant, Reception Assistant.
- [ ] Tools per persona (SensitiveTool + WritableTool derivatives).
- [ ] Draft-then-confirm flow for every write tool.
- [ ] Per-tenant persona enable/disable via feature flags.

### B5. Frontend product surface

- **Priority:** P0 (Product Phase)
- **Gate:** PRODUCT
- **Owner:** heroui-ui-builder + product-designer
- **Cross-ref:** `.kiro/steering/frontend-packages.md`, `packages/frontend/**`.

- [ ] `@stackra/*` framework packages: identity, tenancy, feature-flags, auth,
      hierarchy, permissions, audit, activity, settings, invitations, grants,
      delegation, service-accounts.
- [ ] Academorix product screens: sign-up + onboarding, dashboard, athletes
      list + detail + create/edit, teams + seasons + events management, finance
      surface (invoices, payments, subscriptions), safeguarding, staff surface,
      admin console.
- [ ] `@stackra/data` — the 15 generic resource hooks (`useResourceList` /
      `useResourceCreate` / etc.).
- [ ] `@stackra/http` — shared HTTP module with per-tenant + per-scope
      interceptors.
- [ ] React Native mobile shell for parent + athlete flows.

---

## C. Production readiness (P1)

Everything a deployed service needs to be operable at scale.

### C1. Kubernetes / infrastructure

- **Priority:** P1
- **Gate:** PROD
- **Owner:** deploy-engineer

- [ ] Helm charts per service (or per-service `k8s/*.yaml`).
- [ ] HorizontalPodAutoscaler per service (CPU + queue-depth-based).
- [ ] PodDisruptionBudget per service.
- [ ] NetworkPolicy per service (default-deny + explicit allows).
- [ ] Ingress-controller (nginx or Traefik) config for the public HTTP surface.
- [ ] TLS certificate management via cert-manager + Let's Encrypt.
- [ ] External DNS reconciler for tenant subdomains.
- [ ] Backup + restore policy (Postgres WAL archiving, Redis snapshots to S3,
      encrypted at rest).
- [ ] Multi-AZ deployment.

### C2. Observability + SRE

- **Priority:** P1
- **Gate:** PROD
- **Owner:** observability-engineer + sre-lead

- [ ] Sentry projects per service (already scaffolded — verify wiring).
- [ ] Grafana / Prometheus / OpenTelemetry: metrics + traces + logs.
- [ ] SLO definitions per service (availability + latency).
- [ ] Alert rules + on-call rotation (PagerDuty / Opsgenie).
- [ ] Runbook per service (start, restart, roll back, quarantine).
- [ ] Chaos-engineering baseline (one drill on record).

### C3. Security + compliance surface

- **Priority:** P1
- **Gate:** PROD
- **Owner:** security-lead + threat-modeler + security-compliance-reviewer

- [ ] Threat model per service (Phase 3 STRIDE + attack-tree pass).
- [ ] Security review sign-off per service.
- [ ] Doppler production configs authored + audited.
- [ ] Sanctum PAT rotation policy + service-account key rotation policy
      documented + runbooked.
- [ ] Rate limiting per endpoint (config + testing).
- [ ] DSAR / GDPR export flow end-to-end tested.
- [ ] Data retention runner (`observability/retention`) scheduled + tested.
- [ ] WAF rules (Cloudflare / AWS WAF).
- [ ] Penetration test scheduled + report on record.

### C4. Doppler + secrets

- **Priority:** P1
- **Gate:** PROD
- **Owner:** deploy-engineer + security-lead

- [ ] Doppler project per service (`stackra-<service>` × dev/stg/prd).
- [ ] Every secret rotated + logged in an internal registry.
- [ ] `./scripts/doppler-init.sh` idempotent + documented.
- [ ] Doppler-to-k8s sync (Doppler operator OR External Secrets Operator).

### C5. Database migrations at scale

- **Priority:** P1
- **Gate:** PROD
- **Owner:** data-modeler + data-lead

- [ ] Every migration reviewed for online-safety (no `LOCK TABLE`, no full-table
      `ALTER`, use `pt-online-schema-change` / `gh-ost` equivalents for large
      tables).
- [ ] Migration rollback tested on staging.
- [ ] Data-migration playbook for the initial customer onboarding.

### C6. CI/CD pipeline production surface

- **Priority:** P1
- **Gate:** PROD
- **Owner:** deploy-engineer

- [ ] Full-pipeline (build → test → analyse → publish → deploy) per service.
- [ ] Canary deploys (5% → 25% → 100% with auto-rollback).
- [ ] Blue/green ready per service.
- [ ] Release note automation (changesets to CHANGELOG to Sentry release to
      Slack).

### C7. Performance baseline

- **Priority:** P1
- **Gate:** PROD
- **Owner:** performance-engineer

- [ ] k6 load-test scripts per service — target: 500 rps sustained p95 < 200 ms.
- [ ] Lighthouse budgets on the frontend product surface.
- [ ] Workspace bundle-size limits per package.
- [ ] AI-service latency budget (p95 < 3 s per persona reply).

---

## D. Launch (P2)

Everything a real customer needs to see + trust.

### D1. Legal + compliance

- **Priority:** P2
- **Gate:** LAUNCH
- **Owner:** legal-compliance-officer (external) + product-lead

- [ ] Terms of Service + Privacy Policy (GDPR + COPPA + FERPA where applicable).
- [ ] Data Processing Agreement (DPA) template for enterprise customers.
- [ ] Subprocessor list (Paddle, Twilio, OpenAI, Sentry, Doppler, ...).
- [ ] DSAR + right-to-erasure flow end-to-end tested with real data.
- [ ] Cookie-consent banner (EU regions).
- [ ] Minor-consent flow legal review (per-country age of consent).

### D2. Commercial + billing

- **Priority:** P2
- **Gate:** LAUNCH
- **Owner:** commerce-service owner + product-lead

- [ ] Pricing page — public.
- [ ] Sign-up flow — checkout end-to-end tested.
- [ ] Paddle production account + webhook production URL wired.
- [ ] Invoice + credit memo generation tested.
- [ ] Subscription lifecycle (trial → active → grace → lapsed) tested.
- [ ] Refund flow tested.
- [ ] Chargeback handling tested.
- [ ] Coupon + promotion flow tested.

### D3. Onboarding + trust

- **Priority:** P2
- **Gate:** LAUNCH
- **Owner:** product-designer + heroui-ui-builder

- [ ] Marketing site (landing + features + pricing + docs + blog).
- [ ] Onboarding wizard — pick business type → default seed → first athlete +
      first team → first session.
- [ ] Public status page (statuspage.io or Instatus).
- [ ] Help center + docs site.
- [ ] Sample-data option for the first login (so trials feel real).

### D4. Support + runbook

- **Priority:** P2
- **Gate:** LAUNCH
- **Owner:** sre-lead + product-lead

- [ ] Support ticketing surface (in-product widget → Linear / Zendesk).
- [ ] Support runbook (common issues → resolution steps).
- [ ] On-call rotation for launch-day.
- [ ] Post-launch retrospective template.

### D5. Marketing + growth

- **Priority:** P2
- **Gate:** LAUNCH
- **Owner:** market-research-analyst + product-lead

- [ ] Launch-day plan (Product Hunt, Hacker News, LinkedIn, X).
- [ ] Referral programme.
- [ ] Analytics wiring (product + marketing).
- [ ] SEO baseline.

---

## E. Nice-to-have (P3 — post-launch)

Everything the product should eventually have but that doesn't block launch.

- HeroUI Pro migration for the admin surface polish.
- Multi-region deployment.
- Federated identity (SAML + OIDC + SCIM at Enterprise tier).
- BYO-database option for Enterprise.
- Native mobile app publishing (iOS App Store, Google Play).
- OpenTelemetry Beyond-metrics — RUM (Real User Monitoring).
- Advanced AI features (multi-agent orchestration, autonomous back-office
  agents).
- Marketplace app substrate (per ADR-0025 Lane 2 — post-launch).

---

## F. Sequencing recommendation

1. **Close Section A (P0)** — targets ~2 weeks. Blocks every subsequent phase.
2. **In parallel with A:** kick off B1 (sports domain modules) for the first 5
   modules (athlete, team, season, event, coaching) — enough to demo a basic
   academy in the product surface.
3. **Complete Section A + first cut of B (P0 modules + minimal frontend)** —
   targets ~4 more weeks.
4. **Section C (production readiness)** — targets ~3 weeks, parallel-able with B
   once A is complete.
5. **Section D (launch)** — targets ~2 weeks. Every item is external + can run
   parallel with C.
6. **Launch window** — target 8-11 weeks from today.

Every estimate assumes the current pace + assumes the reviewer + housekeeper

- builder agents run in parallel per Phase.

## G. Recent history — what already landed this quarter

- ADRs 0024-0035 authored + steering-anchored.
- 6-service split under `services/` + `apps/academorix`.
- SDK layer deleted; wire contracts in `docs/contracts/`.
- ADR-0031 12-row `application_id` mandate + E9 drop-column migrations.
- ADR-0030 A5 payment_methods reconciliation.
- ADR-0028 Octane runtime + ADR-0034 Swoole driver.
- ADR-0035 migration DAG (attribute + resolver + tests + 317 markers).
- Docker + Compose + Horizon + CI infrastructure landed.
- Octane static audit landed + wired to CI.
- CacheReferenceCatalog fixed (P1 finding closed).
- Docker smoke build progressing through swoole-build stage as of writing.

## H. Cross-references

- `docs/services.md` — the six-service topology.
- `docs/adr/README.md` — every ADR indexed.
- `.kiro/steering/` — every runtime rule.
- `.github/workflows/php.yml` — the CI matrix.
- `docker/compose.dev.yml` — the local-dev entry point.
- `.kiro/reports/` — every audit + sweep script.
