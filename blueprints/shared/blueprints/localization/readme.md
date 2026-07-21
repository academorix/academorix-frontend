# localization

Multilingual substrate on top of Laravel's built-in localization. Wave 5
infrastructure.

## 1. What this module owns

| Concern                       | Owned artefact                                                                                                                                                     |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Platform language catalogue   | `PlatformLanguage` (BCP 47 tag + script + platform flags; FKs to `geography::Language` for ISO-639 metadata + optional `geography::Country` for regional variants) |
| Per-tenant enabled languages  | `TenantLocale` (enabled + is_default + is_fallback)                                                                                                                |
| Persistent translation cache  | `Translation` (tenant + locale + namespace + key → value)                                                                                                          |
| Async bulk translation        | `TranslationJob` (audit trail for AI-driven work)                                                                                                                  |
| Locale resolution middleware  | `locale.resolve`                                                                                                                                                   |
| Translation-service drivers   | OpenAI / Google Cloud Translation / DeepL / AWS Translate / Azure                                                                                                  |
| Helper overrides              | `t()`, `__()`, `trans()`, `trans_choice()`                                                                                                                         |
| Eloquent-property translation | `#[Translatable]` attribute                                                                                                                                        |

### 1.1 PlatformLanguage \u2014 relation to `geography`

Wave 5 refactor. The old `Language` model held its own copies of ISO-639 code,
English name, native name, direction, script and country code \u2014 fields that
are already the domain of `geography` (backed by the vendor package
`nnjeim/world`, seeded from CLDR). Two problems followed: the two `languages`
tables collided on name, and duplicated columns drifted whenever one side was
updated in isolation.

`PlatformLanguage` (table `platform_languages`) now owns only the
platform-scoped concerns:

- `bcp47_code` \u2014 e.g. `en`, `fr-CA`, `zh-Hant`. Unique per row.
- `script_code` \u2014 ISO 15924 (`Latn`, `Arab`, `Hant`, \u2026). The one
  detail genuinely additive over geography.
- `is_active_on_platform`, `is_beta`, `is_system`, `sort_order`, `notes`,
  `metadata`.
- `geography_language_id` (NOT NULL) \u2014 FK to `languages` (the vendor
  table). Source of truth for ISO-639-1 code, English name, native name,
  `is_rtl`.
- `geography_country_id` (NULL) \u2014 FK to `countries`. Populated only for
  regional variants (`fr-CA`, `en-GB`, `pt-BR`). Source of truth for
  `flag_emoji` + display country name.

The API shape callers see is unchanged: the `PlatformLanguage` model publishes
accessors (`name`, `native_name`, `direction`, `flag_emoji`) that chain through
the joined geography rows, so a response payload still looks identical to the
pre-refactor era.

**Migration notes**

- Old table `languages` (localization-owned) is renamed to `platform_languages`
  \u2014 the vendor `nnjeim/world` package keeps the `languages` name.
- `code`, `iso_639_1`, `iso_639_3`, `name`, `native_name`, `direction`,
  `country_code`, `flag_emoji` are dropped from the localization side; every
  value continues to flow to callers via accessors on the model.
- `TenantLocale.language_id` + `Translation.language_id` \u2014 column names
  stay (Laravel FK conventions decouple column name from target table); FK
  target swings to `platform_languages`.
- CLI command renamed `localization:seed-languages` \u2192
  `localization:seed-platform-languages`. Run `php artisan world:install` first
  so the geography lookups resolve.
- Module priority bumped `14 \u2192 66` so localization boots after geography
  (priority 65).

## 2. Locale resolution order

The `locale.resolve` middleware runs early on every authenticated route. It
picks the active locale from this chain (first hit wins):

1. `?locale=fr` query param (dev + share-link override)
2. `X-Locale: fr` request header (SPA / mobile client explicit)
3. Authenticated user's `profile.preferred_locale`
4. Tenant's default `TenantLocale`
5. `Accept-Language` header (best match against tenant-enabled locales)
6. Subdomain locale hint (`fr.example.com` → `fr`) when routing supports it
7. App default (`config('app.locale')`)

Result is set via `App::setLocale($code)` for Laravel's translator + cached on
`RequestContext` for consumers.

## 3. Translation resolution order

The module handles **two distinct translation problems** — do not conflate them:

- **UI strings** (`t('users.title')`) — namespaced translation KEYS resolved
  through Laravel's `Translator`. Storage: `translations` table +
  `lang/**/*.php|json` files. Chain described in §3.1 below.
- **Content fields** (`$plan->name`, `$notificationTemplate->body`) — per-row
  content translated on the model via the `HasTranslations` trait. Storage: a
  JSONB `translations` column on the row itself (see the
  `Blueprint::translations()` macro shipped by this module — see `macros.json`).
  Chain described in §3.2.

