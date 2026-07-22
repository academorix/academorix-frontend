<?php

/**
 * @file apps/laravel-template/config/octane.php
 *
 * @description
 * Laravel Octane runtime config for the Stackra API. Swoole
 * driver per ADR-0034. Every service in `packages/backend/**`
 * is Octane-safe by construction per `.kiro/steering/
 * octane-first-di.md`.
 *
 * ## Boot invariants
 *
 *   - `#[Scoped]` bindings reset between requests
 *     (`flushState`).
 *   - `#[Singleton]` bindings survive every request in the
 *     worker — must be provably stateless.
 *   - `max_requests` recycles each worker after N requests
 *     to catch any accidental state accumulation.
 */

declare(strict_types=1);

use Laravel\Octane\Contracts\OperationTerminated;
use Laravel\Octane\Events\RequestHandled;
use Laravel\Octane\Events\RequestReceived;
use Laravel\Octane\Events\RequestTerminated;
use Laravel\Octane\Events\TaskReceived;
use Laravel\Octane\Events\TaskTerminated;
use Laravel\Octane\Events\TickReceived;
use Laravel\Octane\Events\TickTerminated;
use Laravel\Octane\Events\WorkerErrorOccurred;
use Laravel\Octane\Events\WorkerStarting;
use Laravel\Octane\Events\WorkerStopping;
use Laravel\Octane\Listeners\CollectGarbage;
use Laravel\Octane\Listeners\DisconnectFromDatabases;
use Laravel\Octane\Listeners\EnsureUploadedFilesAreValid;
use Laravel\Octane\Listeners\EnsureUploadedFilesCanBeMoved;
use Laravel\Octane\Listeners\FlushOnce;
use Laravel\Octane\Listeners\FlushTemporaryContainerInstances;
use Laravel\Octane\Listeners\ReportException;
use Laravel\Octane\Listeners\StopWorkerIfNecessary;
use Laravel\Octane\Octane;

return [

    /*
    |--------------------------------------------------------------------------
    | Octane Server
    |--------------------------------------------------------------------------
    | Swoole per ADR-0034 — wider PHP-ext coverage than
    | Roadrunner + first-class task worker + tick timer support.
    */
    'server' => env('OCTANE_SERVER', 'swoole'),

    /*
    |--------------------------------------------------------------------------
    | Force HTTPS
    |--------------------------------------------------------------------------
    */
    'https' => env('OCTANE_HTTPS', false),

    /*
    |--------------------------------------------------------------------------
    | Octane Listeners
    |--------------------------------------------------------------------------
    | Framework listeners that keep worker state hygienic —
    | flush containers, collect garbage, disconnect from DB
    | between requests. Modify only if a package needs to hook
    | one of the Octane events; the standard set is
    | Laravel-shipped.
    */
    'listeners' => [
        WorkerStarting::class => [
            EnsureUploadedFilesAreValid::class,
            EnsureUploadedFilesCanBeMoved::class,
        ],
        RequestReceived::class => [
            ...Octane::prepareApplicationForNextOperation(),
            ...Octane::prepareApplicationForNextRequest(),
        ],
        RequestHandled::class => [
            //
        ],
        RequestTerminated::class => [
            FlushOnce::class,
            FlushTemporaryContainerInstances::class,
            DisconnectFromDatabases::class,
            CollectGarbage::class,
        ],
        TaskReceived::class => [
            ...Octane::prepareApplicationForNextOperation(),
        ],
        TaskTerminated::class => [
            FlushTemporaryContainerInstances::class,
        ],
        TickReceived::class => [
            ...Octane::prepareApplicationForNextOperation(),
        ],
        TickTerminated::class => [
            FlushTemporaryContainerInstances::class,
        ],
        OperationTerminated::class => [
            FlushOnce::class,
            FlushTemporaryContainerInstances::class,
        ],
        WorkerErrorOccurred::class => [
            ReportException::class,
            StopWorkerIfNecessary::class,
        ],
        WorkerStopping::class => [
            //
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Warm / Flush Bindings
    |--------------------------------------------------------------------------
    | `warm[]` is resolved once per worker at start.
    | `flush[]` is reset between requests. Bindings that hold
    | request state (auth, request, session — no session
    | here — mostly Laravel-internal) are flushed by default.
    */
    'warm' => [
        ...Octane::defaultServicesToWarm(),
    ],

    'flush' => [
        //
    ],

    /*
    |--------------------------------------------------------------------------
    | Octane Cache Table
    |--------------------------------------------------------------------------
    | Swoole exposes a shared-memory table the framework can use
    | for a fast per-worker cache. Keep at defaults; most apps
    | prefer Redis-backed cache via `config/cache.php`.
    */
    'cache' => [
        'rows' => 1000,
        'bytes' => 10000,
    ],

    /*
    |--------------------------------------------------------------------------
    | Octane Watchable Directories
    |--------------------------------------------------------------------------
    | Paths watched by `php artisan octane:start --watch` for
    | hot reload during development. Never enabled in prod.
    */
    'watch' => [
        'app',
        'src',
        'bootstrap/*.php',
        'config/**/*.php',
        'database/**/*.php',
        'routes/**/*.php',
        // Watch every backend package so a change in a
        // consumed package triggers a worker restart under
        // `--watch` mode.
        base_path('../..').'/packages/backend',
    ],

    /*
    |--------------------------------------------------------------------------
    | Garbage Collection Threshold
    |--------------------------------------------------------------------------
    | Force a GC cycle after N MB of memory growth per worker.
    */
    'garbage' => 50,

    /*
    |--------------------------------------------------------------------------
    | Maximum Execution Time (seconds)
    |--------------------------------------------------------------------------
    */
    'max_execution_time' => 30,

];
