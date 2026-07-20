# access/requests \u2014 module changelog

Auditor-friendly per-artefact changelog.

## 2026-07-15 \u2014 Module inception (Wave 1b, priority 34)

- **add** \u2014 folder `modules/access/blueprints/requests/` with the full
  blueprint artefact set (module.json, readme.md, relations, traits, attributes,
  routes, middleware, events, listeners, observers, hooks, jobs, schedule,
  commands, notifications, broadcasts, policies, permissions, features,
  entitlements, feature-flags, health, metrics, analytics, caches, retention,
  compliance, data-classes, errors, rules, config, subprocessors, schemas, data
  fixtures, sdui).
- **model contract** \u2014 **none**. This module owns NO tables by design.
  State lives in `workflow/approvals.approval_instances` (with
  `action_key='access.grants.create'`) and `access/grants.access_grants` (with
  `source='access_request'` + `source_reference=<instance_id>`).
- **trait contract** \u2014 owns `IsAccessRequestable` (marker \u2014 optional
  alternative to the `#[AccessRequestable]` attribute).
- **attribute contract** \u2014 owns `#[AccessRequestable]` (declares a
  requestable model + its permission set) and `#[AsAccessRequestListener]`
  (registers a service on the AccessRequest event bus).
- **HTTP contract** \u2014 tenant-plane submit/list/show/withdraw/pending-my-
  review/approve/reject endpoints on `/api/v1/access-requests`. Platform- admin
  read-only cross-tenant endpoints on `/api/v1/platform/access- requests`.
- **middleware contract** \u2014 `access.request_hint_on_denial` decorates any
  403 whose target resource is registered in AccessRequestableRegistry with a
  Google-Docs-style `request_url` + payload template.
- **events contract** \u2014 7 lifecycle events (Submitted / Approved / Rejected
  / Expired / Cancelled / ApproverNotified / GrantIssued). Every event is a SHIM
  on top of a matching event from workflow/approvals or access/grants;
  downstream consumers subscribe to these instead of the upstream engines'
  events (which fire for every action, not just access requests).
- **grants bridge** \u2014 `AccessRequestGrantMaterializer` reacts to
  `ApprovalExecuted` filtered on `action_key='access.grants.create'` and calls
  `access/grants::GrantIssuer::issue()` with `source='access_request'`. The
  grant's TTL defaults to 7 days from
  `config('access.requests.default_grant_ttl_days')`.
- **approver resolution** \u2014 `AccessRequestApproverResolver` picks the
  approver set in three steps: (1) match tenant-configured approval_template for
  `action_key='access.grants.create'`; (2) fall back to
  `config('access.requests.default_approvers_selector')`; (3) fall back to the
  resource's `created_by` user if config allows. Delegation-aware via
  `access/delegation`.
- **entitlements** \u2014 `access_requests` (base, on for every tier),
  `access_request_reminders` (medium+), `access_request_bulk_approve`
  (enterprise), `access_requests.max_per_month` (500 / 5000 / unlimited).
- **health** \u2014 startup probes verify (a) AccessRequestableRegistry
  populated, (b) the `access.grants.create` approvable_action row exists, (c)
  every shim listener is wired to workflow/approvals, (d) access/grants
  reachable. Readiness probe on orphaned approvals under threshold.
- **compliance** \u2014 SOC 2 CC6.1 / CC6.2 / CC6.3 / CC6.6 / CC7.2 / CC8.1
  primary; ISO 27001 A.5.15 / A.5.18; GDPR Art. 6(1)(f) / 15 / 17 / 32; WCAG 2.2
  AA SC 3.3.1 / 3.3.2 / 4.1.3.
- **retention** \u2014 no local windows. Depends on workflow/approvals' 2-year
  window on approval_instances and access/grants' `expires_at + P90D`
  hard-delete on access_grants.
