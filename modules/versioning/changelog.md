# versioning — changelog

## [Unreleased] — inception

Wave 1 shared infrastructure module authored per the module architecture blueprint.

### Owned artefacts

- 2 entities: `ApiVersion` + `DeprecationNotice`.
- 5 events: `ApiVersionReleased`, `ApiVersionDeprecated`, `ApiVersionSunset`, `DeprecationNoticePublished`, `PayloadTransformerRegistered`.
- 2 jobs: `SunsetApiVersionJob`, `PublishDeprecationNoticeJob`.
- 5 commands: `versioning:list`, `versioning:release`, `versioning:deprecate`, `versioning:sunset`, `versioning:transformers`.
- 2 Notifications: `ApiDeprecationNotification`, `ApiSunsetNotification`.
- 3 attributes: `#[AsPayloadTransformer]`, `#[VersionedField]`, `#[AsApiSurface]`.
- 5 resolvers: URL, header, query (dev-only), webhook subscription, GraphQL context.
- 2 schemes: SemVer, CalVer.
- 1 middleware: `versioning.resolve` (replaces foundation's former `api.version`).

### Ships day 1 (previously deferred as v2 features)

- Payload transformer chains (interface + registry + build-time compiler).
- GraphQL schema versioning (feature-flag guarded via `versioning.graphql_support`).
- CalVer scheme (alongside SemVer).
- Deprecation + sunset workflow with RFC 8594 headers + workspace notifications.
- Auto-upgrade of webhook subscriptions when their pinned version sunsets.

### Compatibility

- **Foundation:** `api.version` middleware moved from foundation to this module as `versioning.resolve`. Foundation retains base HTTP pipeline (request.id, response.envelope, throttle.base, cors.strict). Foundation still owns model versioning via `HasVersions` trait (wraps mpociot/versionable).
- Depends on `foundation` only.
- Extended by `webhook`, `notifications`, `notifications-{mail,push,sms}`, `workspaces`, `subscription`, `entitlements`, `auth`.

### Migration notes

Downstream modules that referenced foundation's `api.version` middleware directly (via alias) must update to `versioning.resolve`. Foundation's `middleware.json` documents the delegation.

Modules that need webhook payload versioning depend on this module + wire `WebhookSubscription.api_version` as an FK to `api_versions.slug`.
