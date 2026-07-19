# credentials — changelog

## [Unreleased] — inception (Wave 2)

- Three entities: Credential / Gate / CheckinLog.
- 2s debounce on check-ins prevents repeat-tap fraud.
- ForwardCheckinToAttendance hook creates AttendanceRecord with method=nfc.
- Gate offline alert when heartbeat missed > 5m.
- 8 events including `CredentialLost`, `GateHeartbeatMissed`, `CheckinRecorded`.

### Dependencies

- `foundation`, `tenancy`, `application`, `user`, `athlete`, `staff`, `branch`,
  `attendance`, `notifications`.

### ULID prefixes

- `cnl_`, `gte_`, `chl_` — registered.