Both chains reuse the same **fallback locale** semantics so callers get
consistent behaviour regardless of which surface they hit.

### 3.1 UI-string resolution chain

When code calls `t('users.title')`, our decorated Translator runs this chain
(first hit wins):

1. **DB Translation** matching `(tenant_id, locale, namespace, key)` — the
   tenant-specific cache
2. **DB Translation** matching `(null, locale, namespace, key)` — platform
   defaults (Stackra-shipped)
3. **File-based** `lang/{locale}/{namespace}.php` and `lang/{locale}.json`
   (Laravel's native lookup)
4. **Fallback locale** — repeat 1–3 for `config('localization.fallback_locale')`
5. **Auto-translate** — if `TenantLocale.auto_translate=true` for this locale,
   dispatch `TranslateJob`, return the key literal for this request, then serve
   the cached translation on next request
6. **Return the key** — Laravel default (raw `users.title` string) when
   everything else missed

Every hit fires `TranslationCacheHit` or `TranslationCacheMiss` events so
metrics can graph hit ratios per tenant + locale.

### 3.2 Content-field resolution chain

When code reads a `#[Translatable]` property (e.g. `$plan->name`), the
`HasTranslations` accessor runs a shorter, purely in-process chain (no DB
round-trip — the JSONB blob was already hydrated with the row):

1. **Active locale value** — `translations[$activeLocale][$field]` when
   non-empty
2. **Tenant fallback** — `translations[$tenantFallback][$field]` where
   `TenantLocale.is_fallback = true`
3. **Attribute-declared fallback** — `translations[$attributeFallback][$field]`
   from `#[Translatable(fallback: 'fr-CA')]` (BCP-47 form) OR
   `translations[$tenantFallback]` (when the sentinel is `tenant_default`) OR
   `translations[$appDefault]` (when `app_default`)
4. **App default** —
   `translations[config('localization.fallback_locale')] [$field]`
5. **Null** — when `#[Translatable(fallback: 'none')]` OR every step returned
   empty

Writing a value fires `TranslationWritten` (see `events.json`); if
`TenantLocale.auto_translate = true` on any _other_ enabled locale, the listener
queues a `TranslateJob` to backfill the missing locales.

The **wire projection** is active-locale scalar by default — a
`GET /api/v1/plans/{id}` returns `data.name = 'Team'` (or the fallback-resolved
value). Admin editors that need round-trip access to every locale pass
`?include=translations` to receive the full JSONB blob under
`data.translations`.

## 4. Helper overrides

We do not replace Laravel's `Translator` — we decorate it. The Laravel helper
functions (`__()`, `trans()`, `trans_choice()`) are automatically routed through
our decorator because we bind our
`Stackra\Localization\Translation\Translator` as `translator`.

Additionally we publish a short `t()` helper:

```php
t('users.title');
// = __('users.title')

t('users.greeting', ['name' => 'Sam']);
// = "Hello, Sam" — Laravel :placeholder syntax

t('users.count', ['count' => 5]);
// = trans_choice with count-lifted pluralisation

t('validation.custom');
// = returns an array unchanged (Laravel's array-return behaviour preserved)
```

All Laravel behaviours preserved:

- **Dot notation**: `t('users.roles.admin')`
- **JSON files**: `t('Welcome, :name')` reads `lang/en.json`
- **Array returns**: `t('validation.custom')` returns array
- **Plurals**: `t('items', ['count' => 5])` picks the right form
- **Object attributes**: `t('user.:field', ['field' => 'name'])` interpolates
  `:field`
- **Locale override**: `t('users.title', [], 'fr')` fetches French regardless of
  active locale

Model-level translation via `#[Translatable]`:

```php
final class Product extends Model
{
    use HasTranslations;

    #[Translatable]
    public string $name;

    #[Translatable(fallback: 'en')]
    public string $description;
}

$product->name;              // returns value for active locale
$product->translate('fr')->name;  // explicit locale
```

## 5. Machine translation drivers

Auto-translate resolves to one of the configured drivers, chosen per tenant via
`TenantLocale.translator_driver` (falls back to
`config('localization.default_driver')`):

| Driver             | Package                                   | Strength                                                      |
| ------------------ | ----------------------------------------- | ------------------------------------------------------------- |
| `openai`           | `openai-php/laravel`                      | Context-aware, best for UI copy + domain-specific terminology |
| `google`           | `google/cloud-translate`                  | Broad language coverage, cheapest at scale                    |
| `deepl`            | `deeplcom/deepl-php`                      | Highest quality on European languages                         |
| `aws-translate`    | `aws/aws-sdk-php`                         | AWS-native; good when the app is on AWS                       |
| `azure-translator` | `microsoft/cognitive-services-translator` | Azure-native                                                  |
| `null`             | —                                         | No-op driver for tests / when auto-translate is off           |

Every call is billed as a `localization.ai_translations.month` entitlement
consume; tenants on free tier get 0, business gets 50k, enterprise unlimited.

## 6. Entitlements consumed

- `localization.locales.count` — slot; how many locales this tenant can enable
- `localization.ai_translations.month` — pool; per-month AI translation calls
- `localization.auto_translate` — boolean; whether auto-translate is available
  at all

## 7. RTL

`PlatformLanguage.direction` (accessor chaining through
`geography::Language.is_rtl`) is `ltr` or `rtl`. The tenant resolver +
`/auth/me` bootstrap surface the active direction so the SPA sets
`<html dir="rtl">` for Arabic / Hebrew / Persian / Urdu. Layouts flip via CSS
logical properties.

## 8. What this module does NOT do

- **Doesn't own message content.** That's the caller.
- **Doesn't own font selection for scripts.** UI theme owns fonts; we surface
  `PlatformLanguage.script_code` (Latin, Arabic, Cyrillic, Han, Devanagari, …)
  so the theme can pick.
- **Doesn't validate translation quality.** Human review path is a separate
  workflow.
- **Doesn't own currency / date-format localization.** Those are locale-derived
  but read from `intl` extension, not our tables.

## 9. Translatable Content Governance

Content that is stored per-row (Plan names, template subjects, category
descriptions, business-type labels) is classified into three tiers. The tier
governs the storage strategy + the wire contract + the auto-translate defaults.

### Tier A — high-value, tenant-visible content

Every tenant member reads this. Auto-translate is on by default (tenants can
disable per-locale). Wire projection is active-locale scalar; admin editors opt
in with `?include=translations`.

| Module        | Model                  | Translated fields                        | Strategy         |
| ------------- | ---------------------- | ---------------------------------------- | ---------------- |
| subscription  | `Plan`                 | `name`, `description`                    | JSONB blob       |
| notifications | `NotificationCategory` | `display_name`, `description`            | JSONB blob       |
| notifications | `NotificationTemplate` | `subject_template`, `body_rendered_html` | Row-per-locale † |
| newsletter    | `Newsletter`           | `name`, `description`                    | JSONB blob       |
| newsletter    | `NewsletterCampaign`   | `name`                                   | JSONB blob       |
| newsletter    | `NewsletterAudience`   | `name`, `description`                    | JSONB blob       |
| newsletter    | `NewsletterIssue`      | `subject`                                | JSONB blob       |
| tenants       | `BusinessType`         | `label`, `description`                   | Config-backed ‡  |
| tenants       | `Branding`             | `name`                                   | JSONB blob       |

**Default storage** — JSONB `translations` column via
`localization::Blueprint::translations()` (see `macros.json`). Composed with the
`HasTranslations` trait + `#[Translatable]` per field.

† **NotificationTemplate — row-per-locale exception.** Each locale is its own
row with independent `state` (draft/published/archived) + `version` +
`body_rendered_html`. Templates are large + CI-rendered per locale, so JSONB
storage would (a) balloon a single row with every locale's full HTML, (b) lose
the per-locale version history. Resolver order: (tenant, key, channel, locale) →
(tenant=null, key, channel, locale) → (tenant, key, channel, 'en') →
(tenant=null, key, channel, 'en').

‡ **BusinessType — config-backed exception.** BusinessType is a catalogue loaded
from `config/tenants.php` (mirrored from `data/business-types.json`) — no
Eloquent model, no DB table. Localised copies live inline in the same config
entry under a `translations` map that mirrors the JSONB shape used by Eloquent
tier-A models, so the wire contract remains identical for callers.

### Tier B — user-authored, tenant-visible content

The tenant owns the content and chooses when to localise (opt-in per row).
Auto-translate is off by default (tenants enable per model). Same storage
strategy as Tier A. **Not yet applied** — modules on the roadmap:
`sports::events::EventName`, `sports::coaching::ProgrammeDescription`, future
`announcements::Announcement`.

### Tier C — administrative labels

Short internal labels (organization names, branch names) that ship in the
tenant's default locale and are not routinely re-translated. Storage stays as
plain columns; tenants that need multilingual labels opt in via a future
migration. **No `HasTranslations` composition today.**

### Non-translated by design

- **Slugs, keys, codes** (`plan.slug`, `template.key`) — machine identifiers
- **IDs, timestamps, foreign keys** — infrastructure
- **User-generated bulk content** (registrations, transactions) — belongs to the
  tenant's active locale at creation time; historical records stay untouched
