# notifications-push — SDUI blueprints

## Surfaces

### `resources/push-subscription/`

Per-user device management + tenant admin visibility.

- `list.screen.json` — user sees own devices; tenant admin sees all in tenant.
  Revoke action on each row. Device tokens NEVER displayed.
- `show.screen.json` — device detail with fingerprint + last seen + platform +
  app version.

### `widgets/`

- `push-platform-icon.widget.json` — small icon per platform (ios / android /
  web / macos / windows). Used in listings + inbox rows.
