---
title: Module Blueprints — Enterprise Product Review
status: draft
owner: product-lead
updated: 2026-07-05
target_doc: .kiro/specs/module-blueprints/PLAN.md
target_exemplar: modules/Tenancy/
---

# Module Blueprints — Enterprise Product Review

## 0. Framing

One-line decision under review: **is the `modules/<name>/` blueprint contract,
exemplified by `modules/Tenancy/`, sufficient to author an enterprise-grade,
multi-tenant, multi-vertical Laravel + SPA product against?**

Frameworks applied:

- **MoSCoW** on artefact coverage (must / should / could / won't).
- **RICE and ICE** on module authoring order.
- **Kano** on business-type variance placement (basic / performance / delighter
  — used to decide "when is variance a distinct entity vs a toggle").
- **Bezos one-way / two-way door** on each recommendation.
- **JTBD** (jobs-to-be-done) framing on the personas that the blueprint has to
  serve.
- **Assumption mapping** for open questions.

Compliance frameworks referenced with concrete citations: GDPR (Arts. 6, 8, 15,
17, 30, 32, 35), UK-GDPR, FERPA (34 CFR Part 99), COPPA (16 CFR Part 312),
CCPA/CPRA, PCI-DSS v4.0, WCAG 2.2 AA (SC 2.4.7, 1.4.11), SOC 2 Type II (Trust
Services Criteria CC6.1, CC7.2, CC8.1), ISO/IEC 27001:2022.

The plan is well-shaped and unusually rigorous for a v0 blueprint contract — it
captures more surface than 90% of modular monolith projects ever formalise. The
gaps I identify below are enterprise-specific: they emerge only once the product
is sold to a School District procurement office, an EU DPO, a Federation with a
Data Processing Addendum, or a Fortune-500 buyer with a SOC 2 questionnaire. Fix
them before the first enterprise deal — not after.

---

## 1. Context read

Files I consulted before writing this review:

- `.kiro/specs/module-blueprints/PLAN.md` (the plan under review; full read).
- `modules/Tenancy/README.md`, `module.json`, `relations.json`, `traits.json`,
  `routes.json`, `middleware.json`, `events.json`, `policies.json`,
  `permissions.json`, `hooks.json`, `features.json`, `entitlements.json` (the
  current exemplar; full read).
- `modules/Tenancy/schemas/tenant.schema.json`,
  `schemas/business-type.schema.json` (both schemas; full read).
- `modules/Tenancy/data/tenants.json`, `data/business-types.json`,
  `data/current-tenant.json` (fixtures).
- `modules/Tenancy/sdui/README.md`, `sdui/screens/workspace-picker.screen.json`
  (SDUI exemplar).
- `.kiro/steering/frontend-module-architecture.md` (workspace rule, injected
  into context).
- `.kiro/specs/backend-frontend-alignment/API_CONTRACT.md` §1–3
  (already-committed bootstrap contract).
- `.kiro/specs/frontend-domain-rebuild/requirements.md` §1 (already-committed
  frontend-side alignment).

Note: I did NOT open `.ref/**`, `modules/Tenancy/sdui/forms/*`, or
`modules/Tenancy/sdui/widgets/*` — the review is grounded in the plan and the
top-level Tenancy exemplar files, which was enough to reach every finding below.

---

## 2. Section 1 — Coverage: is the artefact set enough to build the product?

### 2.1 Verdict

**No, not quite.** The plan captures every artefact a Laravel modular monolith
needs to generate itself (schemas, relations, routes, events, jobs, policies,
permissions, features, entitlements, health, metrics, analytics, caches,
retention). What it misses is **enterprise-buyer surface**: the artefacts a
procurement office, a DPO, an auditor, or a partner integrator asks for. These
are missing:

| Missing artefact                       | Rationale                                                                                                                                                                                                                                                                                                                                                                                                      | MoSCoW                                  |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| `compliance.json`                      | Per-module declaration of which regulatory regimes apply (GDPR, FERPA, COPPA, CCPA, PCI, HIPAA-adjacency) and the concrete controls / evidence artefacts each demands. Today, compliance intent is scattered across `retention.json`, `analytics.json`, and `policies.json` — invisible to a procurement questionnaire.                                                                                        | **Must**                                |
| `data-classes.json`                    | Field-level PII classification (`public / internal / confidential / restricted / regulated_minor / regulated_health / regulated_financial`). Drives DSAR fulfilment (GDPR Art. 15), right-to-erasure scope (Art. 17), encryption-at-rest policy, minor-data handling (COPPA + GDPR Art. 8), and search-index eviction. `retention.json` is a start but doesn't classify columns.                               | **Must**                                |
| `errors.json`                          | Error catalogue: HTTP status × error code × i18n key × retryable flag × surface-to-user flag. Enterprise support runbooks and partner integration teams live off this. Without it, error semantics live in Blade + controllers + DTO validators, invisible to everything else.                                                                                                                                 | **Must**                                |
| `webhooks.json`                        | Outbound customer-consumable webhooks distinct from internal `events.json` and `broadcasts.json` (SPA-facing). Enterprise integrators (SSO providers, HRIS, LMS, video providers) need a signed webhook surface. Bake this into the contract or watch it grow ad-hoc per module.                                                                                                                               | **Should**                              |
| `feature-flags.json`                   | **Distinct from `features.json`.** `features.json` today is a business feature toggle (does this tenant have "attendance" turned on). A rollout flag is a delivery control (10% canary, kill switch, per-cohort). Conflating them means we cannot express "this business feature is on for the tenant, but the new implementation is behind a 5% rollout." Change management (SOC 2 CC8.1) requires the split. | **Should**                              |
| `subprocessors.json`                   | Per-module list of third-party services the module uses (Stripe, Twilio, SendGrid, S3, Sentry, Segment, OpenAI, Iconify). Aggregates into the tenant-facing subprocessor registry required by GDPR Art. 28 and every enterprise DPA.                                                                                                                                                                           | **Must**                                |
| `sla.json`                             | Per-module contribution to platform SLO / uptime / RTO / RPO. Enterprise MSAs commit to 99.9% availability; without a per-module SLO budget, we can't diagnose which module ate the error budget.                                                                                                                                                                                                              | **Should**                              |
| `search.json`                          | Search-index bindings (Meilisearch / Typesense / Postgres FTS). Interacts with retention (right-to-be-forgotten must delete search rows), analytics (search terms are PII), and DSAR (indexed fields must be included in exports).                                                                                                                                                                             | **Should**                              |
| `api-versions.json`                    | Deprecation policy per route with sunset dates. `middleware.json` already declares `api.version`, but there's no artefact declaring "route X is deprecated on YYYY-MM-DD, replaced by Y." Enterprise partners require ≥12 months notice.                                                                                                                                                                       | **Should**                              |
| `business-rules.json`                  | Declarative business rules — conditional logic that isn't a policy (authorization) or a validator (schema). Example: "gyms with >100 members require a manager approval on refund > $500". Today these live in controllers. Externalising them lets Product + Compliance edit them without touching code.                                                                                                      | **Could** (deferrable, but plan for it) |
| `changelog.md` per module              | Module-level changelog. Enterprise auditors ask "when did permission `manage_tenants` last change scope?" Without a per-module changelog, the answer is a git log spelunk.                                                                                                                                                                                                                                     | **Must**                                |
| `accessibility.json` per SDUI resource | WCAG 2.2 AA conformance evidence: which keyboard shortcuts, ARIA roles, live regions each screen owns. Feeds the VPAT auditors ask for in public-sector procurement (Section 508 in the US, EN 301 549 in the EU).                                                                                                                                                                                             | **Should**                              |
| Generated `openapi.json` per module    | Derived from `routes.json` + `x-wire` DTOs. Auto-generation, not hand-authored — but it must be a first-class output for partner integration + procurement.                                                                                                                                                                                                                                                    | **Should**                              |
| `queues.json` (dedicated)              | Per-queue SLOs, backpressure config, DLQ policy, retry budgets. `jobs.json` today lists job classes but conflates job-level and queue-level concerns.                                                                                                                                                                                                                                                          | **Could**                               |

### 2.2 Are the six Tenancy entities the right seam?

Six is the right ballpark but **the seam is missing three enterprise-critical
entities**:

1. **`TenantIdentity` / `WorkspaceMembership`** — the cross-tenant user↔tenant
   linkage. `modules/Tenancy/relations.json` already flags this ("A person
   invited to two workspaces has one User row per tenant (identity linkage lives
   on the future Identity split — see the tenancy-columns.md living gap
   register)"). This absolutely will bite the moment a customer's IT admin needs
   to belong to two workspaces with different SSO providers and different roles.
   **Recommend: split `TenantIdentity` out now, before the User module lands.**
   One-way door if left until Wave 3 — every downstream module builds on the
   assumption that `User.tenant_id` is unique.

2. **`TenantContact`** (billing / legal / technical / DPO) — legally distinct
   from the "owner user." GDPR Art. 30 (Records of Processing) requires a Data
   Protection Officer contact per controller. Every enterprise DPA lists a
   "notice address." A single `owner_user_id` conflates roles that legally must
   be different people. **Recommend: add `TenantContact` in Wave 1 as part of
   Tenancy.**

3. **`TenantIntegration`** (or `TenantIdentityProvider`) — the SSO / SCIM
   configuration record per tenant. Not needed for v1 SMB deals but required the
   moment we sign an enterprise deal. **Recommend: reserve the model in Wave 1
   (empty resource folder), fill in v2.** Two-way door — adding the model later
   is cheap; retrofitting the tenant relations is not.

Consolidation to consider:

- **`DomainRecord` may be premature.** The plan carves it out as a first-class
  entity for DNS-record verification. In practice, the underlying DNS state is a
  black box (we don't own it) and the verification token is a single string.
  Consider folding it into `Domain` as a JSONB field until an actual delegation
  UI ships. If we later need per-record CRUD, extract it — two-way door.
- **`Branding` as its own entity is correct.** Multi-region enterprise tenants
  absolutely need multiple branding profiles (per-domain, per-region). Endorse
  the split from `Tenants.branding` JSONB.

**Should `Application` live in `tenancy` or its own `platform` module?** The
plan argues Tenancy. I agree for now — `Application` has 8 rows total (per the
tenancy-columns.md living gap register), moving it costs more than it earns.
**Revisit if `Application` grows beyond a handful of rows or gains its own admin
UI beyond a picker.** Two-way door.

### 2.3 Is §7 authoring order the right value-delivery lens?

The plan's order: Foundation → Tenancy → Access/Audit/Settings/FeatureFlag
(parallel) → User → Auth/Activity/Notifications.

This is a **time-to-first-revenue** order: get to "self-serve SMB signs up and
pays" as fast as possible. That's correct if the target is a $50/month gym. It
is **wrong** if the target is a Federation, a University, or a School District
(i.e. any enterprise deal): those buyers gate procurement on **Access + Audit**
before they even look at the product.

Two alternative sequences:

| Sequence                               | Optimises for                                                   | Wave 2                                                                                      |
| -------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| A — Time-to-first-revenue (plan today) | SMB self-serve, low ACV, quick MRR                              | Access + Audit + Settings + FeatureFlag in parallel                                         |
| B — Time-to-first-enterprise-deal      | Federation / University / School District, high ACV, RFP-driven | **Access + Audit first (Wave 2)**, then Settings + FeatureFlag (Wave 3), then User (Wave 4) |

**Recommendation: switch to Sequence B.** Rationale:

- Enterprise deals are 10-100× the ACV of SMB. One deal funds a year of SMB.
- Access + Audit are the SOC 2 CC6.1 (logical access) + CC7.2 (system
  monitoring) evidence. You cannot fake them at the pitch; auditors ask for the
  log.
- No Wave-2 module actually blocks Wave 3 except Access. Audit is a HasAuditable
  target — the Foundation trait already exists; the Audit module is the
  write-target.
- The trade-off: Auth ships one wave later, delaying "user can log in."
  Acceptable because the platform-admin surface can be seeded, and self-serve
  tenant registration on the central host is a Wave-3 concern anyway.

Reversibility: two-way door. If we discover a specific SMB deal that would
unlock in Wave 2 with User, we can hot-swap.

**Additionally**: move **`Compliance` to a first-class module in Wave 2** — even
if it's initially a thin module that just holds the DPA templates, subprocessor
registry, and retention orchestrator. The events file already references
`Compliance.ScheduleRetentionJob` as a listener; the module doesn't exist yet.
Formalise it.

---

## 3. Section 2 — Business-type strategy

### 3.1 Is the six-type catalogue right for the enterprise segment?

The current catalogue (Academy, SportsCenter, School, Gym, Federation, Club)
covers the SMB-to-mid-market range well. For **enterprise** the catalogue is
missing:

| Missing type                                | Persona                                                          | ACV signal                                         | Why distinct                                                                                                                                                                                                                                                                 |
| ------------------------------------------- | ---------------------------------------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`university_athletics`** (or `higher_ed`) | NCAA/USports athletic departments, university PE + intramurals   | High ACV, multi-year contracts, procurement office | NCAA compliance (Title IX reporting), NIL (Name/Image/Likeness), booster clubs, cross-team academic-eligibility tracking. School vertical does not model this.                                                                                                               |
| **`school_district`**                       | K-12 district office managing 5-50 schools                       | Very high ACV, RFP-driven                          | Multi-campus roll-up reporting, state-level student data protection laws (NY 2-d, TX HB, CA SOPIPA, IL SOPPA), FERPA-district-authority (34 CFR 99.31), per-parent portal per-school. A `school` tenant is one school; a `school_district` tenant is a container of schools. |
| **`corporate_wellness`**                    | Fortune 500 wellness programme, HRIS-integrated                  | High ACV, seat-priced                              | HRIS integration (Workday, Rippling), employee anonymisation, health-data separation, gamification, participation reporting to HR without medical detail leak. Distinct persona from Gym (employees are not "members").                                                      |
| **`nonprofit_community`**                   | YMCA, Boys & Girls Club, PCA, community centre                   | Mid-to-high ACV, grant-funded                      | Sliding-scale fees, scholarship tracking, donor management link, federal grant reporting, community programme metrics. Distinct from Academy because programme completion, not competitive progression, is the primary metric.                                               |
| **`governing_body`**                        | Regional or national sport federation (superset of `federation`) | High ACV, multi-tenant tenancy                     | Federation-of-federations: FIFA → national FA → regional FA → clubs. Same shape as `federation` but with recursive `parent_tenant_id`. See §3.2.                                                                                                                             |

Types to **NOT add** (yet):

- **`physical_therapy` / `sports_rehab`** — HIPAA territory. Do not enter until
  we've signed a BAA and hardened the health-data data-class tier. Wave-6+.
- **`military_affiliated`** — DoD-adjacent (Fort Bragg youth sports, US Air
  Force fitness). ITAR-adjacent compliance bar. Wave-6+.
- **`league`** — youth soccer leagues, Little League etc. Overlaps `federation`
  too much; treat as a `federation` sub-variant with a terminology override.

### 3.2 Federations-of-federations

The plan's `federation` type is a leaf. Real-world federations nest:
**International body → National body → Regional body → Club**. Options:

- **Option A — separate `governing_body` type + recursive `parent_tenant_id` on
  `tenants` table.** Cheapest change: one nullable FK column, one new type.
  Downside: no strong contract that a `federation` tenant can be under a
  `governing_body`; permissions must be modelled at the tenant boundary each
  time.
- **Option B — new `TenantHierarchy` entity in `tenancy` module.** One row per
  parent-child link, supports M:N (a Club might belong to multiple regional
  bodies). More correct, more work.
- **Option C — leave for v2.** Sell to single-tier federations first (national
  FA, standalone). Add hierarchy only when a buyer demands it.

**Recommendation: Option A for v1** (one column, low blast radius), Option B in
v2 if we win a real-world hierarchical customer. Two-way door.

### 3.3 Decision rule — where does variance belong?

Business-type variance today is scattered across `features`, `terminology`,
`roles`, and `entitlements` in `BusinessType.default_config`. That's the right
shape but the plan doesn't formalise **when to reach for which primitive**.
Proposed decision rule (adopt in the Tenancy module readme):

```
Variance placement rule — when tenants of business type A behave differently than tenants of business type B, place the difference in:

├── DOMAIN — A distinct entity, table, migration, module.
│   Reach when: the shape of the data is different — different columns, different validation rules,
│   a different lifecycle. Example: `federation.competition` vs `school.term` — these are not
│   two labels for the same thing; the underlying entity is structurally different.
│
├── FEATURE FLAG — feature key in `features.json`, gated by /me `features` array.
│   Reach when: "does this entity even exist for this tenant?" — a binary toggle at the tenant boundary.
│   Example: `day_passes` on for SportsCenter, off for School.
│
├── ENTITLEMENT — a countable slot / pool / boolean in `entitlements.json`.
│   Reach when: "how many can they have?" or "can they use this at all, based on their plan?" — the
│   entity exists but a quantitative limit applies. Example: `athletes.max=500` on Growth plan.
│
├── TERMINOLOGY — a label override in `BusinessType.default_config.terminology`.
│   Reach when: same shape, same fields, same behaviour — only the surfaced word differs.
│   Example: `athletes` → "Students" for schools, "Members" for gyms.
│
├── TENANT SETTING — a mutable value in the `Settings` module.
│   Reach when: the value varies per tenant at runtime (not at provisioning). Example: session length
│   default, timezone, first-day-of-week, email footer text.
│
├── BUSINESS RULE — a rule in the module's `business-rules.json`.
│   Reach when: a conditional workflow — "approval required when gym-membership refund > $500."
│   Encode declaratively so Product + Compliance can edit without touching code.
│
└── MODULE CONFIG — a value in `module.json.config` or an environment variable.
    Reach when: operational tuning (retry budget, cache TTL, batch size). Never user-facing.
```

**Anti-pattern to name explicitly**: **do NOT encode business-type behaviour
with `if ($tenant->business_type === 'school')` in controllers.** The whole
reason we have four primitives is so behaviour never branches on the enum value
at runtime — every branch is a feature flag, an entitlement, or a distinct
entity. Codify this as a lint rule (grep for `business_type ===` in application
code and fail the build).

This decision rule belongs in the plan (§4 or a new §4.4) — it's the primary
"how do we think about this" heuristic Product will pull out in every planning
session.

---

## 4. Section 3 — Compliance blind spots

The plan is compliance-aware in spirit (retention, consent tiering) but **not
compliance-defensible** — nothing in the artefact set says "for the Athletes
module, GDPR Art. 15 fulfilment queries these 12 fields; COPPA parental consent
gates 4 fields; the retention window is 7 years post-last-touch to satisfy UK
Statutory Instrument 2013/1471 on safeguarding records." That's the level a DPO
or an auditor requires.

### 4.1 Applicable regimes given the personas

Given the persona set (**minors + guardians + coaches + payment collection +
safeguarding records + medical clearance + staff HR data**):

| Regime                                                 | Trigger                                                                                                                                                                                          | Evidence Stackra must produce                                                                                                                                                                                                 |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **GDPR** (Regulation (EU) 2016/679) + UK-GDPR          | Any EU/EEA/UK data subject                                                                                                                                                                       | ROPA (Art. 30) per module; DPIA (Art. 35) for minors + biometrics; DPA template (Art. 28); breach notification runbook (72h, Art. 33); SCC / adequacy decision for extra-EU transfers (Ch. V); DPO contact per tenant.           |
| **COPPA** (16 CFR Part 312)                            | Any child under 13 in a US tenant                                                                                                                                                                | Verifiable Parental Consent flow (§312.5); direct-notice-to-parents; no behavioural marketing to under-13; safe-harbour-programme membership recommended (§312.10).                                                              |
| **FERPA** (34 CFR Part 99)                             | Schools + universities receiving US federal education funds                                                                                                                                      | Written parental consent for disclosure (§99.30); disclosure log; parent inspection right (§99.10) within 45 days; "school official" contract clause (§99.31(a)(1)).                                                             |
| **CCPA/CPRA**                                          | California residents                                                                                                                                                                             | "Do Not Sell or Share" toggle; verifiable consumer request flow; annual privacy notice; sensitive personal information disclosures.                                                                                              |
| **PCI-DSS v4.0**                                       | Card data touching our infra                                                                                                                                                                     | If Stripe Elements: SAQ-A; quarterly ASV scan; annual attestation. **Recommend: never accept SAQ-D scope; keep card data out of our infrastructure entirely.**                                                                   |
| **HIPAA-adjacency**                                    | Medical clearance, safeguarding health notes                                                                                                                                                     | Deliberately **avoid** covered-entity status in v1. Model health fields as `regulated_health` data class: encrypted at rest, restricted access, mandatory audit trail, no export to marketing analytics. Revisit BAA path in v2. |
| **Safeguarding regimes**                               | UK (Working Together to Safeguard Children 2018 + Keeping Children Safe in Education), Australia (Working with Children Check), Ireland (Children First Act 2015), similar in most jurisdictions | DBS / equivalent verification status per coach; guardian-consent capture for image use; disclosure trail; retention 6 years post-last-contact (safeguarding standard) or per statutory instrument.                               |
| **State-level student data laws** (US)                 | NY 2-d (§2-d), TX HB 946, CA SOPIPA (BPC §22584), IL SOPPA (105 ILCS 85)                                                                                                                         | Per-state contract addendum; specific data-deletion / breach notification timelines; annual DPO training log.                                                                                                                    |
| **WCAG 2.2 AA** (W3C Rec 5 Oct 2023)                   | Public-sector procurement (schools, federations, universities in US Section 508 + EU EN 301 549)                                                                                                 | VPAT (Voluntary Product Accessibility Template); accessibility conformance report per SDUI resource; independent audit annually.                                                                                                 |
| **SOC 2 Type II** (AICPA Trust Services Criteria 2017) | Any enterprise buyer over ~$50k ACV                                                                                                                                                              | Independent auditor report covering CC1-CC9 + optional Availability / Confidentiality / Privacy criteria; continuous monitoring; incident response drills; annual renewal.                                                       |
| **ISO/IEC 27001:2022**                                 | International enterprise (EU, ME, APAC)                                                                                                                                                          | ISMS with Annex A controls (93 in 2022 revision); Statement of Applicability; risk register; management review minutes. Overlaps SOC 2 substantially.                                                                            |

### 4.2 Artefacts to add for compliance-as-a-first-class-concern

1. **`compliance.json` per module** — regime → applicability → controls →
   evidence path. Sketch:

   ```jsonc
   {
     "regimes": {
       "gdpr": {
         "applicable": true,
         "controls": [
           { "article": "Art. 6(1)(b)", "control": "contract-basis-tenant-user", "evidence": "TOS acceptance timestamped on User creation" },
           { "article": "Art. 15", "control": "dsar-export", "evidence": "compliance/dsar/athlete.export.json" },
           { "article": "Art. 17", "control": "right-to-erasure", "evidence": "retention.json + Compliance.PurgeSubjectJob" },
           { "article": "Art. 8", "control": "minor-parental-consent", "evidence": "guardian-consent flow when age < 16 (or lower per member-state)" }
         ]
       },
       "coppa": { "applicable": true, "controls": [ ... ] },
       "ferpa": { "applicable": true, "controls": [ ... ] }
     }
   }
   ```

2. **`data-classes.json` per module** — field-level classification:

   ```jsonc
   {
     "classes": {
       "public": ["id", "slug", "name", "created_at"],
       "internal": ["is_default", "metadata"],
       "confidential": ["email", "phone"],
       "restricted": ["date_of_birth"],
       "regulated_minor": ["guardian_consent_captured_at"],
       "regulated_health": ["medical_clearance_status", "medical_notes"],
       "regulated_financial": ["iban", "stripe_customer_id"],
     },
     "dsar": {
       "exportable": ["public", "internal", "confidential", "restricted"],
       "erasureBehaviour": {
         "regulated_health": "anonymise-in-place",
         "regulated_financial": "purge-with-audit-record",
       },
     },
   }
   ```

3. **`dpia/<feature>.md`** per feature-level Data Protection Impact Assessment.
   Template from ICO (UK) or CNIL (FR); one per high-risk processing activity.
   Mandatory for **minor-data enrolment**, **biometric attendance** (if we ever
   ship it), **automated safeguarding classifiers**, and **AI features that
   profile athletes**.

4. **`subprocessors.json` at repo root** (auto-generated) — aggregated from
   per-module `subprocessors.json`. Publicly available at
   `https://stackra.app/subprocessors` per GDPR Art. 28.

5. **`consent-flows/*.flow.json`** — declarative consent capture flows (parental
   consent, guardian consent, marketing opt-in, cookie tiers). Feeds the SDUI
   runtime + the audit log.

### 4.3 Missing Compliance module

The plan mentions "Compliance.ScheduleRetentionJob" as a listener in
`events.json` but the **Compliance module isn't in §7's list**. Ship a
first-class `compliance/` module in Wave 2 to hold:

- Retention orchestration (reads every module's `retention.json`, schedules
  purge jobs).
- DSAR fulfilment orchestrator (aggregates data across modules per subject).
- Consent registry (writes to a `consents` table; every event references the
  consent that made it lawful).
- DPA template + subprocessor registry rendering.
- The "Right-to-be-forgotten" audit trail (Art. 17(3) requires we log the
  erasure).

---

## 5. Section 4 — SDUI resource pattern

### 5.1 Does four screens (list / create / edit / show) cover enterprise CRUD?

**Not yet.** Four screens cover the SMB use case. Enterprise CRUD, per the JTBD
I hear from enterprise ops teams, needs the following additional patterns:

| Missing pattern                         | Job to be done                                                                                          | Cost of omission                                                                                                                                  |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Bulk actions** (multi-select on list) | "Archive all inactive athletes from last season." Ops team saves 2 hours/week.                          | Users work around it: they export to Excel, edit in Excel, and either bulk-import (if we support it) or ask engineering for a data-fix migration. |
| **Saved views / filter presets**        | "My branch, active status, this season, sorted by last attendance." Every user has 2-4 recurring views. | Users lose their filter state every navigation. Ceiling on adoption.                                                                              |
| **Export** (CSV / Excel / PDF)          | Finance auditor asks for "all Q2 payments in a CSV."                                                    | Absolutely required for enterprise; without it we're a toy.                                                                                       |
| **Import** (CSV upload with dry-run)    | Onboarding: "Import 3000 students from PowerSchool."                                                    | Every enterprise onboarding stalls at data migration; without an import surface we do it manually.                                                |
| **Audit trail drawer**                  | "Who changed this athlete's guardian last week?" On the show/edit screen, side panel.                   | Users cannot self-serve audit questions; every query becomes a support ticket.                                                                    |
| **Impersonation banner**                | Platform admin support: "I need to see what the tenant sees."                                           | Without a persistent banner, mis-clicks in impersonation cause data corruption charged to the wrong user. Legal exposure.                         |
| **Approval workflow / draft state**     | Refunds > $500 require director approval. Enrolment offers pending guardian consent.                    | Every regulated business type has approval-gated actions. Model at the SDUI contract level or every module reinvents it.                          |
| **Side-panel details / peek**           | Row click opens a peek without navigation. Faster triage.                                               | Adoption ceiling; users prefer competitors with peek panels.                                                                                      |
| **Change history (in-line diff)**       | Show the last N changes on the edit screen.                                                             | Redundant with audit drawer but expected UX.                                                                                                      |
| **Comments / annotations**              | Coach leaves a note on an athlete. Platform admin leaves a note on a tenant.                            | Cross-cutting; ship as a widget + a discrete module (`comments/`).                                                                                |
| **Assignment / ownership**              | Who owns this record — supports work-queues, escalation, SLAs.                                          | Enterprise ops without ownership = orphaned records.                                                                                              |
| **Tags / labels**                       | Cross-cutting metadata. Every enterprise CRM has them.                                                  | Users invent tags in the `metadata` JSONB, undiscoverable.                                                                                        |
| **Print view**                          | Regulated forms (safeguarding checklist, medical clearance). Signature line.                            | Public-sector procurement often mandates.                                                                                                         |

### 5.2 Should the resource folder contain non-screen artefacts?

**Yes, split.** Rationale: as soon as we ship bulk actions + export + import,
the column set is consumed by 3-4 screens. Duplicating the column contract
across screens is a drift bomb.

Proposed enterprise-ready resource folder:

```
sdui/resources/<entity>/
├── list.screen.json
├── create.screen.json
├── edit.screen.json
├── show.screen.json
├── columns.json               reusable column set (list, export, print, peek all consume)
├── filters.json               reusable filter set (list + saved-views consume)
├── bulk-actions.json          multi-select actions on list
├── export.action.json         export destinations + formats (csv, xlsx, pdf)
├── import.screen.json         optional; CSV import with validation preview
├── audit.drawer.json          audit trail side drawer template
└── tabs/                      optional; show-screen tabs
    ├── overview.tab.json
    ├── activity.tab.json
    └── files.tab.json
```

Keep tiny inline configs inline; extract as soon as a config crosses screens.
Two-way door — you can inline back later, but you can't retroactively
deduplicate without a rename.

### 5.3 Additional SDUI runtime concerns

- **Wire-contract versioning.** Every `.screen.json` should carry `kind` +
  `version`. The plan mentions `id, title, version` on screens but doesn't
  formalise the runtime version. Add golden-file tests per screen to detect
  wire-contract drift.
- **`Custom` node escape hatch.** SDUI will not cover every design ambition (a
  Gantt chart, a video timeline, a 3D pitch view). Reserve a `Custom` node kind
  that maps to a named React component. Document it as a last resort with a
  review gate — otherwise every hard problem becomes a `Custom` node and SDUI
  collapses back to hand-authored React.
- **A11y in SDUI.** SDUI screens must be WCAG 2.2 AA by construction — labels on
  every field, live regions on lists that update, roving-tabindex on data grids.
  Codify in the SDUI runtime and require `accessibility.json` per screen (see
  §2.1).
- **RTL rendering.** Bilingual labels in `data/business-types.json`
  (`label_translations.ar`) signal RTL support. Every SDUI node needs RTL-safe
  styling (`start`/`end` not `left`/`right`). Add a lint check.

---

## 6. Section 5 — Open questions in §8 answered

### 6.1 `ModuleRouteLoader` location

**Recommendation: dedicated `module-kernel` package**, not `foundation`.

Rationale: separation of concerns. `foundation` is model traits + primitives +
health aggregation — no domain, no wiring, no discovery. Route discovery is a
wiring concern; folding it into `foundation` couples the two. If we later
extract the kernel to a public composer package (which we will, if this
architecture works and we open-source it), the seam is clean.

Reversibility: two-way door if we start separate. One-way if we start in
`foundation` and try to extract later (every downstream module now depends on
`foundation` transitively for route loading).

### 6.2 Schema versioning

**Recommendation: yes, mandatory `$version` per schema + CI-enforced bumps.**

Extend to include `deprecated` on properties:
`{"type": "string", "deprecated": true, "deprecated_at": "2026-01-01", "removed_at": "2027-01-01"}`.
Feeds `api-versions.json` (§2.1). Also ties into the OpenAPI generation:
deprecated properties get `deprecated: true` in the output.

Reversibility: two-way. Retrofitting `$version=1` everywhere is a one-liner.

### 6.3 Ref resolution scheme

**Recommendation: extend JSON Schema's existing `$id` + `$ref` with a base URI
convention** (`stackra://modules/<name>/`), don't invent a new scheme.

Ship a small Node resolver that:

- Turns `stackra://modules/tenancy/schemas/tenant` into
  `modules/tenancy/schemas/tenant.schema.json`.
- Validates that the file exists.
- Validates that the referenced `$id` matches.

Reason: developers who know JSON Schema will know how this works. A new scheme
is a new thing to teach.

Reversibility: two-way.

### 6.4 Fixture validation

**Recommendation: `ajv-cli` with strict mode + `useDefaults: false` for fixture
validation. Add `@stoplight/spectral` for the semantic cross-file rules**
(routes ↔ policies, listeners ↔ events, SDUI actions ↔ routes). Spectral has a
mature ruleset engine and speaks JSON Schema natively.

Reversibility: two-way — could swap for `redocly` or a bespoke Node validator
later.

### 6.5 SDUI runtime

**Recommendation: confirm `@stackra/sdui` for v1 but with three guardrails**:

1. Pin the version in `package.json` and treat it as a hard dependency.
2. Add a **wire-contract version** (`version: 1` on every screen) — see §5.3.
3. Reserve the `Custom` node escape hatch (see §5.3).

Reversibility: **one-way if adopted casually**. SDUI runtimes are hard to swap
after ~30 screens ship. Treat this as a strategic technology bet and revisit at
the 3-month mark with a "should we still be on this runtime?" review.

### 6.6 Analytics consent tier

**Recommendation: yes, mandatory `consent_tier` per event.** Values:
`essential | functional | analytics | marketing`. Aligns with UK ICO cookie
guidance + IAB TCF v2. GDPR requires opt-in for anything above `essential`;
ePrivacy (2002/58/EC) requires the same for cookies. Enforce at CI: no
`analytics.json` entry without a `consent_tier`.

Cross-link: `consent_tier: essential` events fire without opt-in; every other
tier is gated by `Consent.hasConsent(user, tier)`. Feeds the future cookie
banner + consent management platform.

Reversibility: two-way.

### 6.7 Listeners strategy — locked to Option B

**Endorse.** Publisher owns the event contract; subscribers own their bindings.
This is the canonical event-bus ownership model (Symfony EventDispatcher, Kafka
consumer groups, Rails ActiveSupport::Notifications). CI-built reverse index is
standard.

One caveat: the reverse-index CI will be slow if we don't cache. Suggestion:
cache the reverse index in `.kiro/build/listeners-index.json`, regenerate on any
change under `modules/*/listeners.json` or `modules/*/events.json`, fail the
build if the checked-in file is stale.

Reversibility: two-way — could switch to Option A (publisher-owns-listeners)
later, but with churn on every publisher every time a listener changes. Option B
wins on isolation.

---

## 7. Section 6 — Prioritisation of the first 10 modules

### 7.1 RICE vs ICE — which frame?

**Neither maps cleanly to substrate modules.** RICE assumes discrete features
with reach × impact scores; the first 10 modules are all **substrate** — their
reach is 100% (every downstream module depends on them) and their impact is
binary (present or absent). Applying RICE forces made-up numbers.

**Better framing: dependency graph + GTM optimisation.** Every module is a Must
(MoSCoW). The interesting question is: **within the Must set, what order
maximises the smallest thing we can sell?**

I use two lenses:

- **Time-to-first-revenue** = the fewest modules needed to have "SMB tenant
  registers self-serve, adds an athlete, records attendance, gets billed."
  Order: Foundation → Tenancy → User → Auth → Subscription → Notifications.
  Access + Audit + Settings + FeatureFlag deferred.
- **Time-to-first-enterprise-deal** = the fewest modules needed for a Federation
  / University / School District RFP: Foundation → Tenancy → **Access → Audit**
  → Settings → FeatureFlag → User → Auth → Activity → Notifications.

### 7.2 Recommended sequence for Stackra

Given the ARR shape of Federation + University + School District deals (10-100×
SMB), **prioritise time-to-first-enterprise-deal**:

| Wave | Modules (revised)                                | Rationale                                                                                                                                                 |
| ---- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | foundation                                       | Substrate — traits, health, primitives. Blocks everything.                                                                                                |
| 1    | tenancy (with `TenantIdentity`, `TenantContact`) | Multi-tenant seam. Enterprise deals demand this from day one.                                                                                             |
| 2    | **access + audit**                               | **Moved earlier from plan's Wave 2.** SOC 2 CC6.1 / CC7.2 controls. RBAC + immutable audit trail = first two questions on every enterprise questionnaire. |
| 3    | settings + feature-flag + **compliance** (new)   | Compliance module is the target of retention jobs, DPA rendering, DSAR orchestration. Add now, not later.                                                 |
| 4    | user                                             | Tenant-scoped user CRUD.                                                                                                                                  |
| 5    | auth + activity + notifications                  | Sign-in flows, activity feed, outbound comms.                                                                                                             |

Reversibility: two-way. If we sign a self-serve SMB before an enterprise deal,
we can hot-swap access + audit to Wave 3.

### 7.3 ICE scores where sequence is ambiguous

Where Wave 2 modules are candidates for parallel authoring, ICE:

| Module           | Impact (1-10)                               | Confidence (1-10)                    | Effort (1-10, lower=better) | ICE (I·C/E) |
| ---------------- | ------------------------------------------- | ------------------------------------ | --------------------------- | ----------- |
| access           | 10 (blocks every enterprise deal)           | 9 (spatie/laravel-permission stable) | 4                           | 22.5        |
| audit            | 10 (SOC 2 gate)                             | 9 (owen-it/laravel-auditing stable)  | 3                           | 30.0        |
| compliance (new) | 8 (unlocks DSAR + retention orchestrator)   | 7 (novel module, less certainty)     | 5                           | 11.2        |
| settings         | 6 (nice-to-have; every module could inline) | 9 (spatie/laravel-settings stable)   | 3                           | 18.0        |
| feature-flag     | 7 (blocks per-tenant rollouts)              | 9                                    | 3                           | 21.0        |

**ICE ranking: audit > access > feature-flag > settings > compliance.** But
compliance is a hard prerequisite for the first EU tenant — sequence, don't
rank. Do audit first (2 person-weeks), access in parallel, then feature-flag +
settings, then compliance last in wave 2/3.

**Assumptions I'm making here**:

- No customer signed yet, so no reach data.
- Team of ~3-5 engineers (small).
- Target ACV: $10k-$100k for federation / SchoolDistrict; $500-$5k for SMB.
- 12-month runway to first enterprise deal.

If any of those assumptions is wrong, the sequence shifts. **Ask me which are
true and I'll re-rank.**

---

## 8. Section 7 — Missing top-level docs

`PLAN.md` alone is not enough. Adjacent docs recommended, ranked by urgency:

| Doc                                  | Purpose                                                                                                                                                                                                                                                                                        | MoSCoW                                    |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `GLOSSARY.md`                        | ~150 domain terms already in play (tenant, application, business_type, provisioning, hook, entitlement, slot, pool, scope, feature). Without a shared glossary, onboarding = 5-7 days. New joiner reads this on day one.                                                                       | **Must**                                  |
| `NAMING.md`                          | Extends §1's kebab-case-lowercase rule with: enum naming (past-tense events, imperative jobs), route naming (verb.noun.qualifier), permission naming (`{resource}.{action}`), key naming (kebab for URLs / snake for JSON / lowercase folders / PSR-4 for classes). Prevents naming holy wars. | **Must**                                  |
| `CI.md`                              | Describes each CI check (ajv, cross-refs, route↔policy, listener↔event, SDUI action↔route). Names the workflow file, expected runtime, failure modes. Enterprise auditors ask "how do you know this is validated?" — CI.md is the answer.                                                      | **Must**                                  |
| `MIGRATION.md`                       | How the current `Tenancy/` (capital T) folder is renamed + enriched to match the new shape (§5.2's 8 corrections). Includes: rename procedure, additive vs breaking migration, rollback plan. Future modules follow the same template.                                                         | **Must**                                  |
| `COMPLIANCE.md`                      | Enterprise-facing compliance matrix: which regimes we handle, which are on our roadmap, evidence per regime. Shipped as a public page for prospects (with confidential controls redacted).                                                                                                     | **Should**                                |
| `SECURITY.md`                        | Vulnerability reporting, embargo policy, PGP key. Standard open-source convention; enterprise buyers look for it.                                                                                                                                                                              | **Should**                                |
| `RELEASING.md`                       | Module release cadence, versioning (semver on schemas), backward-compat rules, deprecation policy. Ties into `api-versions.json`.                                                                                                                                                              | **Should**                                |
| `CONTRIBUTING.md`                    | Module authoring workflow: `pnpm module:new <name>` scaffolds the folder, CI runs, review gates. Onboarding new devs.                                                                                                                                                                          | **Should**                                |
| `ARCHITECTURE.md`                    | One-page cross-cutting picture: frontend module architecture + backend module architecture + how they interact + where SDUI fits. Executives + new hires.                                                                                                                                      | **Should**                                |
| `decisions/adr-XXXX.md` (ADR folder) | Architecture Decision Records. Start with: ADR-001 "SDUI over Filament", ADR-002 "Publisher-owned events, subscriber-owned listeners", ADR-003 "Modules at repo root, not per-package". Immutable once accepted; new decisions supersede.                                                      | **Should**                                |
| `RUNBOOKS.md` (or `runbooks/`)       | On-call runbooks per critical path: tenant provisioning failure, domain verify stuck, subscription webhook missed. SOC 2 CC7.3 requires this.                                                                                                                                                  | **Could** (extractable to `sre/` package) |

Total: 4 Musts + 5 Shoulds + 1 Could. Sequence: ship Musts before templating the
second module; Shoulds within Wave 2; Could when we approach SOC 2 audit prep.

---

## 9. Section 8 — Top five risks (summary)

Framing: risk × likelihood × mitigation. One-liner mitigation each.

| #   | Risk                                                                                                                                                                          | Category              | Likelihood | Impact    | Mitigation                                                                                                                                                                          |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- | ---------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **CI cross-file validation slow / brittle** — schemas ↔ fixtures ↔ relations ↔ routes ↔ SDUI actions ↔ policies. A single schema rename cascades.                             | Technical             | High       | High      | Build CI incrementally (one cross-check at a time), require on every PR from day one, cache the reverse-listener index. Measure runtime — target <60s.                              |
| 2   | **SDUI runtime lock-in** — committing to `@stackra/sdui` sets the SPA's rendering ceiling. Custom compounds (Gantt, video timeline) become hard.                              | Technical + Strategic | Medium     | High      | Reserve a `Custom` node kind; version the wire contract; run a 3-month "should we still be on this runtime?" review. See §6.5.                                                      |
| 3   | **Compliance debt** — GDPR / FERPA / COPPA scattered in code, not in the contract. First EU school tenant = non-compliant.                                                    | Compliance            | High       | Very High | Add `compliance.json` + `data-classes.json` to the contract now (§2.1); ship a `compliance/` module in Wave 2/3; gate first enterprise deal on compliance sign-off.                 |
| 4   | **Business-type combinatorial explosion** — every type × entitlement × feature × terminology = huge test matrix. Adding University or CorporateWellness doubles fixture load. | Delivery              | Medium     | Medium    | Build a business-type test harness that composes each type's default_config into a full tenant fixture and runs the SDUI screens; add generative tests via Hypothesis / fast-check. |
| 5   | **Ownership drift** — with frontend, backend, and design changing the same JSON, "who owns this file" blurs. Silent conflicting edits land.                                   | Organisational        | High       | Medium    | Name a Blueprint Editor per module (one person owns it); enforce CODEOWNERS on `modules/<name>/**`; require the editor's review on every change.                                    |

**Two additional risks worth flagging but not in the top five:**

- **Competitive squeeze** — LeagueApps, iClassPro, Jackrabbit, and Sportlyzer
  have deep vertical features. Racing to feature parity across 6+ business types
  dilutes focus. Mitigation: pick one business type (recommend Academy or
  Federation) as the flagship, ship it to 10/10 polish, use the others as
  expansion.
- **AI-assisted authoring degrades quality** — 20+ JSON files per module × 10+
  modules = 200+ files. Temptation to "let AI generate the whole thing" is high.
  Result: subtle contract violations that pass CI but fail semantic review.
  Mitigation: keep the human-authored Tenancy exemplar as the gold standard;
  every new module reviewed against it before merge.

---

## 10. Recommended amendments to `PLAN.md`

I am NOT modifying `PLAN.md` in this review. Below is the list of amendments a
human editor should approve and apply.

### Additive (safe to apply)

1. **§3 Per-module blueprint contract — add six artefacts**:
   - `compliance.json` (regulatory regime × control × evidence).
   - `data-classes.json` (field-level PII tier).
   - `errors.json` (error catalogue: HTTP status × code × i18n × retryable).
   - `webhooks.json` (outbound customer-consumable webhooks).
   - `feature-flags.json` (rollout flags, distinct from business
     `features.json`).
   - `subprocessors.json` (third-party services per module).
   - Plus `changelog.md` per module (mandatory).

2. **§3.26 SDUI section — add per-resource split**:
   - `columns.json`, `filters.json`, `bulk-actions.json`, `export.action.json`,
     `audit.drawer.json` become first-class siblings of the four screens.
   - `import.screen.json` optional per resource (only where CSV import is
     authored).
   - `tabs/` subfolder for show-screen tabs.

3. **§4.2 SDUI — reserve the `Custom` node kind + require wire-contract
   `version`** on every screen.

4. **§5 Reference exemplar (Tenancy) — add three entities**:
   - `TenantIdentity` / `WorkspaceMembership` (cross-tenant user linkage).
   - `TenantContact` (billing / legal / technical / DPO contacts).
   - `TenantIntegration` (SSO configuration; empty resource folder in v1, filled
     in v2).

5. **§4.4 Business-type strategy — add the decision rule table** (§3.3 above).
   Codify variance placement (domain / feature / entitlement / terminology /
   setting / business-rule / config).

6. **§7 Authoring order — reorder Wave 2**: move `access` and `audit` ahead of
   `settings` and `feature-flag`. Add `compliance` as a Wave-2/3 first-class
   module.

7. **§8 Open questions — close all seven** with the recommendations in §6 above.

### Structural (require broader discussion before applying)

8. **Add four new top-level docs**: `GLOSSARY.md`, `NAMING.md`, `CI.md`,
   `MIGRATION.md` (all Must per §8).

9. **Business-type catalogue expansion**: add `university_athletics`,
   `school_district`, `corporate_wellness`, `nonprofit_community` in v2; add
   recursive parent-tenant for federation-of-federations (Option A in §3.2).
   Requires product-lead + go-to-market alignment before doing.

10. **Compliance module first-class**: promote from
    "referenced-but-doesn't-exist" (per `events.json`) to a Wave-2/3 module with
    its own folder. Requires DPO / legal review of the retention + DSAR flows
    before shipping.

### Deferred (do not apply now; revisit in 3-6 months)

11. Splitting `Application` out of `tenancy` into a `platform` module. Two-way
    door.
12. Full `TenantHierarchy` M:N entity for federation-of-federations. Option B in
    §3.2.
13. Physical Therapy / Sports Rehab (HIPAA) business type. Wave 6+ only.

---

## 11. Open questions for the human

Answers to these firm up several recommendations above.

1. **Target ARR profile.** SMB self-serve (avg $2k ARR) or enterprise (avg $50k+
   ARR)? Impacts §7.2 sequence. My recommendation assumes enterprise; if SMB is
   the target, revert to plan's Wave 2 ordering.

2. **Deployment regions in v1.** Single region (US or EU) or multi-region from
   day one? Multi-region multiplies compliance + DR work.

3. **First-year target for enterprise deals.** Which vertical is the flagship —
   Federation, University, School District, or Academy? Concentrating on one
   lets us ship one polished business-type; spreading across all six risks 60%
   depth everywhere.

4. **AI features on the roadmap.** Any AI features that profile athletes
   (predict progression, flag safeguarding concerns)? Triggers additional DPIA
   obligations (GDPR Art. 22 automated decision-making) and needs a separate
   `ai-governance.md`.

5. **SSO/SCIM ETA.** V1 or v2? Impacts whether `TenantIntegration` is a stub in
   Wave 1 or lands in Wave 3.

6. **Sales motion.** Product-led (self-serve) or sales-led (RFP + procurement)?
   Product-led weights `Notifications` + `Billing` earlier; sales-led weights
   `Access` + `Audit` + `Compliance` earlier.

7. **Existing customer commitments.** Any pilot / design partner already
   promised a specific business type or feature by a specific date? Names the
   constraints on Wave 2 that would override my recommended sequence.

---

## Changelog

- **2026-07-05** (draft): initial review authored against `PLAN.md` v2 and the
  current `modules/Tenancy/` exemplar.
