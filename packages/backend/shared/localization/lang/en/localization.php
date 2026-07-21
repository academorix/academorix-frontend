<?php

/**
 * @file modules/shared/localization/lang/en/localization.php
 *
 * @description
 * English translations for the `stackra/localization` module.
 */

declare(strict_types=1);

return [
    'errors' => [
        'platform_language_not_found'          => 'The requested platform language does not exist.',
        'platform_language_not_active'         => 'The platform language ":locale" is not active on the platform.',
        'platform_language_in_use'             => 'The platform language ":locale" cannot be archived while tenants have it enabled.',
        'platform_language_geography_mismatch' => 'The BCP-47 region subtag does not match the referenced geography country.',
        'geography_language_missing'           => 'The referenced geography::Language row does not exist. Run `php artisan world:install` first.',
        'tenant_locale_already_enabled'        => 'The locale ":locale" is already enabled for this tenant.',
        'tenant_locale_quota_exceeded'         => 'Tenant has reached the locale entitlement cap.',
        'tenant_locale_default_required'       => 'You must promote another locale to default before disabling this one.',
        'translation_not_found'                => 'The requested translation does not exist or is not visible to you.',
        'translation_quality_below_threshold'  => 'The driver returned a translation below the required quality threshold.',
        'auto_translate_disabled'              => 'Auto-translation is not enabled for this locale.',
        'ai_translation_quota_exceeded'        => 'The monthly AI translation quota has been exhausted for this tenant.',
        'driver_unreachable'                   => 'The translation driver ":driver" is currently unreachable.',
        'driver_rate_limited'                  => 'The translation driver ":driver" is rate-limited.',
        'driver_auth_failed'                   => 'The translation driver ":driver" rejected the request — credentials likely rotated.',
        'driver_unsupported_locale_pair'       => 'The translation driver ":driver" does not support the ":source" → ":target" pair.',
        'translation_job_in_flight'            => 'A translation job for this configuration is already running.',
        'invalid_bcp47_tag'                    => 'The value ":value" is not a valid BCP-47 language tag.',
        'invalid_iso639_code'                  => 'The value ":value" is not a valid ISO-639 language code.',
    ],

    'labels' => [
        'platform_language'    => 'Platform language',
        'platform_languages'   => 'Platform languages',
        'tenant_locale'        => 'Tenant locale',
        'tenant_locales'       => 'Tenant locales',
        'translation'          => 'Translation',
        'translations'         => 'Translations',
        'translation_job'      => 'Translation job',
        'translation_jobs'     => 'Translation jobs',
        'direction'            => 'Direction',
        'script'               => 'Script',
        'source'               => 'Source',
        'quality_score'        => 'Quality score',
        'verified'             => 'Verified',
        'verified_by'          => 'Verified by',
        'auto_translate'       => 'Auto-translate',
        'driver'               => 'Driver',
    ],

    'validation' => [
        'translatable_required'          => 'The :attribute must have a non-empty value for locale :locale.',
        'translatable_locale_available'  => 'The :attribute contains a translation for locale :locale which is not enabled for this tenant.',
        'translatable_length_per_locale' => 'The :attribute for locale :locale may not be longer than :max characters (got :length).',
    ],

    'notifications' => [
        'job_completed' => [
            'subject' => 'Translation job completed',
            'greeting' => 'Your translation job finished.',
            'line' => ':translated of :total keys translated across :locales.',
        ],
        'job_failed' => [
            'subject' => 'Translation job failed',
            'greeting' => 'Your translation job did not complete.',
            'line' => 'Reason: :reason',
        ],
        'quota_approaching' => [
            'subject' => 'AI translation quota approaching',
            'greeting' => 'You have used :percent% of your monthly AI translation quota.',
            'line' => 'Consider upgrading your plan or waiting until the quota resets on :reset_at.',
        ],
    ],
];
