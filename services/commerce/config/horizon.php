<?php

/**
 * @file services/commerce/config/horizon.php
 *
 * @description
 * Laravel Horizon supervisor + queue configuration for stackra-commerce.
 *
 * Commerce carries the money side (Subscription) + capability side
 * (Entitlements). Its traffic profile is BURSTY — Paddle webhooks
 * arrive in storms after promo events; end-of-day settlement fires
 * a batch of dunning + invoicing jobs. Queue sizing reflects that.
 *
 * ## Queue names
 *
 *   * `default`         — misc commerce jobs (email dispatch,
 *                          entitlement recalc after admin overrides).
 *   * `subscriptions`   — lifecycle events (trial → active, cancel,
 *                          reactivate). Slow (cascade to Entitlements).
 *   * `entitlements`    — feature-flag rebuilds, slot-quota recalcs.
 *   * `paddle-webhook`  — inbound Paddle webhook processing. Sized
 *                          for the bursty peak.
 *   * `dunning`         — retry cascade for failed charges. Runs on a
 *                          schedule + per-event.
 *   * `audit-outbound`  — dispatch audit events to observability.
 */

declare(strict_types=1);

return [
    'domain' => env('HORIZON_DOMAIN'),
    'path' => env('HORIZON_PATH', 'internal/horizon'),
    'use' => 'default',
    'prefix' => env('HORIZON_PREFIX', 'stackra_commerce_horizon:'),
    'middleware' => ['web'],

    'waits' => [
        'redis:paddle-webhook' => 10,
        'redis:subscriptions' => 60,
        'redis:entitlements' => 60,
        'redis:dunning' => 300,
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

    'defaults' => [
        // Two supervisors so Paddle-webhook bursts can't starve the
        // steady-state subscriptions + entitlements + dunning work.
        'commerce-supervisor' => [
            'connection' => 'redis',
            'queue' => ['subscriptions', 'entitlements', 'dunning', 'default', 'audit-outbound'],
            'balance' => 'auto',
            'autoScalingStrategy' => 'time',
            'maxProcesses' => 1,
            'maxTime' => 0,
            'maxJobs' => 0,
            'memory' => 128,
            'tries' => 5,
            'timeout' => 120,
            'nice' => 0,
        ],
        'paddle-supervisor' => [
            'connection' => 'redis',
            'queue' => ['paddle-webhook'],
            'balance' => 'simple',
            'maxProcesses' => 1,
            'maxTime' => 0,
            'maxJobs' => 0,
            'memory' => 128,
            'tries' => 10,
            'timeout' => 30,
            'nice' => 0,
        ],
    ],

    'environments' => [
        // Peak Paddle-webhook throughput is ~50-100 events per minute
        // after a promo blast. `paddle-supervisor` sized for that shape.
        'production' => [
            'commerce-supervisor' => [
                'maxProcesses' => 10,
                'balanceMaxShift' => 1,
                'balanceCooldown' => 3,
                'minProcesses' => 2,
            ],
            'paddle-supervisor' => [
                'maxProcesses' => 15,
                'minProcesses' => 3,
            ],
        ],
        'staging' => [
            'commerce-supervisor' => [
                'maxProcesses' => 4,
                'balanceMaxShift' => 1,
                'balanceCooldown' => 3,
                'minProcesses' => 1,
            ],
            'paddle-supervisor' => [
                'maxProcesses' => 4,
                'minProcesses' => 1,
            ],
        ],
        'local' => [
            'commerce-supervisor' => [
                'maxProcesses' => 2,
                'minProcesses' => 1,
            ],
            'paddle-supervisor' => [
                'maxProcesses' => 1,
                'minProcesses' => 1,
            ],
        ],
    ],
];
