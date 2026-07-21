<?php

/**
 * @file modules/notifications/newsletter/config/newsletter.php
 *
 * @description
 * Runtime knobs for the `stackra/newsletter` module. Merged
 * under the `newsletter.*` key by the base ServiceProvider's
 * LoadsResources concern. Downstream code reads via
 * `config('newsletter.*')` — never `env()` outside this file per
 * Octane-first rules.
 */

declare(strict_types=1);

return [
    /*
    |--------------------------------------------------------------------------
    | Signed tokens
    |--------------------------------------------------------------------------
    |
    | HMAC secret + TTL for confirmation + unsubscribe tokens.
    | Rotate `signing_secret` quarterly. The TTL applies to the
    | double-opt-in confirmation window; unsubscribe tokens do NOT
    | expire (CAN-SPAM §7704(a)(4) requires the unsubscribe link to
    | work for at least 30 days — we make it effectively perpetual).
    */
    'tokens' => [
        'signing_secret'          => env('NEWSLETTER_TOKEN_SIGNING_SECRET'),
        'confirmation_ttl_hours'  => (int) env('NEWSLETTER_CONFIRMATION_TTL_HOURS', 720),
    ],

    /*
    |--------------------------------------------------------------------------
    | Public URLs
    |--------------------------------------------------------------------------
    |
    | Patterns used to build the outbound subscribe / confirm /
    | unsubscribe URLs. `{tenant_slug}` + `{newsletter_slug}` +
    | `{token}` are the supported placeholders.
    */
    'public_urls' => [
        'subscribe_pattern'   => env(
            'NEWSLETTER_SUBSCRIBE_URL_PATTERN',
            'https://{tenant_slug}.stackra.app/newsletters/{newsletter_slug}/subscribe',
        ),
        'confirm_pattern'     => env(
            'NEWSLETTER_CONFIRM_URL_PATTERN',
            'https://{tenant_slug}.stackra.app/newsletters/{newsletter_slug}/confirm/{token}',
        ),
        'unsubscribe_pattern' => env(
            'NEWSLETTER_UNSUBSCRIBE_URL_PATTERN',
            'https://{tenant_slug}.stackra.app/newsletters/{newsletter_slug}/unsubscribe/{token}',
        ),
    ],

    /*
    |--------------------------------------------------------------------------
    | Reputation guardrails
    |--------------------------------------------------------------------------
    |
    | Auto-throttle thresholds. Reputation monitor evaluates campaign
    | counters against these; consecutive breaches over
    | `auto_throttle_threshold_breaches` trip the newsletter into
    | throttled state, which pauses new campaigns until an admin
    | reviews.
    */
    'reputation' => [
        'evaluation_window_days'           => (int) env('NEWSLETTER_REPUTATION_WINDOW_DAYS', 30),
        'auto_throttle_threshold_breaches' => (int) env('NEWSLETTER_REPUTATION_AUTO_THROTTLE', 2),
        'default_thresholds'               => [
            'min_open_rate'      => 0.10,
            'min_click_rate'     => 0.01,
            'max_bounce_rate'    => 0.05,
            'max_complaint_rate' => 0.003,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Audience
    |--------------------------------------------------------------------------
    |
    | Audience segments cache the resolved subscriber id list. Rebuild
    | via BuildAudienceSegmentJob when the cache falls out of the
    | refresh window OR when the expression changes.
    */
    'audience' => [
        'refresh_ttl_seconds' => (int) env('NEWSLETTER_AUDIENCE_REFRESH_TTL', 21600),
    ],

    /*
    |--------------------------------------------------------------------------
    | Campaign send
    |--------------------------------------------------------------------------
    |
    | Batch size + per-second throttle applied to
    | SendNewsletterCampaignJob. `throttle_per_second = null` = no
    | cap; the mail provider decides.
    */
    'campaign' => [
        'default_batch_size'         => (int) env('NEWSLETTER_CAMPAIGN_BATCH_SIZE', 500),
        'default_throttle_per_second' => env('NEWSLETTER_CAMPAIGN_THROTTLE_PER_SEC') !== null
            ? (int) env('NEWSLETTER_CAMPAIGN_THROTTLE_PER_SEC')
            : null,
    ],

    /*
    |--------------------------------------------------------------------------
    | Retention
    |--------------------------------------------------------------------------
    |
    | CAN-SPAM + CASL evidence retention windows. Unsubscribed
    | subscriptions keep the row for 5 years so the tenant can prove
    | the unsubscribe was honoured. GDPR erasure trumps this via
    | anonymisation.
    */
    'retention' => [
        'unsubscribed_days'         => (int) env('NEWSLETTER_RETENTION_UNSUBSCRIBED_DAYS', 1825),
        'sent_issue_archive_years'  => (int) env('NEWSLETTER_RETENTION_SENT_ISSUE_YEARS', 5),
    ],
];
