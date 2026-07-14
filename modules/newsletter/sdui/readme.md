# newsletter — SDUI blueprints

Substantial admin surface across five resources. Public subscribe surface is thin (just a form + confirmation page).

## Surfaces

### `resources/newsletter/`

Publication CRUD for tenant admins.

- `list.screen.json` — filterable by cadence + state. Shows subscriber_count + last-issue metrics per newsletter.
- `show.screen.json` — publication detail with recent issues, subscriber growth chart, reputation summary.
- `create.screen.json` — new publication wizard: identity + cadence + reputation thresholds + confirmation policy.
- `edit.screen.json` — metadata edits + rollback via HasVersions.

### `resources/newsletter-issue/`

- `list.screen.json` — filterable by state. Send-now / cancel / preview actions.
- `show.screen.json` — issue detail with delivery counters + engagement chart.
- `create.screen.json` — composer: subject + preheader + content blocks (delegates to caller-provided rich text editor) + schedule.

### `resources/newsletter-campaign/`

- `list.screen.json` — campaigns filterable by state + newsletter. Progress bar per row via widget.
- `show.screen.json` — campaign detail with counters + reputation deltas.

### `resources/newsletter-subscription/`

- `list.screen.json` — subscribers filterable by state + tags + engagement. Bulk actions (add tag, remove).

### `resources/newsletter-audience/`

- `list.screen.json` — audiences with subscriber_count. Refresh action per row.

### `widgets/`

- `newsletter-stat-card.widget.json` — small KPI card: total subscribers / active rate / open rate / click rate. Colour severity based on threshold proximity.
- `campaign-progress-bar.widget.json` — segmented bar showing sent / delivered / opened / clicked / bounced / complained.
