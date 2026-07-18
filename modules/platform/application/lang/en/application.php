<?php

/**
 * @file modules/platform/application/lang/en/application.php
 *
 * @description
 * English translations for the `academorix/application` module. Loaded
 * under the `application::` namespace by the base ServiceProvider's
 * `LoadsResources(translations: true)`. Consumers translate via
 * `__('application::errors.system_row_immutable')` etc.
 */

declare(strict_types=1);

return [
    'errors' => [
        // ── System-row guardrail ──────────────────────────────
        'system_row_immutable' => 'Cannot :action the system :model row ":id" — this row is seeded by the platform and cannot be modified via this surface.',

        // ── Host resolution ───────────────────────────────────
        'missing_application' => 'Missing Application context. Every tenant-audience request must resolve to an Application (via `X-Application-Id` header or a matching `Host:` value).',
        'unknown_application' => 'The requested Application does not exist.',
        'application_disabled' => 'The requested Application is currently disabled.',

        // ── Cross-Application guards ─────────────────────────
        'cross_application_write' => 'Refused — this write would cross the Application boundary. Every tenant-scoped row belongs to exactly one Application.',
    ],

    'validation' => [
        'valid_business_type' => 'The :attribute must be a recognised BusinessType slug.',
        'reserved_custom_slug' => 'The :attribute cannot be the reserved "custom" bucket.',
    ],

    'labels' => [
        'application' => 'Application',
        'applications' => 'Applications',
        'business_type' => 'Business Type',
        'business_types' => 'Business Types',
        'central_url' => 'Marketing URL',
        'platform_admin_url' => 'Admin URL',
    ],
];
