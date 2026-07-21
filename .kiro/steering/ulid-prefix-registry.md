---
inclusion: manual
---

# Stackra — ULID Prefix Registry

Every persisted entity's primary key is a **prefixed ULID**: a short semantic
tag + `_` + 26 base32 characters. For example:

```
wsp_01HXYZABCDEFGHJKMNPQRSTVW   Workspace
pln_01HXYZABCDEFGHJKMNPQRSTVW   Plan
tpl_01HXYZABCDEFGHJKMNPQRSTVW   NotificationTemplate
```

The prefix is unique across the entire platform + globally documented in the
registry at `modules/shared/foundation/data/ulid-prefixes.json`. This steering
doc is the human-readable index; the JSON file is the machine-readable source of
truth.

## Why prefixed ULIDs (and not plain UUIDs)

- **Human-readable in logs + support tickets.** `wsp_01HXYZ...` is immediately
  obvious as a workspace ID; a bare UUID is opaque.
- **Type-safety in code review.** Confusing a `pln_...` (Plan) with a `psub_...`
  (PlanSubscription) is a bug caught by eye in the diff.
- **Sortable + monotonically increasing.** ULIDs are time-ordered, unlike random
  UUIDv4. Every DB scan by primary key returns rows in creation order for free.
- **URL-safe + compact.** Base32 encoding beats base64 for readability + is
  smaller than a UUID with dashes.

## The rules

Enforced by `modules/shared/foundation/scripts/validate-module-graph.py`:

1. **Every prefix is 3–4 lowercase ASCII letters + trailing underscore.** Regex:
   `^[a-z]{3,4}_$`. Grandfathered exceptions are marked `grandfathered: true` in
   the registry (currently: `sq_` at 2 chars, `ssync_` at 5 chars — both slated
   for rename).
2. **First-registered wins.** Prefix collisions are refused at CI time. Adding a
   new entity requires an unused prefix.
3. **Renames go through the registry.** The `renaming_history` array logs every
   rename with `from`, `to`, `date`, `reason`. Renamed entries carry a
   `renamed_from` field for traceability.
4. **Reserved prefixes for planned modules** live under `reserved_for_future`.
   Currently reserved: `usr_` (User), `org_` (Organization), `reg_` (Region),
   `brn_` (Branch), `tea_` (Team), `fac_` (Facility), `spo_` (Sport).

## Recent renames (July 14 2026)

Ten prefixes shortened for readability + entity-qualifying clarity:

| Old        | New    | Entity                                                  |
| ---------- | ------ | ------------------------------------------------------- |
| `contact_` | `wct_` | WorkspaceContact                                        |
| `brand_`   | `brd_` | Branding                                                |
| `ident_`   | `ide_` | Identity                                                |
| `intg_`    | `wit_` | WorkspaceIntegration (entity-qualifying to free `int_`) |
| `invite_`  | `inv_` | Invitation                                              |
| `invevt_`  | `ive_` | InvitationEvent (6 chars → 3 chars)                     |
| `notif_`   | `not_` | Notification                                            |
| `aver_`    | `apv_` | ApiVersion                                              |
| `dnot_`    | `dep_` | DeprecationNotice                                       |
| `dnsr_`    | `drc_` | DomainRecord                                            |

Every rename mutates: schema `keyPrefix`, schema `pattern` regex, example ULID
literals in prose, backticked prefix mentions in docs. The regex-anchored
bulk-rename script (used once, deleted after) touched 21 files with 93
substitutions across all modules.

## Current registry (by module)

Full details in `modules/shared/foundation/data/ulid-prefixes.json`. Summary by
owning module:

- **workspaces** — `wsp_` (Workspace), `app_` (Application), `dom_` (Domain),
  `drc_` (DomainRecord), `brd_` (Branding), `ide_` (Identity), `wct_`
  (WorkspaceContact), `wit_` (WorkspaceIntegration)
