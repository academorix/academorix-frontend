<?php

/**
 * @file modules/shared/localization/config/localization.php
 *
 * @description
 * Runtime knobs for the `academorix/localization` module. Merged under the
 * `localization.*` key by the base ServiceProvider's LoadsResources concern.
 * Downstream modules read via `config('localization.*')` (never `env()` outside
 * this file per Octane-first rules).
 */

declare(strict_types=1);

return [
    /*
    |--------------------------------------------------------------------------
    | Core locale defaults
    |--------------------------------------------------------------------------
    |
    | `default_locale` is the app-wide fallback when every resolution
    | strategy misses. `fallback_locale` is the fallback the translator
    | uses when a key exists in the active locale but the value is empty.
    | Both mirror Laravel's `app.locale` / `app.fallback_locale`.
    */
    'default_locale' => env('APP_LOCALE', 'en'),

    'fallback_locale' => env('APP_FALLBACK_LOCALE', 'en'),

    'available_locales' => [
        'en',
        'fr',
        'es',
        'de',
        'ar',
        'pt',
        'it',
        'nl',
        'ja',
        'zh-Hans',
        'zh-Hant',
        'ko',
        'tr',
        'ru',
    ],

    /*
    |--------------------------------------------------------------------------
    | Default machine-translation driver
    |--------------------------------------------------------------------------
    |
    | Driver resolved by TranslatorDriverManager when a tenant has not set
    | TenantLocale.auto_translate_driver. Set to `null` to disable auto-
    | translation platform-wide (drivers still register).
    */
    'default_driver' => env('LOCALIZATION_DEFAULT_DRIVER', 'null'),

    /*
    |--------------------------------------------------------------------------
    | Locale-resolution chain
    |--------------------------------------------------------------------------
    |
    | Order of the strategies applied by ResolveLocaleMiddleware. First
    | hit wins. Reorder to change precedence per environment. Each entry
    | is the string name registered by the strategy via
    | `#[AsLocaleResolutionStrategy('name')]`.
    */
    'resolve' => [
        'chain' => [
            'query',
            'header',
            'user',
            'tenant',
            'accept_language',
            'subdomain',
            'app_default',
        ],
        'query_key'                => env('LOCALIZATION_QUERY_KEY', 'locale'),
        'header_name'              => env('LOCALIZATION_HEADER_NAME', 'X-Locale'),
        'persist_user_preference'  => (bool) env('LOCALIZATION_PERSIST_USER_PREFERENCE', true),
        'subdomain_pattern'        => env(
            'LOCALIZATION_SUBDOMAIN_PATTERN',
            '/^([a-z]{2}(-[A-Z]{2,4})?)\\./',
        ),
    ],

    /*
    |--------------------------------------------------------------------------
    | Translator decoration
    |--------------------------------------------------------------------------
    |
    | When `decorate` is true, the service provider rebinds the `translator`
    | container key to our CachedTranslator wrapper. Off = fall through to
    | Laravel's stock Translator (file-only). `cache_ttl_seconds` is the
    | Redis LRU TTL for each `(tenant_id, locale, namespace, group, key)`
    | tuple. `cache_hit_sample_ratio` samples telemetry events — 1.0 = every
    | hit fires an event, 0.01 = 1% of hits.
    */
    'translator' => [
        'decorate'                => (bool) env('LOCALIZATION_TRANSLATOR_DECORATE', true),
        'cache_ttl_seconds'       => (int) env('LOCALIZATION_TRANSLATOR_CACHE_TTL', 3600),
        'cache_hit_sample_ratio'  => (float) env('LOCALIZATION_CACHE_HIT_SAMPLE_RATIO', 0.01),
        'cache_prefix'            => env('LOCALIZATION_CACHE_PREFIX', 'loc:trn'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Machine-translation driver configuration
    |--------------------------------------------------------------------------
    |
    | Every driver's block is optional — a driver whose credentials aren't
    | set is registered but skipped at resolve time. Consumer apps put
    | credentials in Doppler; the driver classes gracefully degrade when
    | the vendor client isn't installed (composer suggest).
    */
    'drivers' => [
        'openai' => [
            'api_key'        => env('OPENAI_API_KEY'),
            'model'          => env('OPENAI_TRANSLATION_MODEL', 'gpt-4o-mini'),
            'temperature'    => (float) env('OPENAI_TRANSLATION_TEMPERATURE', 0.2),
            'system_prompt'  => env(
                'OPENAI_TRANSLATION_SYSTEM_PROMPT',
                'You are a professional translator. Translate the following text from :source_locale to :target_locale. Preserve :placeholder tokens verbatim. Return only the translated string.',
            ),
            'timeout_seconds' => (int) env('OPENAI_TRANSLATION_TIMEOUT', 30),
        ],

        'google' => [
            'credentials_path' => env('GOOGLE_APPLICATION_CREDENTIALS'),
            'project_id'       => env('GOOGLE_CLOUD_PROJECT'),
            'model'            => env('GOOGLE_TRANSLATE_MODEL', 'nmt'),
            'timeout_seconds'  => (int) env('GOOGLE_TRANSLATE_TIMEOUT', 30),
        ],

        'deepl' => [
            'api_key'         => env('DEEPL_API_KEY'),
            'endpoint'        => env('DEEPL_ENDPOINT', 'https://api-free.deepl.com/v2'),
            'timeout_seconds' => (int) env('DEEPL_TIMEOUT', 30),
        ],

        'aws-translate' => [
            'region'          => env('AWS_TRANSLATE_REGION', 'us-east-1'),
            'access_key'      => env('AWS_TRANSLATE_ACCESS_KEY_ID', env('AWS_ACCESS_KEY_ID')),
            'secret_key'      => env('AWS_TRANSLATE_SECRET_ACCESS_KEY', env('AWS_SECRET_ACCESS_KEY')),
            'timeout_seconds' => (int) env('AWS_TRANSLATE_TIMEOUT', 30),
        ],

        'azure-translator' => [
            'key'             => env('AZURE_TRANSLATOR_KEY'),
            'region'          => env('AZURE_TRANSLATOR_REGION', 'global'),
            'endpoint'        => env('AZURE_TRANSLATOR_ENDPOINT', 'https://api.cognitive.microsofttranslator.com'),
            'timeout_seconds' => (int) env('AZURE_TRANSLATOR_TIMEOUT', 30),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Bulk translation
    |--------------------------------------------------------------------------
    |
    | Concurrency caps for BulkTranslateNamespaceJob. `concurrency` is the
    | number of TranslateJob dispatches per bulk parent. `max_keys_per_job`
    | is the split threshold — bulk jobs above this size split into multiple
    | TranslationJob rows. `timeout_hours` is the kill-switch for stuck
    | running jobs.
    */
    'bulk_translate' => [
        'concurrency'      => (int) env('LOCALIZATION_BULK_CONCURRENCY', 5),
        'max_keys_per_job' => (int) env('LOCALIZATION_BULK_MAX_KEYS', 10000),
        'timeout_hours'    => (int) env('LOCALIZATION_BULK_TIMEOUT_HOURS', 12),
    ],

    /*
    |--------------------------------------------------------------------------
    | Redaction (pre-driver source-string sanitisation)
    |--------------------------------------------------------------------------
    |
    | Reuses the shared telemetry redactor rules so PII does not leak to a
    | third-party MT provider. `strict` mode replaces every match with
    | `[REDACTED]`; `loose` lets matches through but logs a warning; `off`
    | disables redaction (dev only).
    */
    'redaction' => [
        'enabled' => (bool) env('LOCALIZATION_REDACTION_ENABLED', true),
        'mode'    => env('LOCALIZATION_REDACTION_MODE', 'strict'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Retention
    |--------------------------------------------------------------------------
    |
    | `stale_days` — how long a Translation row can sit unrefreshed before
    | PruneStaleTranslationsJob purges it. `job_retention_days` — how long
    | TranslationJob audit rows are kept.
    */
    'retention' => [
        'stale_days'         => (int) env('LOCALIZATION_STALE_DAYS', 180),
        'job_retention_days' => (int) env('LOCALIZATION_JOB_RETENTION_DAYS', 90),
    ],

    /*
    |--------------------------------------------------------------------------
    | Table names
    |--------------------------------------------------------------------------
    |
    | Overrides for the four canonical table names. Rarely changed —
    | present so downstream apps can rename without editing migrations.
    */
    'tables' => [
        'platform_languages' => env('LOCALIZATION_TABLE_PLATFORM_LANGUAGES', 'platform_languages'),
        'tenant_locales'     => env('LOCALIZATION_TABLE_TENANT_LOCALES', 'tenant_locales'),
        'translations'       => env('LOCALIZATION_TABLE_TRANSLATIONS', 'translations'),
        'translation_jobs'   => env('LOCALIZATION_TABLE_TRANSLATION_JOBS', 'translation_jobs'),
    ],
];
