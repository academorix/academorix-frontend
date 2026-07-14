# audit — changelog

## [Unreleased] — inception

- Audit trail module authored. Wraps `owen-it/laravel-auditing`.
- Publishes `HasAudit` trait + `#[Auditable]` attribute.
- Platform-admin `GET /api/v1/platform/audits` + workspace DPO `GET /api/v1/audits`.
- KMS-encrypted `old_values` / `new_values` for restricted-tier fields.
- 365d hot + 2555d cold retention with S3 Glacier lifecycle.
- Optional tamper-evident hash chain (enterprise plan).
- Foundation's `HasAuditable` trait becomes a thin re-export from this module.

### Compatibility

- Depends on `foundation`, `workspaces`.
- No breaking change surface — inception release.