- **activity** — `act_`
- **audit** — `aud_`
- **versioning** — `apv_` (ApiVersion), `dep_` (DeprecationNotice)
- **entitlements** — `ent_` (Entitlement), `use_` (EntitlementUsage)
- **subscription** — `pln_` (Plan), `psub_` (PlanSubscription), `sub_`
  (Subscription — legacy alias), `supp_` (PlanSupplement)
- **invitations** — `inv_` (Invitation), `ive_` (InvitationEvent)
- **notifications** — `not_` (Notification), `delv_` (NotificationDelivery),
  `tpl_` (NotificationTemplate), `pref_` (NotificationPreference), `cat_`
  (NotificationCategory), `dgst_` (NotificationDigest)
- **newsletter** — `nlp_` (Newsletter), `nli_` (NewsletterIssue), `nlc_`
  (NewsletterCampaign), `nla_` (NewsletterAudience), `nls_`
  (NewsletterSubscription)
- **webhook** — `wsub_` (WebhookSubscription), `wdlv_` (WebhookDelivery)
- **localization** — `lng_` (PlatformLanguage), `wsl_` (WorkspaceLocale), `trn_`
  (Translation), `tjb_` (TranslationJob)
- **transfer** — `xfer_` (Transfer), `xart_` (TransferArtifact), `xmap_`
  (TransferMapping), `xshd_` (TransferSchedule)
- **search** — `sidx_`, `sopt_`, `syn_`, `sae_`, `sev_`, `sq_` (grandfathered),
  `ssync_` (grandfathered)
- **settings** — `set_`
- **geofencing** — `gfc_`

## Adding a new entity

1. Pick an unused 3–4 letter prefix that reads as the entity name (e.g. `apv_`
   for ApiVersion, not `ap_`).
2. Check the registry `reserved_for_future` block — don't collide with a
   reserved prefix.
3. Add the prefix to `modules/shared/foundation/data/ulid-prefixes.json` under
   `prefixes` with `module`, `entity`, and `description`.
4. Declare the same prefix on the model schema via `x-eloquent.keyPrefix` + a
   matching JSON Schema `pattern` on the `id` property.
5. Run the validator. It refuses schemas whose `keyPrefix` isn't in the
   registry.

## Renaming a prefix

1. Update the registry: change the `prefixes` entry's key from old to new, set
   `renamed_from: "<old>"` on the entry.
2. Add an entry to `renaming_history` with `from`, `to`, `date`, `reason`.
3. Grep the codebase for the old prefix in the four ULID contexts:
   - `"keyPrefix": "<old>_"`
   - `"pattern": "^<old>_[0-9A-HJKMNP-TV-Z]{26}$"`
   - ULID literals: `<old>_01HXYZ...`
   - Prose backticks: `` `<old>_` ``, `` `<old>_<26 chars>` ``
4. Substitute + verify no residual references.
5. Run the validator. Every rename must have a matching `renaming_history`
   entry, or the traceability check fails.

## Anti-patterns

- **Two-char prefixes.** `sq_` is grandfathered but reads as "SQL" or something
  else. Every new entity uses 3+ chars.
- **Cryptic contractions.** `dnot_` for DeprecationNotice was replaced with
  `dep_` because nobody read the shorter form correctly.
- **Reusing an old prefix for a new entity.** Even after a rename, don't claim
  the old prefix — customer data may still reference it. Every renamed prefix
  stays reserved permanently.
- **Custom key formats.** Every persisted ID is a prefixed ULID; no exceptions.
  The one-off "let's use a slug as a key" impulse should be refactored to `slug`
  as a UNIQUE column with a ULID `id` alongside.

## What this doc does NOT do

- **Does not repeat every prefix's description.** Full details in
  `modules/shared/foundation/data/ulid-prefixes.json`.
- **Does not decide which entities need ULIDs.** Every persisted entity does;
  that's the architectural convention documented in
  `frontend-module-architecture.md` and the backend module standard.
