# credentials

NFC / RFID / QR credentials for physical check-in per blueprint §13.7. Wave 2.

## Owned entities

- `Credential` (`cnl_`) — UID-registered NFC/RFID/QR credential + holder +
  status.
- `Gate` (`gte_`) — reader/gate at a branch + heartbeat monitor.
- `CheckinLog` (`chl_`) — raw check-in events + 2s debounce + attendance
  forward.

## Security

NFC UID is CLONABLE and NOT SECRET. Fine for attendance convenience. NEVER use
alone for:

- Payments (require PIN + payment gateway)
- Sensitive-area access (require authenticated NTAG or biometric)

## Ingest contract

```
Android NFC → mobile app → POST /api/v1/attendance/checkin
{ "uid": "04A21876AA19", "gate_id": "gte_..." }

→ CheckinDebouncer (2s repeat suppression)
→ CredentialRepository.resolveByUid(uid) → holder + credential
→ ForwardCheckinToAttendance hook →
    creates sports::AttendanceRecord with method=nfc
→ 200 OK
```

## ULID prefixes

- `cnl_`, `gte_`, `chl_`
