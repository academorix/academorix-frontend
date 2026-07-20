# coaching — SDUI blueprints

## Surfaces

The coaching module ships SDUI blueprints for four entity surfaces + one coach
self-service dashboard.

### `resources/coaching-profile/`

- `list.screen.json` — table of all coaching profiles for the tenant. Filter
  chips: primary_sport, is_active, verified. Row: coach avatar + name (via
  staff->user->profile), primary sport chip, certification count badge (with
  expiring-warning), verification-badge, is_accepting_new_athletes chip, row
  actions (view, edit, verify, deactivate).
- `create.screen.json` — multi-card create form. Card 1: staff picker (filters
  to Staff without an existing profile). Card 2: sport + specializations +
  coaching_since_year. Card 3: bio + photo + availability. Card 4: hourly rate
  (permission-gated).
- `edit.screen.json` — same cards; staff_id read-only. Rate card hidden without
  `coaching_profiles.update.rate` permission.
- `verify.screen.json` — admin verification dialog. Shows the profile summary +
  verified-by field + optional notes.

### `resources/coach-assignment/`

- `list.screen.json` — table of assignments. Columns: coach, assignable (with
  type chip), role badge, start_date, end_date (or "open"), conflict-warning
  chip.
- `create.screen.json` — assignment form with coach picker (searchable ComboBox
  over verified + active profiles) + assignable-type toggle (Session / Team /
  Event) + assignable picker (dependent on type) + role selector + date range.
- `end.screen.json` — end-assignment dialog. Sets end_date + optional reason.

### `resources/coach-certification/`

- `list.screen.json` — table of certifications with expiration-badge column.
  Filter chips: verified, expiring_within_days. Sort by expires_at ascending.
- `create.screen.json` — cert capture form. Fields: coach picker + issuing_body
  (autocomplete from catalog) + certification_name + level + issued_at +
  expires_at + verification_url + document upload (Wave 4+ storage).
- `verify.screen.json` — admin verification dialog. Shows cert summary +
  verified-by + optional notes. Enterprise-tier only
  (coaching_advanced_certifications).

### `resources/coach-skill-rating/`

- `list.screen.json` — table of ratings. Columns: coach, ratable
  (sport/discipline/position chip), rating (stars widget), rated_by, rated_at,
  expires_at.
- `create.screen.json` — rating form. Coach picker + ratable-type toggle +
  ratable picker + scale + value + optional notes + optional expires_at.

### `resources/coach-self-service/`

- `dashboard.screen.json` — the coach's `/me` dashboard. Cards: profile summary
  (bio + primary sport + specializations) + upcoming assignments +
  certifications with expiration alerts + received ratings (values only; notes
  redacted) + availability editor.

### `widgets/`

- `coach-status-chip.widget.json` — compact chip showing profile.is_active +
  verified state (green "Active + Verified", yellow "Pending verification", grey
  "Inactive").
- `certification-expiration-badge.widget.json` — traffic-light chip showing
  days_until_expiry: green (> 90d), yellow (30-90d), red (< 30d),
  grey-strikethrough (expired).
- `skill-rating-stars.widget.json` — renders 1-5 stars OR level label based on
  rating_scale. `stars_1_5` shows ★★★★☆; `level_5_stage` shows "Expert (4)".
- `availability-calendar.widget.json` — day-of-week grid showing the coach's
  availability_json ranges. Interactive on the coach's own /me/profile screen;
  read-only elsewhere.

## Notes on `ComboBox` over `Select`

Every picker uses HeroUI `ComboBox` per `ui-components.md`. Especially relevant
for:

- **Staff picker** (create.screen.json) — filters to Staff rows without an
  existing profile. Large tenants may have 50+ Staff; the filterable ComboBox is
  essential.
- **Sport picker** — filters over 30+ sports catalog.
- **Ratable picker** — Sport / Discipline / Position picker; the
  discipline/position lists are sport-dependent so the ComboBox lets the admin
  type-through.
- **Issuing body picker** — autocomplete over 30+ issuing bodies catalog.

## Entitlement-driven rendering

The screens check tenant entitlements before rendering:

- The "Create profile" button on list.screen.json is disabled + shows a "Slot
  limit reached" chip when `coaching_profile_slot_used >= coaching_profile_slot`
  cap.
- The document-upload field on create/verify screens is hidden when
  `coaching_advanced_certifications=false` (Small tenants).
- The verify button on cert list is hidden when
  `coaching_advanced_certifications=false`.
- The ratings list + widgets hide entirely when `coaching_skill_ratings=false`.
- The multi-branch assignment picker restricts to the coach's primary branch
  when `coaching_multi_branch=false`.
- The public-directory-preview toggle on the profile-edit screen is hidden when
  `coaching_public_directory=false`.
- The hourly-rate card is hidden without `coaching_profiles.view.rate`
  permission (regulated_financial-tier).

## Minor-safeguarding rendering

Coach profiles referenced by sessions/teams/events with minor athletes render
additional visual cues:

- The verification-badge widget shows a red-outlined "REVIEW" chip when
  profile.verified_by_admin_at=null OR the coach lacks a valid SafeSport
  certification.
- Coach photos on customer-facing directory screens require the signed URL to
  carry a `hint=minors_cohort` flag; downstream image renderers may apply extra
  scrutiny.
