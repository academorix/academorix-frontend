# notifications-mail — changelog

## [Unreleased] — inception

- Mail channel authored as a wrapper around Laravel Mail's `MailManager`.
- Registers `mail` with core's `NotificationChannelRegistry`.
- Owns `MailSuppression` entity + admin suppression list surface.
- Provider webhook ingestion for Mailgun, SendGrid, AWS SES, Postmark, Resend.
- CAN-SPAM footer + RFC 8058 List-Unsubscribe header injection.
- Blade rendering of pre-rendered React Email HTML (React Email compiled at CI build time via `packages/notifications-emails-renderer`).
- Feature flags per provider (kill switches for `mailgun`, `ses`, `sendgrid`, `postmark`, `resend`).

### Compatibility

- Depends on `notifications` (core), `foundation`, `workspaces`.
- No breaking change surface \u2014 inception release.
