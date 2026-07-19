# ADR 0024 — Enrollment funnel is not a CRM (drop `growth/crm-leads`)

**Status:** Accepted **Date:** 2026-07-15 **Deciders:** Product + backend team

## Context

The blueprint pass shipped a `growth/crm-leads` module alongside
`sports/registrations`. Both modelled the same funnel — the same rows, the same
states, the same owner assignment, the same conversion to `Athlete`. Their
scopes overlapped enough that reviewers routinely asked which module owned which
row.

The overlap surfaced two distinct problems being conflated:

1. **The enrollment funnel** — season-driven form intake, follow-up tasks,
   pipeline stages (`LEAD → CONTACTED → TRIAL → OFFERED → ENROLLED`), the atomic
   conversion transaction that creates `Athlete + AthleteEnrollment + Invoice`
   on `ENROLLED`. **Sports-academy-specific. Nobody else can run the atomic
   write.**
2. **Commodity CRM features** — Kanban drag-drop, custom pipeline configuration,
   deal forecasting, email drip campaigns, lead scoring, contact merging,
   marketing automation, chat widgets. **Pipedrive / HubSpot / Intercom /
   Salesforce ship a decade of engineering here.**

Owning both is the trap. Building a passable Kanban is 8-16 engineering weeks;
building parity with Pipedrive is a moving target that never closes. Meanwhile
the sports-specific bits — age-eligibility gate against
`season.age_cutoff_date`, guardian-pair data collection for minors, medical
clearance upload, multi-tenant isolation, atomic conversion — are what the
platform actually needs to own.

Additionally: the `growth/crm-leads` blueprint listed features
(`email_sequences`, `ai_lead_scoring`, `attribution_tracking`) that either
duplicate `growth/attribution` or belong on an external CRM.

## Options considered

1. **Ship the full CRM inside `growth/crm-leads` (rejected — the trap).** Kanban
   UI, drip campaigns, lead scoring, custom pipelines. 12+ months of work
   chasing Pipedrive's tail. Every tenant that touches our Kanban asks why we
   don't have the feature Pipedrive shipped in 2019.
2. **Ship zero funnel UI; push everything to external CRM (rejected).** Every
   small tenant now needs a $200/month Pipedrive subscription to see their own
   leads. Coach on a phone can't see "who's coming to the trial tonight" without
   opening a second app.
3. **Ship a thin funnel + first-class external CRM sync (chosen).** Own the
   sports-academy-specific 20%. Delegate the commodity 80% to whoever the tenant
   already uses. Model the sync as an integration provider, not a core feature.

## Decision

### D1 — `growth/crm-leads` is dropped

The `growth/crm-leads` blueprint folder + its generated SDK are removed. Its
purported entities (`Lead`, `LeadActivity`, `Task`) were the same rows the
Registration funnel already models — one module, not two.

### D2 — `sports/registrations` absorbs the funnel

The enrollment funnel lives on `sports/registrations`. The `Registration` row
already carries the pipeline stage
(`stage: lead / contacted / trial / offered / enrolled / declined / expired`).
Two child entities are added:

- **`RegistrationActivity` (`ract_`)** — per-Registration activity log entry.
  `kind IN call / email / sms / note / visit / status_change`, timestamp, actor,
  body. Replaces `growth/crm-leads.LeadActivity`.
- **`RegistrationTask` (`rtsk_`)** — follow-up task on a Registration.
  Assignee + due_at + status + description. Replaces `growth/crm-leads.Task`.

The pipeline UI on the tenant surface is intentionally **a filterable list
view + stage badges + assignment + notes + due dates**, not a Kanban:

- Group-by = stage (renders as swim-lane view visually)
- Stage changes via a dropdown or action button, never drag-drop
- Filters: mine / this week / overdue / source / team / stage
- One-click actions: contact, book trial, make offer, mark won/lost

Fixed pipeline stages. No custom-pipeline configuration. Academies with more
complex sales workflows graduate to an external CRM (ADR 0025 — Lane 1).

### D3 — Sports-specific intake lives in `platform/forms` (new module)

Form management is where the platform genuinely differentiates. HubSpot forms
don't understand "guardian pair with medical upload for a minor whose DOB must
fit a season cutoff." Sports-specific field types (`athlete_data`,
`guardian_pair`, `consent_bundle`, `medical_upload`, `team_preference`) are ours
to own.

`platform/forms` is created as a first-class module — see its blueprint for the
full surface. `sports/season` gains a `form_id` FK: when a season transitions to
`registration_open`, the bound form goes live at the tenant's public URL.

### D4 — External CRM sync is an integration provider

Tenants who want a real CRM configure it in `platform/integrations` under the
`crm_provider` allowlist (`pipedrive`, `hubspot`, `salesforce`, `intercom`,
`active_campaign`, `mailchimp`, `webhook`). See ADR 0025 for the integration
substrate.

Behaviour when configured:

- **Outbound** — on `RegistrationSubmitted` / `RegistrationContacted` /
  `Enrolled` / `RegistrationDeclined`, push to the tenant's CRM (queued,
  retried, idempotent).
- **Inbound** — webhook receiver mirrors stage changes back to
  `Registration.stage`.
- **Conflict rule** — the CRM is source of truth for pipeline manipulation while
  configured; we remain source of truth for the terminal `ENROLLED` state
  (because only we run the atomic Athlete + Enrollment + Invoice transaction).

## Consequences

**Positive:**

- One canonical funnel module, not two. Reviewers stop asking "which module owns
  this row."
- No engineering budget spent chasing Pipedrive-parity features that will never
  win.
- Sports-specific form intake becomes a real differentiator with a dedicated
  module.
- Enterprise tenants who already run HubSpot / Pipedrive get first-class sync
  instead of duplicated data entry.

**Negative:**

- Small academies that expect a "real Kanban" out of the box will find the
  swim-lane list view less polished than Pipedrive. They can either accept it or
  subscribe to Pipedrive.
- Sync-driven attribution requires the tenant's CRM to be online — flaky
  external services degrade the funnel UX. Mitigated by queued / retried
  outbound + eventual-consistency inbound webhooks.

**Neutral:**

- ULID registry changes: `ract_` (RegistrationActivity), `rtsk_`
  (RegistrationTask) added; the previous `growth/crm-leads` prefixes (`lea_`,
  `lac_`, `tsk_`) are freed and marked deprecated in the registry metadata (they
  never shipped in a released schema, so no migration concern).

## Related work

- ADR 0016 — Actions-only, no services, no controllers (atomic conversion runs
  in a single Action).
- ADR 0025 — Integrations two-lane model (provider slots + future marketplace
  apps).
- Blueprint files: `modules/sports/blueprints/registrations/*`,
  `modules/platform/blueprints/forms/*`,
  `modules/platform/blueprints/integrations/*`.
