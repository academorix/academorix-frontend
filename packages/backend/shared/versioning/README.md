# versioning

Public interface versioning substrate. Wave 1 shared infrastructure.

Handles four surfaces of version lifecycle:

- **REST endpoints** — `/api/v1/...` vs `/api/v2/...`
- **Content-negotiated payloads** — `Accept: application/vnd.stackra.v2+json`
- **Webhook payloads** — `WebhookSubscription.api_version` pinning + payload
  transformer chains
- **GraphQL schema** — `@api(version: v2)` operation directive + `@deprecated`
  field lifecycle (feature-flag guarded via `versioning.graphql_support`)

Distinct from foundation's `HasVersions` trait, which handles **row-level model
history** (snapshots + rollback for Eloquent models). Both concerns share the
word "version" but tackle different problems.

## 1. What this module owns

| Concern                                                   | Owned artefact                                                    |
| --------------------------------------------------------- | ----------------------------------------------------------------- |
| API version catalog                                       | `ApiVersion` model                                                |
| Deprecation + sunset workflow                             | `DeprecationNotice` model                                         |
| Resolver chain (URL / header / query / webhook / GraphQL) | `VersionResolverChain` binding                                    |
| Payload transformer registry                              | `PayloadTransformerRegistry` binding                              |
| Version scheme adapters (SemVer, CalVer)                  | `VersionSchemeRegistry` binding                                   |
| RFC 8594 Sunset header emitter                            | `SunsetHeaderEmitter` binding                                     |
| Attribute-driven registration                             | `#[AsPayloadTransformer]`, `#[VersionedField]`, `#[AsApiSurface]` |

## 2. Resolver chain

Ordered by config (`versioning.resolvers.order`). First resolver that yields a
non-null result wins.

```
Inbound request
     │
     ▼
   URL resolver           /api/v1/... → 'v1'
     │  (miss)
     ▼
   Header resolver         Accept: application/vnd.stackra.v2+json → 'v2'
     │  (miss)
     ▼
   Webhook resolver         (outbound dispatch context) WebhookSubscription.api_version → 'v1'
     │  (miss)
     ▼
   GraphQL resolver         @api(version: v2) directive OR schema-inferred → 'v2'
     │  (miss)
     ▼
   Query resolver          ?version=v2 (dev-only in prod) → 'v2'
     │  (miss)
     ▼
   Default version        config('versioning.default') → 'v1'
```

## 3. Attribute-driven registration

Build-time compiler walks classes with these attributes + populates registries +
validates.

```php
#[AsPayloadTransformer(surface: 'webhook', event: 'invitation.sent', from: 'v1', to: 'v2')]
final readonly class InvitationSentV1toV2 implements PayloadTransformerInterface
{
    public function transform(array $payload): array
    {
        // v1 { user_id, email } → v2 { recipient: { id, email } }
        $payload['recipient'] = ['id' => $payload['user_id'], 'email' => $payload['email']];
        unset($payload['user_id'], $payload['email']);
        return $payload;
    }
}
```

```php
#[VersionedField(introducedIn: 'v2', deprecatedIn: 'v3', removedIn: 'v4')]
public readonly string $slug;
```

```php
#[AsApiSurface(name: 'invitations', versions: ['v1', 'v2'])]
final class InvitationsController extends Controller { ... }
```

## 4. Version schemes

Two adapters ship. New adapters register via
`VersionSchemeRegistry::register()`.

- **SemVer** (default) — `v1.2.3`. Wildcards: `^1.0` (any 1.x), `~1.2` (any
  1.2.x). Major bump = breaking.
- **CalVer** — `2024.10.15` or `2024-10-15`. Every release potentially breaking.
  Preferred for consumer-facing APIs where release cadence matches the calendar.

Selected per-`ApiVersion` row via the `scheme` column. A tenant using SemVer + a
tenant using CalVer coexist.

## 5. Deprecation + sunset workflow

Every ApiVersion carries a state machine:

```
draft ──release──▶ released ──deprecate──▶ deprecated ──sunset──▶ sunset
                                                        │
                                          (after sunset_at reached)
                                                        │
                                                        ▼
                                            410 Gone on any request
```

- `released` — normal serving. `X-API-Version: v1` header on every response.
- `deprecated` — still serves + `Sunset: <RFC 7231 date>` header per RFC 8594 +
  `Deprecation: true` header. `DeprecationNotice` records published, tenants
  notified via `ApiDeprecationNotification` (mail + in-app).
- `sunset` — refuses requests with 410 Gone +
  `Link: <migration-guide-url>; rel="successor-version"`. `Sunset` header still
  present for archaeology.

Lifecycle events: `ApiVersionReleased`, `ApiVersionDeprecated`,
`ApiVersionSunset`. Downstream modules (compliance, tenants admin dashboard)
subscribe to track migration progress.

## 6. Payload transformer chains

When a subscriber is pinned to `v1` and the publisher emits `v2`, the resolver
walks the transformer registry to build a chain.

