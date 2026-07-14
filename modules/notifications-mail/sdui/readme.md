# notifications-mail — SDUI blueprints

Server-Driven UI for mail-suppression admin. One resource surface + one lifecycle widget.

## Surfaces

### `resources/mail-suppression/`

Tenant admin surface for viewing + managing the mail suppression list. Read-heavy — most suppressions arrive via provider webhooks. Admin creates come rarely (manual blocks of known-bad addresses).

- `list.screen.json` — filterable by reason + provider + email domain; Menu action per row (revoke, view source delivery).
- `show.screen.json` — suppression detail with reason + bounce_reason + source delivery link + revoke action.

Create/edit not included — suppressions are add-only from admin UI (via a modal on the list screen); provider-webhook-created rows are immutable.

### `widgets/`

- `mail-suppression-reason-chip.widget.json` — colour-coded chip for reason: hard_bounce = danger, complaint = danger, unsubscribed = warning, manual = info, spam_trap = danger. Consumed by list + show + downstream module views (delivery detail shows suppression status).
