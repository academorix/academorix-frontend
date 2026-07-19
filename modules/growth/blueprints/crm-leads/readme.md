# crm-leads

Pre-enrollment sales pipeline per blueprint §16.8. Wave 3.

## Owned entities

- `Lead` (`lea_`) — sales pipeline record with stage NEW → CONTACTED → TRIAL →
  WON / LOST.
- `LeadActivity` (`lac_`) — per-lead activity log (calls, emails, notes).
- `Task` (`tsk_`) — follow-up task with due_at + assignee.

## Distinct from sibling modules

- **crm-leads** = SALES pipeline (pre-enrollment).
- **sports/registrations** (Wave 1) = ENROLLMENT funnel (post-lead conversion).
- **growth/marketing** = CAMPAIGNS (lead sources).
- **growth/attribution** = TOUCH TRACKING (lead journey).

## Conversion flow

```
Web form → POST /public/leads/capture → LeadCaptured
       → assignee_user auto-assigned by AutoAssignLead hook
       → Task created for follow-up
CRM UI → sales rep contacts → activity logged → LeadContacted
       → schedule trial → LeadTrialScheduled → creates sports::TrialBooking
Trial   → attends → LeadTrialCompleted
        → enrolls → POST /leads/{lead}/convert
        → creates Athlete + Membership + Invoice
        → LeadConverted + converted_athlete_id set
```

## ULID prefixes

- `lea_`, `lac_`, `tsk_`
