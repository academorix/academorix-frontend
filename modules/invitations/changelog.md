# invitations — module changelog

Auditor-friendly per-artefact changelog.

## 2026-07-14 — Module inception

- **add** — folder `modules/invitations/` with the full blueprint artefact
  set (module.json, readme.md, 2 schemas, relations, traits, routes,
  middleware, events, listeners, observers, hooks, jobs, schedule,
  commands, notifications, broadcasts, policies, permissions, features,
  entitlements, health, metrics, analytics, caches, retention,
  compliance, data-classes, errors, subprocessors, webhooks,
  feature-flags, config, settings, data fixtures, sdui).
- **model contract** — 2 entities: `Invitation` (polymorphic target +
  inviter, token-hashed, state-machined) and `InvitationEvent`
  (immutable audit + funnel-analytics log).
- **trait contract** — owns `HasInvitations` (composed on any invitable
  target model) + `BelongsToInvitation` (traceability on the accepted
  User row). Paired with the `->invitable()` register-only migration
  macro.
- **consumer registration** — `InvitationTargetRegistry` container
  binding is the extension seam. Downstream modules (user, teams,
  federation, sports) register their `target_type` + accept handler
  class at boot; zero schema change.
- **channels** — email (mail transport), sms, slack, plain-link.
  Delivery + bounce webhooks inbound from SendGrid / SES / Postmark /
  Mailgun documented in `webhooks.json`.
- **rate limits** — per (inviter, day) + per (workspace, day) hard caps,
  configurable via `settings.json` + enforced by
  `throttle.invitations` middleware.
- **retention** — accepted + declined invitations retained P90D hot;
  expired + revoked cleaned after P30D; audit events retained P1Y for
  compliance. See `retention.json`.
- **compliance** — GDPR Art. 6(1)(a) consent basis captured on accept;
  bounce reason (a piece of communications metadata) classified as
  `internal` in `data-classes.json`; retention aligns with GDPR Art. 5.
