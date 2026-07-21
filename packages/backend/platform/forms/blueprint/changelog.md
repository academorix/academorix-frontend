# forms — changelog

## [Unreleased] — inception (Wave 2)

- Three owned entities: Form (`fom_`), FormVersion (`fmv_`), FormSubmission
  (`fms_`).
- Sports-native field types: `athlete_data`, `guardian_pair`, `consent_bundle`,
  `medical_upload`, `team_preference`, `waiver`, `photo_consent`,
  `emergency_contact`.
- `#[AsFormFieldType]` + `#[AsFormHandoff]` attribute-driven discovery via
  Foundation's DiscoversAttributes seam.
- Save-and-resume via signed session URLs — 72h default TTL.
- Multi-language support via per-locale label bundles on FormVersion.
- Handoff registry — completed submissions can atomically create domain entities
  (Registration / MedicalClearance / WaiverConsent).
- Session encryption at rest for medical / safeguarding-classified answers via
  AnswerCipher.
- 13 published events including the P0 `FormSubmissionCompleted` +
  `FormHandoffFired` chain.
- Bound to `sports/season` via `season.form_id` — season lifecycle drives form
  publish + archive.

### Dependencies

- `foundation`, `tenancy`, `application`, `user`, `storage`, `branding`,
  `notifications`, `audit`, `activity`, `compliance`.

### Planned consumers

- `sports/season` (binds a form + publishes on registration_open)
- `sports/registrations` (receives the handoff)
- `sports/medical` (medical clearance flow)
- `platform/safeguarding` (waiver update flow)
- `platform/public-site` (embeds form on the tenant's public marketing site)
- `platform/reception` (staff-assisted intake — logged-in submission)
- `platform/ai` (custom-survey NPS analysis)

### Related decisions

- ADR 0024 — enrollment funnel is not a CRM.
- ADR 0025 — integrations two-lane model (form-field-types via
  #[AsFormFieldType] are one of the pluggable extension points reserved for
  future Lane 2).

### ULID prefixes

- `fom_` (Form), `fmv_` (FormVersion), `fms_` (FormSubmission) — registered in
  `modules/shared/blueprints/foundation/data/ulid-prefixes.json`.
