# leads

Pre-enrollment CRM funnel. Wave 5 growth infrastructure. Owns the top-of-funnel
sales pipeline that sits upstream of `sports::registrations` (which owns actual
enrollment). Every prospective family lands as a `Lead`, moves through a
deterministic state machine (`NEW → CONTACTED → QUALIFIED → TRIAL → WON /
LOST`), and — on conversion — hands materialised athlete records off to the
sports side while the attribution snapshot travels to `marketing` for
ad-network fan-out.

## 1. What this module owns

| Concern                             | Owned artefact                                                                                                          |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Canonical prospect row              | `Lead` — one row per prospective family; carries source, stage, assigned owner, attribution snapshot, LTV estimate.     |
| Timeline of touchpoints             | `LeadActivity` — append-only per-lead activity log. Every note, email, call, meeting, stage-change, assignment.         |
| Follow-up work                      | `LeadTask` — assigned tasks with priority + due date + status. Powers the reception day-plan.                           |
| State machine                       | `LeadStageTransitionValidator` — enforces the six-stage progression + guards against illegal reverse transitions.       |
| Attribution snapshot                | `LeadAttributionSnapshotter` — pulls from `growth::attribution` at capture + freezes into `leads.attribution_snapshot`. |
| Conversion pipeline                 | `LeadConversionService` — materialises athlete records via `sports::registrations` + fires `LeadConverted`.             |
| Funnel reporting                    | `LeadFunnelReporter` — funnel-conversion + source-attribution rollups over the lead + activity ledgers.                 |
| Stale-lead reassignment             | `ReassignStaleLeadsJob` — round-robin reassigns leads without recent activity to the next available staff owner.        |

### 1.1 The three owned tables

- `leads` — canonical row per prospective family. Belongs to `Tenant`. 7-year
  retention (regulator lookback on marketing conversions + funnel retros).
- `lead_activities` — append-only timeline. Belongs to `Tenant` + `Lead`
  (CASCADE). 2-year retention.
- `lead_tasks` — follow-up work. Belongs to `Tenant` + `Lead` (CASCADE).
  Retained while active + 90d grace after last-completed.

None carry `application_id`, `region_id`, `organization_id`, or `scope_node_id`
— every row is tenant-scoped per `tenancy-columns.md` §3, with the forbidden
columns of §5 explicitly absent. Enforced by the tenancy-compliance-auditor.

## 2. The state machine

```
       NEW ──► CONTACTED ──► QUALIFIED ──► TRIAL ──► WON
                                                    │
                                                    ▼
                                                   LOST
```

- **Forward transitions** run through `LeadStageTransitionValidator`. Each
  transition writes a `stage_change` activity via the observer.
- **Skipping stages** is permitted (e.g. `NEW → TRIAL` for a walk-in trial
  booking) but the validator flags it in the audit trail.
- **Backward transitions** (e.g. `TRIAL → CONTACTED`) require an explicit
  `force: true` on the request AND admin+owner-role narrowing on the policy.
- **`WON` is terminal** — `converted_at` immutable, `converted_athlete_ids`
  frozen.
- **`LOST` requires `lost_reason`** on the same transition request.

## 3. How data flows into and out of this module

- **In**: web form submissions land as `POST /api/v1/leads` from the tenant's
  public site; imports arrive via `leads:list --import`; referrals originate
  from `growth::referrals` (Wave 5+); reception role manually creates walk-in
  leads.
- **Out**: on `LeadConverted`, three consumers materialise state simultaneously
  — `sports::registrations` creates athlete + guardian rows,
  `marketing::MarketingEventCapturer` emits a `signup` marketing event, and
  `notifications` dispatches the owner + admin celebration + kick-off-onboarding
  workflow. The attribution snapshot travels with `LeadConverted`, guaranteeing
  ROAS attribution stays stable across attribution resets.

## 4. Cross-references

- `hierarchy.md` §7 — tier matrix (feature gating).
- `hierarchy.md` §11 — the growth + observability lane split.
- `tenancy-columns.md` §3 — every leads table carries `tenant_id`.
- `tenancy-columns.md` §5 — forbidden columns absent from every leads row.
- `modules/growth/blueprints/attribution/` — feeds `leads.attribution_snapshot`.
- `modules/growth/blueprints/marketing/` — consumes `LeadConverted` as `signup`.
- `modules/sports/blueprints/registrations/` — receives materialised athletes.
- `.ref/DOMAIN_MODULES_BLUEPRINT.md` §16.8 — the CRM / Leads / Trials
  specification this blueprint implements.
