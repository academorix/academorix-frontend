# localization

Multilingual substrate on top of Laravel's built-in localization. Wave 5
infrastructure. Priority 66 — depends on `foundation`, `tenancy`, `activity`,
`entitlements`, `geography`.

## 1. What this module owns

| Concern                       | Owned artefact                                                                                                                                                     |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Platform language catalogue   | `PlatformLanguage` (BCP-47 tag + script + platform flags; FKs to `geography::Language` for ISO-639 metadata + optional `geography::Country` for regional variants) |
| Per-tenant enabled languages  | `TenantLocale` (enabled + is_default + is_fallback + auto-translate policy)                                                                                        |
| Persistent translation cache  | `Translation` (tenant + locale + namespace + key → value)                                                                                                          |
| Async bulk translation        | `TranslationJob` (audit trail for AI-driven work)                                                                                                                  |
| Locale resolution middleware  | `locale.resolve` + `locale.persist`                                                                                                                                |
| Translation-service drivers   | OpenAI / Google Cloud Translation / DeepL / AWS Translate / Azure                                                                                                  |
| Helper overrides              | Decorated `Illuminate\Translation\Translator` — `t()`, `__()`, `trans()`, `trans_choice()` all consult the DB cache first                                          |
| Eloquent-property translation | `#[Translatable]` attribute + `HasTranslations` trait                                                                                                              |

## 2. Locale resolution order

The `locale.resolve` middleware runs early on every authenticated route. It
picks the active locale from this chain (first hit wins):

1. `?locale=fr` query parameter
2. `X-Locale: fr` request header
3. Authenticated user's `profile.preferred_locale`
4. Tenant's default `TenantLocale`
5. `Accept-Language` header (quality-value aware)
6. Subdomain locale hint (`fr.example.com` → `fr`)
7. App default (`config('localization.default_locale')`)

Result set via `App::setLocale($code)` + cached on request. Every resolution
fires `LocaleResolved` for telemetry.

## 3. Translation resolution order

When code calls `t('users.title')`, the decorated Translator runs this chain
(first hit wins):

1. DB `Translation` matching `(tenant_id, language_id, namespace, group, key)` —
   tenant override
2. DB `Translation` matching `(null, language_id, namespace, group, key)` —
   platform default
3. File-based `lang/{locale}/{group}.php` or `lang/{locale}.json` (Laravel
   native)
4. Fallback locale — repeat 1-3 for `config('localization.fallback_locale')`
5. Auto-translate — if `TenantLocale.auto_translate_driver` is set, dispatch
   `TranslateJob`, return key literal for this request, cache on next
6. Return the key literal (Laravel default)

Every hit fires `TranslationCacheHit` (sampled) or `TranslationCacheMiss`.

## 4. Content-field resolution — `#[Translatable]`

For per-row content translation, compose `HasTranslations` on the model and
annotate properties with `#[Translatable]`:

```php
final class Plan extends Model
{
    use HasTranslations;

    #[Translatable]
    public string $name;

    #[Translatable(fallback: 'tenant_default')]
    public string $description;
}

$plan->name;                         // active-locale value
$plan->translate('fr-CA')->name;     // explicit override
```

Storage is a JSONB `translations` column shaped
`{ locale_code: { field: value } }`. The fallback strategies are:

- `app_default` — falls through to `config('localization.fallback_locale')`
- `tenant_default` — falls through to `TenantLocale.is_fallback=true`
- `none` — returns `null`
- Any BCP-47 tag — pins the fallback

## 5. Machine translation drivers

Auto-translate resolves via `TranslatorDriverManager` (extends
`Illuminate\Support\Manager`), per-tenant via
`TenantLocale.auto_translate_driver`:

| Driver             | Package                                   | Strength                                                      |
| ------------------ | ----------------------------------------- | ------------------------------------------------------------- |
| `openai`           | `openai-php/laravel`                      | Context-aware, best for UI copy + domain-specific terminology |
| `google`           | `google/cloud-translate`                  | Broad language coverage, cheapest at scale                    |
| `deepl`            | `deeplcom/deepl-php`                      | Highest quality on European languages                         |
| `aws-translate`    | `aws/aws-sdk-php`                         | AWS-native                                                    |
| `azure-translator` | `microsoft/cognitive-services-translator` | Azure-native + custom terminology                             |
| `null`             | —                                         | No-op driver for tests + fallback                             |

Before dispatching to a driver, source strings pass through the shared telemetry
redactor (`localization.redaction.enabled` / `mode`) to prevent PII leakage.

## 6. RTL

`PlatformLanguage.direction` chains through `geography::Language.is_rtl` /
`geography::Language.dir`. `/auth/me` surfaces the active direction so the SPA
sets `<html dir="rtl">` for Arabic, Hebrew, Persian, Urdu.

## 7. What this module does NOT do

- **Doesn't own message content.** That's the caller's `lang/` files.
- **Doesn't validate translation quality.** Human review path via
  `translations.verify` permission + `verified_at` column.
- **Doesn't own currency / date-format localization.** Those read from `intl`.
- **Doesn't duplicate geography data.** ISO-639 / ISO-3166 metadata is READ from
  geography via accessor.
