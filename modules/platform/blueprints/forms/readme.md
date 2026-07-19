# forms

Serious form management for academy-specific intake. Wave 2. See
[ADR 0024](../../../../docs/adr/0024-enrollment-funnel-not-a-crm.md) for the
"enrollment funnel is not a CRM" decision that motivates this module.

## What this module owns

- `Form` (`fom_`) — root form definition + which FormVersion is live.
- `FormVersion` (`fmv_`) — immutable schema snapshot per publish.
- `FormSubmission` (`fms_`) — one completed submission + save-and-resume
  session.

## What makes this "serious" and not just Typeform-in-a-database

Sports-native field types. These are the reason we don't outsource to HubSpot /
Typeform / Google Forms:

- `athlete_data` — first / last / DOB / gender / allergies / medical conditions.
  Age-gated against the target season's `age_cutoff_date`.
- `guardian_pair` — primary + optional secondary guardian, with relationship
  codes and per-guardian consent flags.
- `consent_bundle` — photo consent + marketing consent + medical release +
  waiver signature, each individually recorded per GDPR granularity.
- `medical_upload` — file upload + expiry date + issuing physician.
- `team_preference` — preferred team + practice day + time window, validated
  against team age-group + capacity signal.
- `waiver` — signed waiver text hash + signature capture (draw / type).
- `photo_consent` — consented uses (`internal` / `marketing` / `social_media` /
  `press`) + expiry.
- `emergency_contact` — separate contact with relationship code.

## The Season binding

`sports/season` gains a `form_id` FK. Lifecycle:

1. Owner opens a Season (creates it, sets `age_cutoff_date` + capacity).
2. Owner binds a Form (usually one of kind `season_registration`) to the season.
3. Owner transitions the Season to `registration_open`.
4. `PublishFormOnSeasonRegistrationOpen` hook fires → the bound Form publishes
   at `/forms/{signature}` on the tenant's central + tenant host.
5. Parents fill the form → each submission runs the
   `registrations.create_registration` handoff → creates a Registration (see
   `sports/registrations` for the state machine).
6. Owner transitions the Season to `registration_closed` →
   `ArchiveFormOnSeasonRegistrationClosed` hook fires → form URL 404s.

## Save-and-resume

Long forms (medical questionnaires, guardian pair with multiple children) need
pause + finish support. Implementation:

1. On `POST /forms/{signature}/start`, we create a `FormSubmission` with
   `status='in_progress'` and mint a `session_signature`.
2. Client stores the session signature; every field edit `PATCH`es
   `/forms/{signature}/session/{sessionSignature}`.
3. If the user provides an email early enough, we send a resume-session email
   with a signed URL that carries the session_signature.
4. Session TTL is 72h by default (per-form configurable via
   `settings.session_ttl_hours`).
5. `PurgeAbandonedSessionsJob` sweeps expired sessions daily, transitions to
   `abandoned`.

## Handoff mechanism

Every form declares zero or one **handoff slug**. On `FormSubmissionCompleted`:

1. The handoff registry looks up the slug (e.g.
   `registrations.create_registration`).
2. The registered `#[AsFormHandoff]` handler receives normalised answers + the
   submission row.
3. The handler runs the appropriate domain action — usually an atomic
   multi-write like `AtomicallyConvertOnOfferAccepted` in
   `sports/registrations`.
4. On success: `FormHandoffFired` event; `handoff_target_type + _id` set on the
   submission.
5. On failure: `FormHandoffFailed` event; retried per exponential backoff via
   `RunFormHandoffJob`.

Feedback surveys (`kind = feedback_survey`) can leave `handoff_slug` NULL —
answers just live on the FormSubmission row.

## Public URL surface

`GET /forms/{signature}` — anonymous, signed, non-enumerable URL. The signature
is stored as `Form.public_url_signature` and rotates on regenerate.

Anti-abuse:

- Rate-limited by IP (per `forms.public-submission-rate-limit` middleware).
- Honeypot field + submission-timing heuristic (bot defense before CAPTCHA).
- Optional hCaptcha / Cloudflare Turnstile on Enterprise.

## Sensitivity + retention

The submission inherits the sensitivity of its most-sensitive answer field.
`medical_upload` or `medical_questionnaire` fields promote the submission
sensitivity to `Medical` → 7-year retention. Ordinary registration submissions
are `Pii` → 2-year retention. Feedback surveys with no PII are `Public` →
90-day + 2-year window.

GDPR erasure: on user account deletion, submissions where the submitter matches
the deleted user get `answers` replaced with `[REDACTED]` tombstone. The
submission shell (timestamps, handoff pointers, form_version_id) remains for
downstream FK integrity — the `Registration`, `MedicalClearance`, etc. records
the submission handed off to keep their provenance link.

## ULID prefixes

- `fom_` — Form
- `fmv_` — FormVersion
- `fms_` — FormSubmission
