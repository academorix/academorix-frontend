# Changelog

## 0.1.0 (unreleased)

- Initial scaffold. Owns the `Invitation` + `InvitationEvent` aggregates, the
  `HasInvitations` / `BelongsToInvitation` traits, the `InvitationTargetRegistry`
  binding, and the ten lifecycle events (`InvitationSent`, `InvitationDelivered`,
  `InvitationOpened`, `InvitationClicked`, `InvitationAccepted`,
  `InvitationDeclined`, `InvitationExpired`, `InvitationRevoked`,
  `InvitationBounced`, `InvitationResent`).
