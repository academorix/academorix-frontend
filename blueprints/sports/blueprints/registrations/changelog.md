# registrations — changelog

## [Unreleased] — inception (Wave 1)

- Four owned entities: Registration / TrialBooking / WaitlistEntry / Offer.
- State machine LEAD → CONTACTED → TRIAL → OFFERED → ENROLLED with side-branches
  WAITLISTED / DECLINED / EXPIRED.
- Atomic conversion on offer accept — Athlete + AthleteEnrollment + Invoice
  created in one DB transaction via `AtomicallyConvertOnOfferAccepted`.
- Waitlist auto-offer on capacity free via `AutoOfferOnCapacityFreedJob` with
  position reorder.
- Public accept URL — signed offer link; guardian accepts without a login.
- Rate-limited public form submission via `registrations.public-form-rate-limit`
  middleware (10/hr/IP).
- Age-eligibility gate via `ValidateAgeAgainstSeason` on TRIAL / OFFER / CONVERT
  transitions.
- Attribution capture on submit — first-touch + last-touch stored in
  `attribution` JSONB.
- 14 published events including atomic-convert `Enrolled` + waitlist
  `WaitlistPositionChanged` + auto-decline `OfferExpired`.
- 7 notification categories including cannot-opt-out `EnrolledNotification`.

### Dependencies

- `foundation`, `tenancy`, `application`, `user`, `athlete`,
  `athlete-enrollment`, `athlete-guardian`, `age-group`, `season`, `teams`,
  `coaching`, `facility`, `invoice`, `payment`, `notifications`, `storage`.

### Planned consumers

- `crm-leads` (converts on lead handoff)
- `reception` (front-desk walk-in registrations)
- `public-site` (registration form block)
- `reporting` (conversion funnel dashboards)
- `ai` (auto-triage + reminders)
- `growth/marketing`, `growth/attribution` (source tracking)

### ULID prefixes

- `srg_` (Registration), `trb_` (TrialBooking), `wle_` (WaitlistEntry), `off_`
  (Offer) — registered in
  `modules/shared/blueprints/foundation/data/ulid-prefixes.json`.
