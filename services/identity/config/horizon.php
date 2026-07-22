<?php

/**
 * @file services/identity/config/horizon.php
 *
 * @description
 * Laravel Horizon supervisor + queue configuration for stackra-identity.
 *
 * Identity is the critical-path service — every downstream service
 * verifies inbound JWTs against its JWKS + the auth flow (login,
 * refresh, MFA, invitations) has the tightest SLA target of any
 * service. Queue workers are sized accordingly.
 *
 * ## Queue names
 *
 *   * `default`         — misc identity jobs (email verification,
 *                          password-reset dispatch, session pruning).
 *   * `auth`            — login-attempt logging, MFA delivery,
 *                          cross-app SSO grant lifecycle.
 *   * `provisioning`    — tenant / user / role provisioning fan-out.
 *                          Isolated because it's slow (multi-write) and
 *                          bursty (bulk imports).
 *   * `invitations`     — invitation dispatch + expiry sweep.
 *   * `audit-outbound`  — dispatch audit events to observability via
 *                          X-Service-Identity (see ADR-0033).
 *
 * ## Environment overrides
 *
 * Every value below reads `env('HORIZON_...')` first so devs / staging
 * / prod can tune worker counts without a code deploy. Defaults are
 * the WORKSPACE baseline; per-env overrides live in Doppler.
 *
 * ## Related
 *
 *   * ADR-0032 §D1 — every service has its own Horizon supervisor.
 *   * `.kiro/steering/octane-first-di.md` — worker cleanup between requests.
 *   * `packages/backend/telemetry/horizon` — the adapter that reads this file.
 */

declare(strict_types=1);

return [

    /*
    |--------------------------------------------------------------------------
    | Horizon Domain
    |--------------------------------------------------------------------------
    |
    | The domain Horizon dashboard runs under. Only accessible via the
    | HorizonServiceProvider's `gate()` — production limits it to
    | platform-admin users; dev opens it up.
    */
    'domain' => env('HORIZON_DOMAIN'),

    /*
    |--------------------------------------------------------------------------
    | Horizon Path
    |--------------------------------------------------------------------------
    |
    | URL path Horizon serves the dashboard on. Prefixed with `internal/`
    | to signal it's not part of the public API surface.
    */
    'path' => env('HORIZON_PATH', 'internal/horizon'),

    /*
    |--------------------------------------------------------------------------
    | Horizon Redis Connection
    |--------------------------------------------------------------------------
    |
    | Horizon multiplexes over Redis for job state + metrics. Uses the
    | same Redis DB the service itself uses; the queue: driver in
    | `config/queue.php` points at the same connection.
    */
    'use' => 'default',

    /*
    |--------------------------------------------------------------------------
    | Horizon Redis Prefix
    |--------------------------------------------------------------------------
    |
    | Every key Horizon writes carries this prefix — prevents collisions
    | when multiple services share one Redis instance in dev (see
    | docker/compose.dev.yml).
    */
    'prefix' => env('HORIZON_PREFIX', 'stackra_identity_horizon:'),

    /*
    |--------------------------------------------------------------------------
    | Horizon Route Middleware
    |--------------------------------------------------------------------------
    */
    'middleware' => ['web'],

    /*
    |--------------------------------------------------------------------------
    | Queue Wait Time Thresholds
    |--------------------------------------------------------------------------
    |
    | When a queue's oldest job has been waiting more than N seconds the
    | dashboard shows red. Auth is the tightest (5s); provisioning + audit
    | outbound get more slack since they're inherently async.
    */
    'waits' => [
        'redis:auth' => 5,
        'redis:default' => 60,
        'redis:invitations' => 60,
        'redis:provisioning' => 120,
        'redis:audit-outbound' => 30,
    ],

    /*
    |--------------------------------------------------------------------------
    | Job Trimming
    |--------------------------------------------------------------------------
    |
    | How long Horizon retains job records for dashboard visibility.
    | Recent (successful) trims aggressively; failed jobs kept for
    | 4 weeks for post-mortems.
    */
    'trim' => [
        'recent' => 60,           // minutes — successful jobs
        'pending' => 60,
        'completed' => 60,
        'recent_failed' => 10080, // 7 days
        'failed' => 40320,        // 28 days
        'monitored' => 40320,
    ],

    /*
    |--------------------------------------------------------------------------
    | Metrics
    |--------------------------------------------------------------------------
    */
    'metrics' => [
        'trim_snapshots' => [
            'job' => 24,
            'queue' => 24,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Fast Termination
    |--------------------------------------------------------------------------
    |
    | Under Octane, `horizon:terminate` still fires per-worker cleanup
    | listeners (`.kiro/steering/octane-first-di.md` §5). Turn fast
    | termination OFF so we don't leak per-request state between the
    | last request + worker exit.
    */
    'fast_termination' => false,

    /*
    |--------------------------------------------------------------------------
    | Memory Limit (MB)
    |--------------------------------------------------------------------------
    */
    'memory_limit' => 128,

    /*
    |--------------------------------------------------------------------------
    | Queue Worker Configuration
    |--------------------------------------------------------------------------
    |
    | Per-env supervisor pools. `local` + `staging` share the same shape
    | with smaller worker counts; `production` sizes for peak business
    | hours.
    |
    | `balance: auto` lets Horizon shuffle workers between queues based
    | on backlog. `minProcesses` guarantees a floor even when idle;
    | `maxProcesses` caps the burst.
    */
    'defaults' => [
        'identity-supervisor' => [
            'connection' => 'redis',
            'queue' => ['auth', 'default', 'invitations', 'provisioning', 'audit-outbound'],
            'balance' => 'auto',
            'autoScalingStrategy' => 'time',
            'maxProcesses' => 1,
            'maxTime' => 0,
            'maxJobs' => 0,
            'memory' => 128,
            'tries' => 3,
            'timeout' => 60,
            'nice' => 0,
        ],
    ],

    'environments' => [

        // ── Production ────────────────────────────────────────────
        //
        // Auth is the hot path (login floods during business hours);
        // provisioning is bursty (bulk imports); audit-outbound is
        // steady-state fan-out. Sizes reflect that shape.
        'production' => [
            'identity-supervisor' => [
                'maxProcesses' => 20,
                'balanceMaxShift' => 2,
                'balanceCooldown' => 3,
                'minProcesses' => 4,
            ],
        ],

        // ── Staging ───────────────────────────────────────────────
        //
        // Half of production, still real.
        'staging' => [
            'identity-supervisor' => [
                'maxProcesses' => 10,
                'balanceMaxShift' => 2,
                'balanceCooldown' => 3,
                'minProcesses' => 2,
            ],
        ],

        // ── Local dev ─────────────────────────────────────────────
        //
        // 2 workers is plenty for a single developer. `--pause` on
        // `horizon:pause` freezes the queue for debugging.
        'local' => [
            'identity-supervisor' => [
                'maxProcesses' => 2,
                'minProcesses' => 1,
            ],
        ],
    ],
];
