<?php

/**
 * @file modules/compliance/compliance/config/compliance.php
 *
 * @description
 * Runtime knobs for the `stackra/compliance` module. Every knob is
 * env-overridable so per-environment tuning stays out of code.
 */

declare(strict_types=1);

return [
    /*
    |--------------------------------------------------------------------------
    | Consent gate
    |--------------------------------------------------------------------------
    |
    | Redis-backed cache for the hot-path `ConsentGate::has()` lookup.
    | Invalidated on ConsentGiven / ConsentWithdrawn events. TTL keeps the
    | check zippy without letting stale decisions linger too long.
    */
    'consent' => [
        'cache_ttl_seconds' => env('COMPLIANCE_CONSENT_CACHE_TTL', 300),
        'default_categories' => [
            'essential',
            'functional',
            'marketing',
            'analytics',
            'ai_training',
            'minor_parental',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | DSAR
    |--------------------------------------------------------------------------
    |
    | SLA defaults + workflow tuning. Tenants on enterprise plans can override
    | via `tenancy::TenantSetting.compliance.dsar_sla_days`.
    */
    'dsar' => [
        'default_sla_days'       => env('COMPLIANCE_DSAR_SLA_DAYS', 30),
        'extended_sla_days'      => env('COMPLIANCE_DSAR_SLA_EXTENDED_DAYS', 90),
        'artefact_expiry_days'   => env('COMPLIANCE_DSAR_ARTEFACT_EXPIRY_DAYS', 30),
        'artefact_chunk_size'    => env('COMPLIANCE_DSAR_CHUNK_SIZE', 1000),
    ],

    /*
    |--------------------------------------------------------------------------
    | Retention
    |--------------------------------------------------------------------------
    |
    | Runner tuning. `scan_batch_size` caps rows touched per invocation to keep
    | worker memory bounded. `nightly_hour_utc` is the run boundary — override
    | per tenant via `tenancy::TenantSetting.timezone`.
    */
    'retention' => [
        'scan_batch_size'   => env('COMPLIANCE_RETENTION_BATCH_SIZE', 500),
        'nightly_hour_utc'  => env('COMPLIANCE_RETENTION_HOUR_UTC', 3),
        'default_warm_days' => env('COMPLIANCE_RETENTION_WARM_DAYS', 30),
    ],

    /*
    |--------------------------------------------------------------------------
    | Legal hold
    |--------------------------------------------------------------------------
    |
    | Two-person approval requirement + max default duration. A super_admin
    | can create indefinite holds; every other actor must set expires_at.
    */
    'legal_hold' => [
        'require_two_person_approval' => env('COMPLIANCE_LEGAL_HOLD_TWO_PERSON', true),
        'max_default_days'            => env('COMPLIANCE_LEGAL_HOLD_MAX_DAYS', 365),
    ],

    /*
    |--------------------------------------------------------------------------
    | Subprocessor feed
    |--------------------------------------------------------------------------
    |
    | Public JSON + PDF feed rendered by the SubprocessorFeedRenderer. The
    | cache TTL is Cache-Control:public max-age; changes clear the cache
    | immediately.
    */
    'subprocessor' => [
        'feed_cache_seconds' => env('COMPLIANCE_SUBPROCESSOR_FEED_TTL', 3600),
    ],

    /*
    |--------------------------------------------------------------------------
    | Safeguarding
    |--------------------------------------------------------------------------
    |
    | Escalation SLAs per severity (hours). `null` means "no escalation
    | required" (info-level reports).
    */
    'safeguarding' => [
        'escalation_sla_hours' => [
            'info'     => null,
            'concern'  => 120,
            'urgent'   => 24,
            'critical' => 1,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Breach
    |--------------------------------------------------------------------------
    |
    | GDPR Art. 33 supervisory-authority notification deadline in hours.
    | Every breach detected fires an internal notification; subject-facing
    | notifications require human approval before dispatch.
    */
    'breach' => [
        'notification_deadline_hours'    => env('COMPLIANCE_BREACH_DEADLINE_HOURS', 72),
        'dpo_notification_delay_minutes' => env('COMPLIANCE_BREACH_DPO_DELAY_MINUTES', 15),
    ],
];
