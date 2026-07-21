# audit — SDUI blueprints

Server-Driven UI for the audit surface. Read-only for audit rows; CRUD for
retention policies + export requests. Every surface enforces the
compliance-officer scoped permission set defined in `permissions.json` and the
`audit.enforce_read_only` middleware wraps the row screens.

## Surfaces

### `resources/audit/`

Tenant compliance-officer surface for the audit trail. READ-ONLY over HTTP.

- `list.screen.json` — filterable audit list. Filters: user, auditable_type,
  auditable_id, event, since, until. Renders the `audit-event-chip` per row +
  actor context + diff-summary widget.
- `show.screen.json` — single audit row detail. Old_values + new_values redacted
  by default; `Reveal raw diff` button gated by `audit.audits.reveal_raw_diff`
  permission. Every reveal writes a chain-of-custody meta-audit row.
- `by-entity.screen.json` — per-entity audit trail. Prompts for auditable_type +
  auditable_id (URL params); renders reverse-chronological audit list scoped to
  that entity.
- `by-user.screen.json` — per-user audit trail. Prompts for user_id (URL param);
  renders reverse-chronological audit list scoped to that actor.

### `resources/audit-retention-policy/`

Tenant admin surface for retention overrides. Enterprise-only (via
`audit_retention_extended` entitlement).

- `list.screen.json` — current retention policy (one-active-policy-per-tenant
  invariant means this is always exactly one row or zero rows). Shows
  `is_active`, `days_until_expiry`, `override_reason` (full for compliance
  officer, trimmed for owner).
- `create.screen.json` — retention override wizard. Prompts for retention_years
  (1-10 slider) + override_reason (multiline text) + override_ends_at (optional
  date; null = indefinite). Suggested reason presets from
  `data/retention-jurisdictions.json` (SOX §404, HIPAA §164.316(b)(2)(i),
  regulator hold, litigation hold, etc).
- `edit.screen.json` — update override. Same fields; retention_years is editable
  but subject to same validation.

### `resources/audit-export/`

Tenant compliance-officer surface for async DSAR + regulator exports.

- `list.screen.json` — list of past + in-progress exports. Renders status + row
  count + signed URL (when ready, expires) per row.
- `create.screen.json` — export request wizard. Kind (dsar / regulator /
  legal_hold) + filters (auditable_type, auditable_id, user_id, since, until)
  - format (jsonl / csv). Rate-limited to 20/day.
- `show.screen.json` — export detail with signed URL + manifest SHA-256 for
  chain-of-custody verification.

## Widgets

- `audit-event-chip.widget.json` — colour-coded chip for `Audit.event`. Vendor
  default events: `created` = success, `updated` = info, `deleted` = warning,
  `restored` = accent. Custom events: `auth.*` = primary, `consent.*` =
  secondary, `transaction.*` = success, `read.*` = muted, `audit.*` = meta
  (badge).
- `audit-diff-summary.widget.json` — inline diff summary. Renders
  `{ changed_fields.length } fields changed` + first 3 field names, safe for
  tenant wire without raw_diff reveal.
- `audit-retention-status.widget.json` — retention-policy state indicator. Shows
  current effective retention_years + days_until_expiry (with a warning color
  when < 30 days).
- `audit-export-status-chip.widget.json` — colour-coded chip for
  `AuditExport.status`: pending = info, running = accent, completed = success,
  failed = danger, expired = muted.
