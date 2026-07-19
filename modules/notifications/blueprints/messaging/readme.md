# messaging

Direct + group thread messaging per blueprint §16.1. Wave 2 comms.

## Owned entities

- `Conversation` (`cnv_`) — 1:1 or group thread.
- `ConversationParticipant` (`cvp_`) — user's state in the thread.
- `Message` (`msg_`) — single message with body + attachments + read_by.

## Realtime

Each conversation has a `tenant.{tenantId}.conversation.{convId}` presence
channel via `realtime`. Live typing indicator + presence + delivery status.

## Read receipts

`Message.read_by` is a JSONB map `{user_id: read_at}`. Atomic update via
`MessageObserver` on `POST /messages/{msg}/read`.

## ULID prefixes

- `cnv_`, `cvp_`, `msg_`
