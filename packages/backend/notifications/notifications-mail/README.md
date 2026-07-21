# stackra/notifications-mail

Mail notification channel for Stackra. Registers the `mail` channel driver
with the parent `stackra/notifications` module's channel registry and
subscribes to `NotificationDispatched` events. On dispatch: renders the template
through Laravel Blade, injects CAN-SPAM footer + RFC 8058 `List-Unsubscribe`
headers, hands off to Laravel Mail's `MailManager`, and captures the provider
message id into a `NotificationDelivery` row. Ingests per-provider webhooks
(Mailgun / SendGrid / AWS SES / Postmark / Resend) via the `webhook` module's
`InboundWebhookReceived` event, normalises them into `MailDelivered` /
`MailOpened` / `MailClicked` / `MailBounced` / `MailComplaint` events, and owns
a `MailSuppression` aggregate for hard-bounced / complained / manually-blocked
addresses. Priority `26` — loads after notifications core (`20`) and
notifications-in-app (`25`).

Blueprint: `modules/notifications/blueprints/notifications-mail/`.
