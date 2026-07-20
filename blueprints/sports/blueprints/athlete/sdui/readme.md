# athlete — SDUI blueprints

## Surfaces

### `resources/athlete/`

Tenant-facing Athlete management.

- `list.screen.json` — filterable + sortable table. Columns: photo/name, age (via `age-group-badge` widget when snapshot resolved), branch, status chip, has-user chip, is-minor chip (safeguarding-yellow), consent status. Filters: branch, status, age_group, is_minor, has_user, consent_expiring. Row actions: view detail, edit, pause, graduate, withdraw, archive.
- `create.screen.json` — 4-card form. Card 1: identity (first_name + last_name + preferred_name + DOB + gender + pronouns). Card 2: branch + optional user link + external_id + primary_language + profile_photo_url. Card 3: emergency contact cluster (name + phone + relationship — permission-gated field visibility). Card 4: consent snapshot (photo + medical + third-party toggles + recorded-by picker).
- `edit.screen.json` — same four cards BUT `date_of_birth`, `branch_id`, `user_id` are read-only (all immutable post-create). Age group snapshot section is read-only (job-owned). Warning banner: "Editing emergency contact fires a safeguarding audit event retained 7 years."
- `medical-detail.screen.json` — dedicated sub-resource for the medical cluster. Only rendered when `features.athlete.medical_tracking` is on AND caller carries `athletes.view.medical`. Four sections: conditions, allergies, medications, notes. Each field has an "audit history" drawer showing the athlete_medical_history entries with 7-year retention.

### `widgets/`

- `athlete-picker.widget.json` — HeroUI `ComboBox` (per the ui-components rule — searchable single-select is essential across catalogs that grow to hundreds of entries on Enterprise tenants). Options group by branch (`ListBox.Section`). Filters to `filter[status]=active` by default. Consumed by AthleteEnrollment form + Team roster form + Event registration form.
- `age-group-badge.widget.json` — compact chip showing the athlete's snapshotted age group. Chip color from AgeGroup.color. When is_minor=true, subscript "minor" chip in safeguarding-yellow variant.
- `consent-summary.widget.json` — inline three-icon summary (photo / medical / third-party). Icon states: green-check (consented + recorded), yellow-warning (consented but > 335 days ago — reminder tier), red-x (not consented). Clicking opens the consent modal for guardians / admins.
- `minor-badge.widget.json` — a dedicated "MINOR" chip in safeguarding-yellow (icon: shield-check) rendered anywhere an athlete surface appears to remind coaches + reception staff of the safeguarding tier. Automatically applied by the athlete-list DataGrid + the athlete-picker options.

## Notes on `ComboBox` over `Select`

Every picker on this module (athlete, age-group, gender, dominant-hand, withdrawal-reason) uses HeroUI `ComboBox` — not `Select` — per the `ui-components.md` rule. Reasoning:

- **Athlete-picker** — Small tenants have 15 athletes; Enterprise tenants may have thousands. Search is essential from day one.
- **Age-group-picker** (embedded in filters) — see the age-group module readme for full rationale.
- **Gender-picker + dominant-hand-picker** — only 3-4 options each, so `Select` would be defensible, but we standardise on `ComboBox` to keep every picker consistent + leave room for future extensions (e.g. adding a "prefer to self-describe" field with free text).

## Minor-safeguarding rendering

Every screen + widget check `athlete.is_minor` before rendering age-adjacent content. When true:

- The `minor-badge` widget renders in the athlete header + list row.
- Medical section renders with a red-tinted border + "MEDICAL — guardian consent required to display" banner when `consent_medical_disclosure=false` (guardians see; peers don't).
- Photos in the athlete-list DataGrid render with a placeholder icon (never the actual photo) when `consent_photo_release=false` OR the caller is at the platform-admin plane.
- Communications-adjacent buttons (Send message / Send email) are DISABLED for minors — direct-to-athlete comms are always guardian-routed.

## Conditional fields in create.screen.json

- The `user_id` picker is hidden by default (most athlete creates are for minors without accounts). Toggle "link to existing user" expands the picker.
- The emergency contact + consent cards render only when the caller has the corresponding permissions (`athletes.manage.emergency_contact` / `athletes.manage.consents`); otherwise the cards are collapsed with an "Add later via HR" hint.
- Medical fields are NEVER rendered on the create form — the medical cluster is edit-only via the dedicated sub-resource (route the caller after create).

## Entitlement-driven rendering

The create + edit + medical-detail screens check the tenant's active entitlements before rendering fields:

- Medical section renders only when `entitlements.athlete_medical_tracking=true`; otherwise a "Not on your plan" chip + upgrade CTA appears.
- Consent workflow section renders full expiry + revocation history only when `entitlements.athlete_consent_workflow=true`; otherwise the bare three-toggle snapshot renders.
- The "Create athlete" button on the list screen is disabled + shows a slot-usage bar with an upgrade prompt when `athlete_slot.is_exceeded=true`.

## Guardian-portal considerations (Wave 3b hooks)

When the AthleteGuardian sibling module lands, this module's SDUI updates:

- `athlete-picker` filters to WHERE the caller is an active AthleteGuardian on the option (via `.own` scope).
- The `medical-detail` screen shows the medical cluster to guardians ONLY when `athlete.consent_medical_disclosure=true` (MedicalDisclosureGate).
- The consent recording modal accepts `recorded_by_user_id` from the athlete's authorised guardian list (dropdown, not free-text).
