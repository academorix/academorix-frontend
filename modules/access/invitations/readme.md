# academorix/invitations

Agnostic invitation substrate for Academorix. Owns the `Invitation` and
`InvitationEvent` aggregates plus the `HasInvitations` / `BelongsToInvitation`
traits every downstream module composes.

Consumer modules register their invitable resource + accept handler by binding
against `InvitationTargetRegistryInterface` at boot; the invitations module
handles delivery, bounce tracking, expiry, rate limits, and acceptance
orchestration end-to-end.

See `modules/access/blueprints/invitations/module.json` for the authoritative
specification.