```
subscriber pinned to v1
publisher emits v3
    │
    ▼
Registry lookup:
  v3 → v2 (event 'invitation.sent') ✓
  v2 → v1 (event 'invitation.sent') ✓
    │
    ▼
Chain: [V3toV2, V2toV1]
    │
    ▼
Payload passes through both transformers in order → delivered to subscriber
```

Chain resolution:

- Direct edges only (no `v3 → v1` skip transformer needed if `v3 → v2` and
  `v2 → v1` both exist).
- Missing edge → dispatch fails with `VERSIONING_TRANSFORMER_MISSING` error,
  subscription auto-paused.
- Cyclic edges refused at compile time.

## 7. Webhook integration

`WebhookSubscription.api_version` FKs to `api_versions.slug`. On outbound
dispatch:

1. Publisher emits event `invitation.sent` in `v3` (platform-current).
2. Webhook module resolves subscription's `api_version` = `v1`.
3. Calls
   `PayloadTransformerRegistry::chain('webhook', 'invitation.sent', from: 'v3', to: 'v1')`.
4. Chain applied to payload.
5. Delivered with `X-Webhook-Event-Version: v1` header.

Subscription refuses to persist unless the referenced version exists AND is in
`released` or `deprecated` state (not `sunset`). Sunset auto-cascades: when `v1`
sunsets, subscriptions pinned to `v1` are auto-upgraded to the next available
version + a `WebhookSubscriptionUpgraded` event fires. Customers get emailed 30
days before + notified in-app.

## 8. GraphQL integration (feature-flag guarded)

Feature flag: `versioning.graphql_support` (off by default in v1 alpha; on for
beta+).

- `@api(version: v2)` directive on operations (or per-type resolution): forces
  the resolver to serialise per v2 shape.
- `@deprecated(reason:, sunset: 2025-06-30)` on fields: emits deprecation
  warning in the GraphQL introspection + populates `sunset_at` on the field's
  `VersionedField` metadata.
- Schema stitching honours `#[VersionedField]` — a client on v1 doesn't see
  v2-introduced fields.

## 9. Middleware

`versioning.resolve` — resolves the requested version + populates request
state + emits response headers:

- `X-API-Version: v1` — the version served.
- `Deprecation: true` — when the resolved version is in `deprecated` state.
- `Sunset: Wed, 30 Jun 2025 23:59:59 GMT` — RFC 8594.
- `Link: <https://docs.stackra.com/migration/v1-to-v2>; rel="successor-version"`
  — migration guide URL from the DeprecationNotice.

Foundation's canonical priority order includes `versioning.resolve` at priority
30 (between `cors.strict` and `throttle.base`).

## 10. Model versioning is elsewhere

**Row-level snapshot / rollback / diff** is foundation's `HasVersions` trait
(wraps `mpociot/versionable`). This module does not handle that concern. If a
template needs rollback UX: `use HasVersions;` on the model. If a payload
version needs to change shape between v1 and v2: register a transformer here.

## 11. Extending: consuming this module

1. **Register a new API version** —
   `php artisan versioning:release 2024.10 --scheme=calver` (or via the admin
   UI).
2. **Register a payload transformer** — create class with
   `#[AsPayloadTransformer]` attribute; build-time compiler auto-discovers.
3. **Version a field** — add `#[VersionedField(introducedIn: 'v2')]` on the
   property.
4. **Mark a controller versioned** — add
   `#[AsApiSurface(name: '...', versions: [...])]` on the class.

## 12. Files

```
versioning/
├── module.json              readme.md              changelog.md
├── traits.json              relations.json         routes.json           middleware.json
├── events.json              listeners.json         observers.json
├── jobs.json                schedule.json          commands.json
├── notifications.json       policies.json          permissions.json
├── features.json            feature-flags.json     entitlements.json
├── health.json              metrics.json           analytics.json        caches.json          retention.json
├── compliance.json          data-classes.json      errors.json
├── config.json
├── schemas/
│   ├── api-version.schema.json
│   └── deprecation-notice.schema.json
├── data/
│   └── api-versions.json    (bootstrap: v1 released is_default=true)
└── sdui/
    ├── readme.md
    ├── resources/api-version/{list,show,create,edit}.screen.json
    ├── resources/deprecation-notice/{list,show,create}.screen.json
    └── widgets/version-lifecycle-chip.widget.json
```

## 13. What this module does NOT do

- **Doesn't handle model versioning.** That's foundation's `HasVersions` (wraps
  `mpociot/versionable`). Different table, different concern.
- **Doesn't own webhook infrastructure.** Webhook module owns
  `WebhookSubscription` + `WebhookDelivery`. This module supplies the
  `api_version` FK target + the resolver + the transformer chain.
- **Doesn't own GraphQL infrastructure.** GraphQL module (future) owns schema +
  resolvers. This module supplies the `@api(version:)` directive +
  `#[VersionedField]` attribute + versioned schema stitching.
- **Doesn't own subscription entitlements.** Subscription / entitlements modules
  gate access to the `versioning.graphql_support` feature.
