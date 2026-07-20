# access/delegation — Phase 3 implementation status

## Status: SCAFFOLDED — Actions return `null`

## Implementation plan

Time-bounded role delegation + platform-admin impersonation. Two adjacent
concepts:

- **Delegation** — user X grants user Y one of X's roles for a bounded
  window. Y's tokens carry the delegated role until the window closes.
- **Impersonation** — platform-admin steps into a tenant User's shoes for
  support. Full audit trail; ends automatically at TTL or on explicit end.

### Actions to fill

| Action                              | Contract                                                              | Notes                                                                                                                                                       |
| ----------------------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `StartDelegationAction`             | `POST /api/v1/delegations`                                            | Body: `{ delegatee_id, role_id, expires_at }`. Refuses when the delegator doesn't hold the role. Refuses cross-tenant delegation.                          |
| `EndDelegationAction`               | `DELETE /api/v1/delegations/{delegation}`                             | Explicit revoke. Idempotent.                                                                                                                                |
| `ForceTerminateDelegationAction`    | `POST /api/v1/platform/delegations/{delegation}/force-terminate`      | Platform-admin nuclear button. Requires `#[RequirePermission('platform.delegation.terminate')]`.                                                             |
| `ListDelegationsAction`             | `GET /api/v1/delegations`                                             | Tenant scope. Filter by delegator / delegatee / active.                                                                                                     |
| `ShowDelegationAction`              | `GET /api/v1/delegations/{delegation}`                                | Read.                                                                                                                                                       |
| `StartImpersonationAction`          | `POST /api/v1/platform/impersonations`                                | Body: `{ target_user_id, reason, ttl_seconds }`. Requires `#[RequirePermission('platform.impersonate')]`. Fires `SessionImpersonationStarted`. Returns a scoped PAT with `purpose = impersonation`. |
| `EndImpersonationAction`            | `DELETE /api/v1/platform/impersonations/{session}`                    | Explicit revoke.                                                                                                                                             |
| `ListImpersonationsAction`          | `GET /api/v1/platform/impersonations`                                 | Audit-focused listing. Filter by platform_user / target_user / date range.                                                                                  |

### Services to implement

- `DelegationScanner` — cron: mark past-expiry rows as ended.
- `DelegationEnforcer` — extends the RBAC PermissionResolver: when a
  delegation is active for the caller, resolve the delegated role's
  permissions on top of the caller's own.
- `ImpersonationSession` — issue + revoke helpers. On impersonation start,
  every issued JWT carries `purpose = impersonation` + an `impersonator`
  claim (platform_user_id + reason).

### Events to fire

- `DelegationStarted`, `DelegationEnded`, `DelegationForceTerminated`.
- `SessionImpersonationStarted`, `SessionImpersonationEnded`.

### Cross-module dependencies

- `access/rbac` — role resolution.
- `identity/auth` — JWT issuance with `purpose = impersonation`.
- `shared/audit` — heavy audit trail on every impersonation session.
