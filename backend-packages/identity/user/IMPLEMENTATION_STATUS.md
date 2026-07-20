# identity/user — Phase 3 implementation status

## Status: SCAFFOLDED — model has trait TODOs; Actions return `null`

## Model — trait TODOs to resolve

`Models/User.php` currently has two unresolved trait TODOs:

- `use HasProfile;` — should be a compositional trait on this package that
  adds the `Profile` (1:1 satellite of the User) relation + Profile accessors.
- `use MustVerifyEmail;` — Laravel's built-in trait
  (`Illuminate\Auth\MustVerifyEmail`) satisfies the framework contract.
  Currently commented out; adding `implements MustVerifyEmailContract` +
  `use MustVerifyEmail;` should be a mechanical edit once `identity/identity`
  ships the verification token flow.

## Implementation plan

The User is the PER-APPLICATION projection of an Identity. Every Application
that a human authenticates to has one User row keyed by
`UNIQUE(identity_id, application_id)`. The tenant-facing profile
+ default role + status live here; credentials live on Identity.

### Actions to fill

| Action                        | Contract                                                | Notes                                                                                                                              |
| ----------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `ProvisionUserAction`         | (internal — called from `Auth::CreateLoginAction`)      | Create the User row on first-authenticated-per-Application. Idempotent — subsequent logins hit the existing row.                    |
| `ListUsersAction`             | `GET /api/v1/users`                                     | Tenant scope. Spatie query filters (status, role, last_login_at range).                                                            |
| `ShowUserAction`              | `GET /api/v1/users/{user}`                              | Tenant scope + `#[RequirePermission(UserPermission::View)]`.                                                                       |
| `UpdateUserAction`            | `PATCH /api/v1/users/{user}`                            | Update profile / preferred_locale / status. Refuses cross-tenant writes (belt-and-braces on top of BelongsToTenant).                |
| `DeactivateUserAction`        | `POST /api/v1/users/{user}/deactivate`                  | Flip `status = deactivated`. Refuses new tokens on this User until reactivated. Fires `UserDeactivated`.                            |
| `ReactivateUserAction`        | `POST /api/v1/users/{user}/reactivate`                  | Reverse of the above.                                                                                                              |
| `InviteUserAction`            | `POST /api/v1/users/invite`                             | Delegates to `access/invitations::InviteAction` with target = User. Body: email + role + optional message.                          |

### Services to implement

- `UserProvisioner` — atomic create of User + Profile row for a
  (identity_id, application_id) tuple. Called from `Auth` on first login.
- `UserFinder` — case-insensitive email lookup within an Application scope.
  Used by invitation acceptance.

### Cross-module dependencies

- `identity/identity` — Identity credential row.
- `access/rbac` — default role assignment on provision (default_role_id column).
- `access/invitations` — invitation-driven provisioning.
- `tenancy` — tenant scope enforcement.
