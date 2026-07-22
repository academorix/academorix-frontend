<?php

/**
 * @file services/observability/config/horizon.php
 *
 * @description
 * Laravel Horizon supervisor + queue configuration for stackra-observability.
 *
 * Observability is INGEST-HEAVY — every mutation on every other service
 * eventually lands here as an audit or activity event. Sizing prioritises
 * ingest throughput; retention pruning runs on a scheduled cron with its
 * own queue so it can't back up the live ingest path.
 *
 * ## Queue names
 *
 *   * `audit-ingest`     — inbound audit events (compliance signal). High
 *                           throughput; must not drop.
 *   * `activity-ingest`  — inbound activity events (product feed). Same
 *                           volume, lower urgency (users don't watch
 *                           second-by-second).
 *   * `retention-prune`  — scheduled pruning per tier. Slow batch job.
 *   * `compliance-export` — DSAR / GDPR export generation. Cold path.
 *   * `default`          — misc coordination + subscription lifecycle.
 */

declare(strict_types=1);

return [
    'domain' => env('HORIZON_DOMAIN'),
    'path' => env('HORIZON_PATH', 'internal/horizon'),
    'use' => 'default',
    'prefix' => env('HORIZON_PREFIX', 'stackra_observability_horizon:'),
    'middleware' => ['web'],

    // Ingest queues must clear quickly (5-10s) to avoid backing up the
    // sending services' audit-outbound queues. Retention + compliance
    // export get generous timeouts — they're batch workloads.
    'waits' => [
        'redis:audit-ingest' => 5,
        'redis:activity-ingest' => 10,
        'redis:retention-prune' => 3600,      // 1 hour
        'redis:compliance-export' => 1800,    // 30 minutes
        'redis:default' => 60,
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
    // Memory limit doubled — retention prune loads batches of audit rows.
    'memory_limit' => 256,

    // 3 supervisors: ingest / retention / cold-path.
    //
    // Ingest is the hot path — biggest pool, tightest timeout, most retries.
    // Retention runs on a schedule; long-timeout batch worker.
    // Cold path = DSAR / GDPR export. Rare + slow.
    'defaults' => [
        'ingest-supervisor' => [
            'connection' => 'redis',
            'queue' => ['audit-ingest', 'activity-ingest'],
            'balance' => 'auto',
            'autoScalingStrategy' => 'size',   // scale on queue depth
            'maxProcesses' => 1,
            'memory' => 128,
            'tries' => 10,          // ingest must never drop
            'timeout' => 30,
            'nice' => 0,
        ],
        'retention-supervisor' => [
            'connection' => 'redis',
            'queue' => ['retention-prune'],
            'balance' => 'simple',
            'maxProcesses' => 1,
            'memory' => 512,        // batch worker
            'tries' => 3,
            'timeout' => 3600,      // 1-hour prune batches
            'nice' => 10,           // lowered CPU priority
        ],
        'coord-supervisor' => [
            'connection' => 'redis',
            'queue' => ['compliance-export', 'default'],
            'balance' => 'auto',
            'maxProcesses' => 1,
            'memory' => 256,
            'tries' => 5,
            'timeout' => 1800,
            'nice' => 5,
        ],
    ],

    'environments' => [
        // Peak ingest ~1000 events/min across all sending services.
        // Retention runs nightly — 2 workers is enough.
        'production' => [
            'ingest-supervisor' => [
                'maxProcesses' => 25,
                'minProcesses' => 5,
                'balanceMaxShift' => 3,
                'balanceCooldown' => 3,
            ],
            'retention-supervisor' => [
                'maxProcesses' => 2,
                'minProcesses' => 0,
            ],
            'coord-supervisor' => [
                'maxProcesses' => 4,
                'minProcesses' => 1,
                'balanceMaxShift' => 1,
                'balanceCooldown' => 3,
            ],
        ],
        'staging' => [
            'ingest-supervisor' => [
                'maxProcesses' => 6,
                'minProcesses' => 2,
                'balanceMaxShift' => 1,
                'balanceCooldown' => 3,
            ],
            'retention-supervisor' => [
                'maxProcesses' => 1,
                'minProcesses' => 0,
            ],
            'coord-supervisor' => [
                'maxProcesses' => 2,
                'minProcesses' => 1,
                'balanceMaxShift' => 1,
                'balanceCooldown' => 3,
            ],
        ],
        'local' => [
            'ingest-supervisor' => ['maxProcesses' => 2, 'minProcesses' => 1],
            'retention-supervisor' => ['maxProcesses' => 1, 'minProcesses' => 0],
            'coord-supervisor' => ['maxProcesses' => 1, 'minProcesses' => 1],
        ],
    ],
];
