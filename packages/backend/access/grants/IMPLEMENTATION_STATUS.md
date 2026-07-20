# access/grants — Phase 3 implementation status

## Status: SCAFFOLDED — Actions return `null`

## Implementation plan

Arbitrary per-user grants beyond roles — a discretionary permission attached
to a User for a specific resource + scope, bounded by an optional expiry. Sits
alongside `access/rbac` (which is role-centric) so features can hand out
narrowly-scoped access without inventing a new role.

### Actions to fill

| Action                    | Contract                                             | Notes                                                                                                                                                        |
| ------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `IssueGrantAction`        | `POST /api/v1/grants`                                | Body: `{ user_id, ability, grantable_type, grantable_id, expires_at? }`. Refuses cross-tenant. Refuses when the issuer doesn't hold `grants.issue` for the resource. |
| `RevokeGrantAction`       | `DELETE /api/v1/grants/{grant}`                      | Idempotent. Fires `GrantRevoked`.                                                                                                                            |
| `ListGrantsAction`        | `GET /api/v1/grants`                                 | Tenant scope. Filters: user_id, grantable, ability, active.                                                                                                  |
| `ShowGrantAction`         | `GET /api/v1/grants/{grant}`                         | Row + eager-load grantable.                                                                                                                                  |
| `ListUserGrantsAction`    | `GET /api/v1/users/{user}/grants`                    | User's active grants across every grantable.                                                                                                                 |

### Services to implement

- `GrantResolver` — for a (user, ability, resource) tuple, resolve to a bool
  by checking active + non-expired + matching grantable. Called by the
  `PermissionResolver` before falling through to role-based resolution.
- `GrantExpiryScanner` — cron: mark past-expiry rows as expired.

### Registry to complete

- `GrantableRegistry` — attribute-discovered map of `grantable_type` →
  concrete grantable resolver. Every module that wants to be a grantable
  target ships a class with `#[AsGrantable]` naming the ability namespace.

### Events to fire

- `GrantIssued`, `GrantRevoked`, `GrantExpired`.

### Cross-module dependencies

- `access/rbac` — the resolver stack.
- `authorization` — attribute-driven permission checks flow through
  `PermissionResolver`.
