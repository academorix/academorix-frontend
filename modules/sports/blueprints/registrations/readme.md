# registrations

Enrollment + waitlist funnel per blueprint §12.4. Wave 1 sports.

## Owned entities

- `Registration` (`srg_`) — root funnel record with state machine.
- `TrialBooking` (`trb_`) — trial (taster) session.
- `WaitlistEntry` (`wle_`) — position-ordered waitlist.
- `Offer` (`off_`) — time-boxed offer with signed public accept URL.

## State machine

```
LEAD ──► CONTACTED ──► TRIAL ──► OFFERED ──► ENROLLED (terminal)
   │           │          │         │
   │           │          │         └──► DECLINED / EXPIRED / WITHDRAWN
   │           │          └──► WAITLISTED ──► OFFERED (via auto-offer)
   │           └──► DECLINED
   └──► DECLINED / EXPIRED
```

Terminal states: `enrolled` / `declined` / `expired`.

## Conversion on offer accept

`AtomicallyConvertOnOfferAccepted` hook runs in a single DB transaction:

```
BEGIN;
  SELECT * FROM offers WHERE id = ? AND status = 'open' FOR UPDATE;
  SELECT * FROM teams WHERE id = ? FOR UPDATE;  -- verify capacity
  IF capacity exceeded → ROLLBACK + fail with CAPACITY_EXCEEDED;

  INSERT INTO athletes (…);
  INSERT INTO athlete_enrollments (…);
  INSERT INTO invoices (…);          -- via finance/invoice
  UPDATE offers SET status = 'accepted', accepted_at = now(), accepted_by_user_id = ?;
  UPDATE registrations SET stage = 'enrolled', converted_* = …, enrolled_at = now();
  DELETE FROM waitlist_entries WHERE registration_id = ? (if any);
COMMIT;

Fire events: OfferAccepted, Enrolled.
```

## Waitlist auto-offer

`AutoOfferOnCapacityFreedJob` fires on `EnrollmentWithdrawn` /
`AthleteEnrollmentArchived` / manual capacity increase:

```
BEGIN;
  SELECT team capacity + current enrolled_count FOR UPDATE;
  IF capacity available:
    SELECT head-of-queue waitlist_entry (position = 1, auto_offer_enabled = true) FOR UPDATE;
    UPDATE waitlist_entry SET removed_at = now(), removed_reason = 'offer_extended';
    INSERT INTO offers (…, expires_at = now() + 48h);
    UPDATE registrations SET stage = 'offered';
    Reorder positions (shift 2 → 1, 3 → 2, …).
COMMIT;

Fire events: OfferMade + WaitlistPositionChanged.
```

## Public + tenant surfaces

- **Public** — `POST /public/registrations` accepts anonymous submissions;
  captures attribution + consent snapshot. Signed URL for offer accept
  (`GET /offers/{signature}` + `POST /offers/{signature}/accept`) — guardian
  doesn't need a login to accept.
- **Tenant** — admin drives the pipeline: contact / book trial / make offer /
  waitlist. Owner sees conversion funnel via `GET /reports/conversion-funnel`.

## Cross-module handoffs

- **In**: `growth/crm-leads` on lead conversion → creates a Registration
  (source=crm_lead, source_ref_id=lead_id).
- **In**: `growth/marketing` + `growth/attribution` — first-touch + last-touch
  attribution captured on submission.
- **Out** (on ENROLLED): `sports/athlete` (creates Athlete),
  `sports/athlete-enrollment` (creates roster row), `finance/invoice` (raises
  enrollment invoice), `finance/membership` (starts membership).
- **Cascade in**: `sports/season.registration_windows` gate submissions;
  `sports/season.age_cutoff_date` gates trial + offer + convert transitions.

## Retention

- 3 years for terminal Registrations (declined / expired). Marketing analytics
  retention (regulatory conversion tracking).
- Enrolled Registrations retained indefinitely (career-timeline provenance).
- TrialBooking / WaitlistEntry / Offer co-terminous with parent Registration.

## ULID prefixes

- `srg_` — Registration
- `trb_` — TrialBooking
- `wle_` — WaitlistEntry
- `off_` — Offer
