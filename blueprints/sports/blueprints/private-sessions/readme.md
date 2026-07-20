# private-sessions

1:1 coaching sessions per blueprint §13.4. Wave 2.

## Owned entities

- `PrivateSessionRequest` (`psq_`) — state machine requested → approved →
  scheduled → completed.
- `SessionCredit` (`scr_`) — session-pack ledger (10-pack purchased, consumed
  per session).

## Flow

```
Parent → POST /private-session-requests { athlete, preferred_slots, preferred_coach? }
       → SessionRequested
Coach  → POST /private-session-requests/{req}/approve { assigned_coach, slot }
       → SessionApproved
System → creates sports::Session with kind='private' → status='scheduled'
       → SessionScheduled
Coach  → completes session on sports/attendance → status='completed'
       → Atomic: consume SessionCredit (if pack) OR create invoice via finance/invoice
       → SessionCompleted
```

## Atomic credit consumption

`ConsumeCreditAtomicallyOnComplete` hook:

```sql
BEGIN;
  SELECT * FROM session_credits WHERE id = ? FOR UPDATE;
  IF total_consumed >= total_purchased THEN ROLLBACK; FAIL; END IF;
  UPDATE session_credits SET total_consumed = total_consumed + 1;
  UPDATE private_session_requests SET consumed_credit_id = ?, status = 'completed';
COMMIT;
```

## ULID prefixes

- `psq_`, `scr_`
