# messaging — changelog

## [Unreleased] — inception (Wave 2)

- Three entities: Conversation / ConversationParticipant / Message.
- Scopes: adhoc / branch / team (a branch/team automatically has an
  admin-managed thread).
- Read receipts via `Message.read_by` JSONB map.
- Realtime presence + typing indicator via realtime channel per conversation.
- 9 events including `MessageSent`, `MessageRead`, `ParticipantMuted`.
- Retention: default 90 days rolling; enterprise tenants configurable.

### Dependencies

- `foundation`, `tenancy`, `application`, `user`, `notifications`, `realtime`,
  `storage`.

### ULID prefixes

- `cnv_`, `cvp_`, `msg_` — registered.
