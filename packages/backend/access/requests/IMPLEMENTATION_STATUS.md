# access/requests — Phase 3 implementation status

## Status: SCAFFOLDED — Actions return `null`

## Implementation plan

Access-request workflow: a user asks for access to a resource; an admin
approves or denies. On approve, delegates to `access/grants` for the actual
grant issuance.

### Actions to fill

| Action                     | Contract                                                         | Notes                                                                                                                              |
| -------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `CreateAccessRequestAction`| `POST /api/v1/access-requests`                                   | Body: `{ ability, resource_type, resource_id, reason }`. Fires `AccessRequestCreated`. Notifications routed to approvers.          |
| `ApproveAccessRequestAction`| `POST /api/v1/access-requests/{request}/approve`               | Delegates to `access/grants::IssueGrantAction` with the request's ability + resource. Fires `AccessRequestApproved`.               |
| `DenyAccessRequestAction`  | `POST /api/v1/access-requests/{request}/deny`                    | Body: `{ reason }`. Fires `AccessRequestDenied`.                                                                                   |
| `ListAccessRequestsAction` | `GET /api/v1/access-requests`                                    | Tenant scope. Filter by status / requester / approver.                                                                             |
| `ShowAccessRequestAction`  | `GET /api/v1/access-requests/{request}`                          | Detail.                                                                                                                            |
| `CancelAccessRequestAction`| `DELETE /api/v1/access-requests/{request}`                       | Requester can cancel their own pending request. Fires `AccessRequestCancelled`.                                                    |

### Services to implement

- `AccessRequestResolver` — determines approvers for a given
  (resource, ability) tuple. Reads from tenant settings + role hierarchy.
- `AccessRequestExpiryScanner` — daily cron: auto-close pending requests
  older than N days.

### Registry to complete

- `AccessRequestableRegistry` — attribute-discovered map of `resource_type` →
  concrete resolver. Every module that wants to be a requestable target ships
  a class with `#[AsAccessRequestable]`.

### Events to fire

- `AccessRequestCreated`, `AccessRequestApproved`, `AccessRequestDenied`,
  `AccessRequestCancelled`, `AccessRequestExpired`.

### Cross-module dependencies

- `access/grants` — the approval action delegates.
- `notifications` — approver notifications.
