# attribution — SDUI blueprints

## Surfaces

### `resources/attribution/`

Tenant-facing attribution management. Owner + admin see full profile detail;
marketing sees aggregated rollups without individual PII.

- `list.screen.json` — filterable list of attribution profiles by
  subject_type, lifecycle_state, first_touch_source, first_touch_campaign.
  Marketing role gets the aggregated variant; admin + owner get the full
  detailed variant.
- `view.screen.json` — one profile's full view. Shows first-touch snapshot,
  last-touch snapshot, device + consent snapshot, touchpoint timeline (last
  N via `attribution-timeline` widget), lifecycle transitions.
- `merge.screen.json` — Enterprise-only. Admin merge dialog. Lists candidate
  anonymous profiles (matching session_id / ip_hash / device_hash within 30
  days) + preview of what the merge would absorb.
- `reset.screen.json` — GDPR right-to-erasure request. Prompts for
  confirmation + reason. Explains what happens: profile fields redacted
  immediately, touchpoints hard-deleted 90 days out.

### `widgets/`

- `attribution-source-chip.widget.json` — colour-coded chip for source
  bucket (paid / organic / social / referral / direct / email / affiliate /
  unknown). Shown on the list + view screens next to each profile.
- `attribution-timeline.widget.json` — vertical timeline of the last N
  touchpoints for a profile. Shown on the view screen + the my-attribution
  self-serve screen.

## Design notes

- **NO campaign-rollup screen here.** The campaign rollup surface is a
  cross-cutting dashboard owned by the marketing module (Wave 5) — it
  aggregates data from attribution, marketing, analytics, and referrals into
  a single view. This module ships only the individual-profile surfaces.
- **The `attribution-source-chip` widget** is used cross-tier: the same widget
  renders in downstream marketing / analytics / referrals screens when they
  need to show a source bucket. This module owns the widget definition.
- **`my-attribution` screens** live in the user-plane SDUI (owned by the
  frontend `@stackra/ui` package) — those are trivial variants of
  `view.screen.json` restricted to the caller's own profile. Not shipped as
  blueprint files here because they don't add any structural surface.
