# user \u2014 SDUI blueprints

## Surfaces

### `resources/user/`

Admin-facing user roster CRUD.

- `list.screen.json` \u2014 filterable roster (status / role / branch / creation
  date) with a `+ Invite` button that opens the invitation flow.
- `show.screen.json` \u2014 detail view. Combines User + Profile (redacted per
  caller's `profile.view.pii` state) + TenantMember memberships across
  applications the caller has visibility on.
- `create.screen.json` \u2014 admin-triggered creation. Fields: email + role +
  is_default + optional pre-verify toggle (admin only).
- `edit.screen.json` \u2014 update status / default_role_id / preferred_locale.
  Profile-shaped fields require the caller to switch to the `edit-profile`
  modal (separate permission).

### `resources/profile/`

Self-service + admin PII surface.

- `edit.screen.json` \u2014 the /me/profile editor. Bilingual (en/ar), RTL-aware
  layouts. Avatar upload widget with drag-and-drop.
- `show-redacted.screen.json` \u2014 non-subject read of another User's profile
  when the caller lacks `profile.view.pii`. Shows display_name + avatar +
  locale + timezone only; PII cluster replaced with `\u2500\u2500 redacted \u2500\u2500`
  chips.

### `resources/tenant-member/`

Multi-tenant management.

- `list.screen.json` \u2014 the tenant-switcher list (`/me/tenants`).
- `manage.screen.json` \u2014 admin view of one User's memberships across every
  Tenant the caller can see; can change roles, remove memberships.

### `widgets/`

- `avatar-upload.widget.json` \u2014 drag-and-drop uploader with client-side
  size + type validation before POST /me/avatar.
- `tenant-switcher.widget.json` \u2014 dropdown in the app shell. Lists every
  TenantMember; the caller's default is starred; switching POSTs to
  `/me/tenants/{tenant}/switch`.
- `user-status-chip.widget.json` \u2014 colour-coded chip for the four terminal
  User.status values.
- `me-card.widget.json` \u2014 header card with avatar + display_name + role
  in the current tenant + a "manage account" link. Consumed by the top nav bar.
