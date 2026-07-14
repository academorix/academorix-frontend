# invitations

Agnostic invitation substrate. One module owns the entire invite lifecycle
(token → send → deliver → open → click → accept / decline / expire / revoke
/ bounce → resend), and every consumer that wants to invite something plugs
in via a polymorphic target and the `HasInvitations` trait.

**Six-plus downstream use cases share the exact same lifecycle**, so this is
extracted before the first consumer ships:

| Use case | Target | Consumer module |
| --- | --- | --- |
| Invite someone to a workspace as a User | `Workspace` | `user` |
| Invite a parent to become a Guardian for an athlete | `Athlete` | `sports` (or `guardians`) |
| Invite an external player to join a Team | `Team` | `teams` |
| Invite a Club to join a Federation | `Federation` | `federation` |
| Academorix invites their staff into a workspace for time-bounded support | `Workspace` (with `impersonation` grants) | `auth` |
| Invite a prospect to a trial session | `TrialSession` | `sports` |
| Invite an external evaluator (referee / assessor) with narrow abilities | `Event` or `Assessment` | `sports` |

## Placement rationale

Sits at Wave 3 (alongside `access` / `audit` / `settings` / `feature-flag` /
`compliance`). Depends on `foundation` for primitives and `workspaces` for
workspace scoping. **Below `user`** in the dependency graph so `user` can
compose `HasInvitations` on `Workspace` and treat invitation acceptance as the
entry-point of the User-creation flow.

## Entities

Two persistent tables. Everything polymorphic — the module never
name-drops a concrete consumer.

| Model | Storage | Purpose |
| --- | --- | --- |
| `Invitation` | table | One row per invite. Polymorphic `target` and `inviter`. Carries the token hash (never the raw token), the delivery channel, the acceptance grants (role / abilities to apply on accept), lifecycle state, expiry, bounce reason, resend counter. Soft-deleted. |
| `InvitationEvent` | table | Immutable audit + funnel-analytics log. One row per state transition or delivery signal (sent / delivered / opened / clicked / accepted / declined / expired / revoked / bounced / resent). Never mutated. |

## Lifecycle

```
                 SendInvitationJob
   ┌───────► pending ──────► delivered
   │          │  │              │
 create       │  │              ▼
   │          │  │           opened
   │          │  │              │
   │          │  │              ▼
   │          │  │           clicked ──┐
   │          │  │              │      │
   │          │  │              ▼      │
   │          │  └──► expired  accepted│ ◄── acceptor confirms + creates User + assigns role
   │          │                        │
   │          └────► revoked           │
   │                                   │
   │                             declined ◄── acceptor rejects
   │
   └────► bounced (from mail transport webhook) ──► RetryBounceJob (or terminal fail)
```

Every transition writes an `InvitationEvent` row.

## Public surface

### Central host (public — no auth required)

| Method + path | Purpose |
| --- | --- |
| `GET /api/invitations/{token}` | Public preview of the invitation (workspace branding, inviter name, target label, expiry). Rate-limited per IP. |
| `POST /api/invitations/{token}/accept` | Accept the invitation. Routes to the target's sign-up / SSO flow. Returns a session PAT on success. |
| `POST /api/invitations/{token}/decline` | Decline. Terminal state, no follow-up email. |
| `POST /webhooks/invitations/mail/{transport}` | Signed inbound webhook from SendGrid / SES / Postmark / Mailgun with delivery + bounce + open events. Signature-verified per transport. |

### Workspace host (authenticated workspace admins)

| Method + path | Policy |
| --- | --- |
| `GET /api/v1/workspace/invitations` | `InvitationPolicy@viewAny` |
| `POST /api/v1/workspace/invitations` | `InvitationPolicy@create` |
| `GET /api/v1/workspace/invitations/{invitation}` | `InvitationPolicy@view` |
| `POST /api/v1/workspace/invitations/{invitation}/resend` | `InvitationPolicy@resend` |
| `POST /api/v1/workspace/invitations/{invitation}/revoke` | `InvitationPolicy@revoke` |

### Platform-admin host (Academorix staff)

Cross-workspace search + audit. Read-only + revoke for abuse investigation.

## The `HasInvitations` trait

Composed by any target model that can receive invitations. Adds a
`MorphMany` relation, fluent helpers, and scoped subqueries.

