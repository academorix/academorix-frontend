# notifications-sms — SDUI blueprints

Workspace admin surface for SMS opt-out list + cost visibility.

## Surfaces

### `resources/sms-opt-out/`

- `list.screen.json` — filterable by reason + provider + country. Menu action: revoke (refused for stop_keyword unless super_admin).
- `show.screen.json` — opt-out detail with reason + provider + source delivery link + inbound message body.

### `widgets/`

- `sms-cost-chip.widget.json` — chip showing per-message cost with colour severity (< $0.01 = neutral, < $0.10 = info, < $0.50 = warning, >= $0.50 = danger).
