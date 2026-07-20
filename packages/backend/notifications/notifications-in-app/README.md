# academorix/notifications-in-app

In-app notification channel for Academorix. Registers the `in_app` channel
driver with the parent `academorix/notifications` module's channel registry and
subscribes to `NotificationDispatched` events. On dispatch: writes a delivery
row synchronously (in-app delivery is guaranteed on DB write) and emits a Reverb
broadcast on the `user.{id}.notifications` private channel for live inbox
updates. Priority `25` — loads after notifications core (`20`).

Blueprint: `modules/notifications/blueprints/notifications-in-app/`.