```php
final class Workspace extends Model
{
    use BelongsToApplication;
    use HasMetadata;
    use HasInvitations;   // ← from this module
    // ...
}

// Send:
$workspace->invite('coach@example.com', [
    'role_key' => 'coach',
    'inviter'  => $user,
    'expires_at' => now()->addDays(14),
    'grants' => ['branch_id' => $branch->id],
]);

// List:
$workspace->invitations()->pending()->get();

// Revoke:
$workspace->revokeInvitation($invitationId, reason: 'wrong email');
```

Every target-carrying module registers its `target_type` string in its
own service provider's boot:

```php
$registry->registerTargetType(
    key: 'workspace',
    class: Workspace::class,
    acceptHandler: WorkspaceInvitationAcceptHandler::class,
);
```

## Consumer registration

The `InvitationTargetRegistry` container binding (published by this
module) is the extension seam. Consumers register:

- **`target_type` key** — the string stored on `invitations.target_type`.
- **Target model class** — for morph resolution.
- **Accept handler** — a class implementing `InvitationAcceptHandlerInterface` that runs on `accept` (creates the User, assigns the role, dispatches downstream events, etc.).
- **Optional preflight validators** — checks that run before send (e.g. "is this email already a member of this workspace?").

Adding a new invitable target = one class + one registration line. Zero
schema changes.

## Contributions

- **Traits** — `HasInvitations` (target-morph relation on the invitable model), `BelongsToInvitation` (traceability trait for the accepted-User row).
- **Blueprints** — `->invitable()` migration macro (no columns; register-only).
- **Middleware** — `throttle.invitations` (per-inviter + per-workspace rate limits).
- **Events** — 10 state-transition events, all `ShouldDispatchAfterCommit`.
- **Policies** — one `InvitationPolicy` on both `sanctum` + `platform_admin` guards.
- **Permissions** — `invitations.send`, `invitations.viewAny`, `invitations.revoke`, `invitations.resend`, `invitations.manage_any` (platform-admin).
- **Rules** — validation rules the consumer surface uses (`unique_pending_invitation`, `invitation_target_registered`, `invitation_token_format`).
- **Notifications** — `InvitationNotification` (mail / slack / sms channels), `InvitationReminderNotification`, `InvitationAcceptedNotification` (to the inviter), `InvitationBouncedNotification` (to the workspace admin).
- **Broadcasts** — `workspace.{id}.invitations` — live status for the admin's invitations table.
- **Commands** — `invitations:expire-stale`, `invitations:cleanup-accepted`, `invitations:resend-failed`, `invitations:audit-report`.

## Depends on

- `foundation` — traits, health, primitives.
- `workspaces` — workspace scoping, cache prefix hook.

## Depended on by

Every module below that needs to invite someone. See `extendedBy` in
`module.json`.

## Terminology

- **Invitation** — the record (persistent).
- **Invite** — the verb / colloquial term for creating an Invitation.
- **Token** — the opaque secret the invitee presents. Never persisted; only its SHA-256 hash lives on `invitations.token_hash`.
- **Target** — polymorphic model the invitation grants access to (`Workspace`, `Team`, `Athlete`, ...).
- **Inviter** — polymorphic actor who sent the invitation (`User`, `ServiceAccount`, `System`).
- **Grants** — the payload applied on accept: role, abilities, target-specific relationships.
- **Accept handler** — consumer-supplied class that runs when `accept` completes; owns the "what does accepting mean" logic.
- **Channel** — delivery transport (`email`, `sms`, `slack`, `link`).

## Blueprint layout (this folder)

Standard module blueprint shape. See
`.kiro/specs/module-blueprints/PLAN.md` for the full artefact contract.

```
modules/invitations/
├── module.json / readme.md / changelog.md
├── schemas/
│   ├── invitation.schema.json
│   └── invitation-event.schema.json
├── relations.json, traits.json, routes.json, middleware.json
├── events.json, listeners.json, observers.json, hooks.json
├── jobs.json, schedule.json, commands.json
├── notifications.json, broadcasts.json
├── policies.json, permissions.json, features.json, entitlements.json
├── health.json, metrics.json, analytics.json, caches.json, retention.json
├── compliance.json, data-classes.json, errors.json,
│   subprocessors.json, webhooks.json, feature-flags.json
├── config.json, settings.json
├── data/{invitations,invitation-events}.json
└── sdui/
    ├── resources/invitation/{list,create,show}.screen.json
    ├── screens/{accept-invitation,decline-invitation}.screen.json
    └── widgets/invitation-status-chip.widget.json
```
