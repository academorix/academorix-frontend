# academorix/versioning

Public interface versioning substrate. Owns the platform surface every consumer
(REST, webhook, GraphQL) reads to decide "which version am I speaking?" and
"what happens when a version deprecates or sunsets?"

## Aggregates

| Aggregate           | ULID prefix | Purpose                                                                                           |
| ------------------- | ----------- | ------------------------------------------------------------------------------------------------- |
| `ApiVersion`        | `apv_`      | One row per registered API version. Global — no `BelongsToTenant`. Slug is the primary reference. |
| `DeprecationNotice` | `dpn_`      | Public + auditable record of a deprecation or sunset warning. FK'd to `ApiVersion`.               |

## Install

```bash
composer require academorix/versioning
```

## Blueprint

Wire contract at `modules/shared/versioning/`.

## Contributes

- **Contracts (framework-swappable)**: `VersionResolverInterface`,
  `VersionResolverChainInterface`, `VersionSchemeInterface`,
  `VersionSchemeRegistryInterface`, `PayloadTransformerRegistryInterface`,
  `ApiVersionRegistryInterface`, `DeprecationNoticeServiceInterface`,
  `SunsetHeaderEmitterInterface`.
- **Resolvers (5)**: `UrlPathResolver`, `ContentNegotiationResolver`,
  `QueryParamResolver`, `WebhookSubscriptionResolver`, `GraphQlContextResolver`.
- **Schemes (2)**: `SemVerScheme`, `CalVerScheme`.
- **Middleware**: `versioning.resolve` — walks the resolver chain, binds the
  resolved version onto the request, and emits the RFC 8594 Sunset header for
  deprecated versions on the outbound response.
- **Attributes (3)**: `AsPayloadTransformer`, `VersionedField`, `AsApiSurface`.
- **Bootstrappers (3)**: hydrate the transformer registry + the api-surface
  registry + the built-in version schemes at boot.
- **Permissions**: `VersioningPermission` (view + manage — dual-guard).
- **Events (5)**: `ApiVersionReleased`, `ApiVersionDeprecated`,
  `ApiVersionSunset`, `DeprecationNoticePublished`,
  `PayloadTransformerRegistered`.
- **Jobs (2)**: `SunsetApiVersionJob`, `PublishDeprecationNoticeJob`.
- **Commands (5)**: `versioning:list`, `versioning:release`,
  `versioning:deprecate`, `versioning:sunset`, `versioning:transformers`.
- **Rules (3)**: `valid_version_slug`, `valid_version_scheme`,
  `valid_transformer_signature`.
- **Cast**: `VersionSchemeCast` — validates `scheme_value` against the declared
  scheme on hydrate.

## Resolver chain

Config-driven (see `config/versioning.php`). Default order:

1. URL path — `/api/v1/...`
2. Content negotiation — `Accept: application/vnd.academorix.v2+json`
3. Webhook subscription — pinned column on the outbound webhook row.
4. GraphQL context — `@api(version: v2)` directive. Feature-flag gated.
5. Query param — `?version=v1`. Non-production by default.

First non-null wins. When nothing matches, `versioning.default` is used.

## RFC 8594 workflow

- Draft ApiVersion → released → deprecated → sunset.
- Deprecated versions serve requests but emit `Sunset: <date>` on every response
  via the `versioning.resolve` middleware.
- Sunset versions return `410 Gone` (unless `versioning.sunset.enforce_410` is
  off — emergency override, feature-flag gated).

## Tests

```bash
composer install
vendor/bin/pest
```
