<?php

/**
 * @file services/notifications/config/horizon.php
 *
 * @description
 * Laravel Horizon supervisor + queue configuration for stackra-notifications.
 *
 * Notifications is HIGH-THROUGHPUT + LOW-LATENCY per channel — every
 * user-facing action across the workspace terminates in a notification
 * dispatch. Channel supervisors are sized independently so a Twilio
 * outage on the sms queue can't starve the in-app queue.
 *
 * ## Queue names (one per channel + coordination)
 *
 *   * `mail`            — transactional email dispatch (Mailgun / SES).
 *   * `sms`             — SMS delivery (Twilio / regional providers).
 *   * `push`            — Web-Push / APNs / FCM delivery.
 *   * `in-app`          — inbox / bell delivery + realtime push.
 *   * `messaging`       — chat + threads.
 *   * `digest`          — batched digest rollups (daily / weekly).
 *   * `default`         — dispatcher + template rendering + preference
 *                          resolution.
 *   * `audit-outbound`  — audit events to observability.
 */

declare(strict_types=1);

return [
    'domain' => env('HORIZON_DOMAIN'),
    'path' => env('HORIZON_PATH', 'internal/horizon'),
    'use' => 'default',
    'prefix' => env('HORIZON_PREFIX', 'stackra_notifications_horizon:'),
    'middleware' => ['web'],

    // Per-channel wait thresholds. Mail + SMS + push have USER-facing
    // SLAs (transactional email should land in <60s); digest can wait
    // 15 minutes without users noticing.
    'waits' => [
        'redis:mail' => 30,
        'redis:sms' => 30,
        'redis:push' => 30,
        'redis:in-app' => 5,
        'redis:messaging' => 5,
        'redis:digest' => 900,
        'redis:default' => 60,
        'redis:audit-outbound' => 30,
    ],

    'trim' => [
        'recent' => 60,
        'pending' => 60,
        'completed' => 60,
        'recent_failed' => 10080,
        'failed' => 40320,
        'monitored' => 40320,
    ],

    'metrics' => [
        'trim_snapshots' => [
            'job' => 24,
            'queue' => 24,
        ],
    ],

    'fast_termination' => false,
    'memory_limit' => 128,

    // 4 supervisors — one per delivery pipeline. Isolates failure modes
    // (Twilio 429 doesn't touch the mail supervisor) + lets per-channel
    // rate limits stay independent.
    'defaults' => [
        'mail-supervisor' => [
            'connection' => 'redis',
            'queue' => ['mail', 'digest'],
            'balance' => 'auto',
            'maxProcesses' => 1,
            'memory' => 128,
            'tries' => 5,
            'timeout' => 60,
            'nice' => 0,
        ],
        'sms-supervisor' => [
            'connection' => 'redis',
            'queue' => ['sms'],
            'balance' => 'simple',
            'maxProcesses' => 1,
            'memory' => 96,
            'tries' => 5,
            'timeout' => 30,
            'nice' => 0,
        ],
        'push-supervisor' => [
            'connection' => 'redis',
            'queue' => ['push'],
            'balance' => 'simple',
            'maxProcesses' => 1,
            'memory' => 128,
            'tries' => 5,
            'timeout' => 30,
            'nice' => 0,
        ],
        'realtime-supervisor' => [
            'connection' => 'redis',
            'queue' => ['in-app', 'messaging'],
            'balance' => 'auto',
            'maxProcesses' => 1,
            'memory' => 128,
            'tries' => 3,
            'timeout' => 15,
            'nice' => 0,
        ],
        'coord-supervisor' => [
            'connection' => 'redis',
            'queue' => ['default', 'audit-outbound'],
            'balance' => 'auto',
            'maxProcesses' => 1,
            'memory' => 128,
            'tries' => 3,
            'timeout' => 60,
            'nice' => 0,
        ],
    ],

    'environments' => [
        // Peak mail throughput: 500-1500 emails/min after a broadcast.
        // Peak in-app throughput: matches request volume on the API.
        'production' => [
            'mail-supervisor' => ['maxProcesses' => 15, 'minProcesses' => 3, 'balanceMaxShift' => 2, 'balanceCooldown' => 3],
            'sms-supervisor' => ['maxProcesses' => 8, 'minProcesses' => 2],
            'push-supervisor' => ['maxProcesses' => 10, 'minProcesses' => 2],
            'realtime-supervisor' => ['maxProcesses' => 20, 'minProcesses' => 4, 'balanceMaxShift' => 2, 'balanceCooldown' => 3],
            'coord-supervisor' => ['maxProcesses' => 6, 'minProcesses' => 2, 'balanceMaxShift' => 1, 'balanceCooldown' => 3],
        ],
        'staging' => [
            'mail-supervisor' => ['maxProcesses' => 4, 'minProcesses' => 1, 'balanceMaxShift' => 1, 'balanceCooldown' => 3],
            'sms-supervisor' => ['maxProcesses' => 2, 'minProcesses' => 1],
            'push-supervisor' => ['maxProcesses' => 2, 'minProcesses' => 1],
            'realtime-supervisor' => ['maxProcesses' => 4, 'minProcesses' => 1, 'balanceMaxShift' => 1, 'balanceCooldown' => 3],
            'coord-supervisor' => ['maxProcesses' => 2, 'minProcesses' => 1, 'balanceMaxShift' => 1, 'balanceCooldown' => 3],
        ],
        'local' => [
            'mail-supervisor' => ['maxProcesses' => 1, 'minProcesses' => 1],
            'sms-supervisor' => ['maxProcesses' => 1, 'minProcesses' => 1],
            'push-supervisor' => ['maxProcesses' => 1, 'minProcesses' => 1],
            'realtime-supervisor' => ['maxProcesses' => 1, 'minProcesses' => 1],
            'coord-supervisor' => ['maxProcesses' => 1, 'minProcesses' => 1],
        ],
    ],
];
