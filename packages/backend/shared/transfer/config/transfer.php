<?php

/**
 * @file modules/shared/transfer/config/transfer.php
 *
 * @description
 * Runtime knobs for the `stackra/transfer` module. Merged under
 * the `transfer.*` key by the base ServiceProvider's LoadsResources
 * concern. Downstream modules read via `config('transfer.*')` (never
 * `env()` outside this file per Octane-first rules).
 */

declare(strict_types=1);

return [
    /*
    |--------------------------------------------------------------------------
    | Kill switches
    |--------------------------------------------------------------------------
    |
    | Master toggles. When any of these are off, the matching entry
    | points raise `TRANSFER_KILL_SWITCHED` (or the queue variant) at
    | dispatch time.
    */
    'enabled'          => (bool) env('TRANSFER_ENABLED', true),
    'imports_enabled'  => (bool) env('TRANSFER_IMPORTS_ENABLED', true),
    'exports_enabled'  => (bool) env('TRANSFER_EXPORTS_ENABLED', true),
    'samples_enabled'  => (bool) env('TRANSFER_SAMPLES_ENABLED', true),
    'queue_enabled'    => (bool) env('TRANSFER_QUEUE_ENABLED', true),

    /*
    |--------------------------------------------------------------------------
    | Engines
    |--------------------------------------------------------------------------
    |
    | Which vendor implementations back the format-specific paths.
    | Currently only maatwebsite/excel is bound — additional drivers
    | (e.g. openspout) plug in here.
    */
    'engines' => [
        'default' => env('TRANSFER_ENGINE_DEFAULT', 'maatwebsite'),
        'pdf'     => [
            'driver'      => env('TRANSFER_PDF_DRIVER', 'dompdf'),
            'paper_size'  => env('TRANSFER_PDF_PAPER', 'a4'),
            'orientation' => env('TRANSFER_PDF_ORIENTATION', 'landscape'),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Queue routing
    |--------------------------------------------------------------------------
    */
    'queue' => [
        'connection' => env('TRANSFER_QUEUE_CONNECTION'),
        'name'       => env('TRANSFER_QUEUE_NAME', 'transfer'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Retention windows
    |--------------------------------------------------------------------------
    |
    | Job rows are pruned per-tier from `xfer_jobs`; artifact files
    | are pruned per-kind from disk. Job rows and artifact rows
    | survive for extra `mapping_profile_grace_days` when soft-deleted.
    */
    'retention' => [
        'tier_days' => [
            'short'  => (int) env('TRANSFER_RETENTION_SHORT_DAYS', 90),
            'medium' => (int) env('TRANSFER_RETENTION_MEDIUM_DAYS', 180),
            'long'   => (int) env('TRANSFER_RETENTION_LONG_DAYS', 365),
        ],
        'artifact_ttl_days' => [
            'source'   => 7,
            'result'   => 7,
            'errors'   => 14,
            'template' => 30,
            'workbook' => 7,
        ],
        'mapping_profile_grace_days' => 365,
        'stale_hours'                => 24,
        'prune_chunk_size'           => 1000,
    ],

    /*
    |--------------------------------------------------------------------------
    | Notifications
    |--------------------------------------------------------------------------
    |
    | Channels resolved once at dispatch from
    | `xfer_jobs.notify_channels` — precedence is
    | request > user > tenant > this default.
    */
    'notifications' => [
        'default_channels'         => ['database', 'broadcast'],
        'completed_channels_max'   => 5,
        'async'                    => true,
    ],

    /*
    |--------------------------------------------------------------------------
    | Sharding
    |--------------------------------------------------------------------------
    */
    'shards' => [
        'enabled'             => (bool) env('TRANSFER_SHARDS_ENABLED', false),
        'min_rows_per_shard'  => (int) env('TRANSFER_SHARDS_MIN_ROWS', 25000),
        'max_shards'          => (int) env('TRANSFER_SHARDS_MAX', 100),
    ],

    /*
    |--------------------------------------------------------------------------
    | Storage disks + paths per artifact kind
    |--------------------------------------------------------------------------
    */
    'storage' => [
        'default_disk' => env('TRANSFER_STORAGE_DISK', 'local'),
        'paths' => [
            'source'   => 'transfer/sources',
            'result'   => 'transfer/results',
            'errors'   => 'transfer/errors',
            'template' => 'transfer/templates',
            'workbook' => 'transfer/workbooks',
        ],
        'disks' => [
            'source'   => null,
            'result'   => null,
            'errors'   => null,
            'template' => null,
            'workbook' => null,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Temporary files (passthrough to excel.temporary_files)
    |--------------------------------------------------------------------------
    */
    'temporary_files' => [
        'remote_disk'          => env('TRANSFER_TEMP_REMOTE_DISK'),
        'force_resync_remote'  => (bool) env('TRANSFER_TEMP_FORCE_RESYNC', true),
    ],

    /*
    |--------------------------------------------------------------------------
    | CSV defaults
    |--------------------------------------------------------------------------
    */
    'csv' => [
        'field_separator'       => env('TRANSFER_CSV_FIELD_SEP', ','),
        'multi_value_separator' => env('TRANSFER_CSV_MULTI_SEP', '|'),
        'enclosure'             => env('TRANSFER_CSV_ENCLOSURE', '"'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Import defaults
    |--------------------------------------------------------------------------
    */
    'import' => [
        'chunk_size'     => (int) env('TRANSFER_IMPORT_CHUNK', 500),
        'batch_size'     => (int) env('TRANSFER_IMPORT_BATCH', 500),
        'max_file_size'  => (int) env('TRANSFER_IMPORT_MAX_FILE', 10 * 1024 * 1024),
        'stop_on_error'  => (bool) env('TRANSFER_STOP_ON_ERROR', false),
        'max_errors'     => (int) env('TRANSFER_MAX_ERRORS', 0),
        'encoding' => [
            'auto_detect' => true,
            'strict'      => false,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Export defaults
    |--------------------------------------------------------------------------
    */
    'export' => [
        'chunk_size'      => (int) env('TRANSFER_EXPORT_CHUNK', 1000),
        'query_size'      => env('TRANSFER_EXPORT_QUERY_SIZE'),
        'auto_size'       => (bool) env('TRANSFER_EXPORT_AUTO_SIZE', true),
        'strict_null'     => false,
        'sync_threshold'  => (int) env('TRANSFER_EXPORT_SYNC_THRESHOLD', 5000),
    ],

    /*
    |--------------------------------------------------------------------------
    | Preview + progress
    |--------------------------------------------------------------------------
    */
    'preview' => [
        'rows'         => 10,
        'ttl_seconds'  => 900,
    ],

    'progress' => [
        'every_rows'    => 1000,
        'every_percent' => 5,
    ],

    /*
    |--------------------------------------------------------------------------
    | Signed URLs
    |--------------------------------------------------------------------------
    |
    | TTL applied to download links. Default 24h — email links must
    | survive at least a full workday.
    */
    'signed_url' => [
        'ttl_minutes' => (int) env('TRANSFER_SIGNED_TTL', 1440),
    ],

    /*
    |--------------------------------------------------------------------------
    | Concurrency
    |--------------------------------------------------------------------------
    */
    'concurrency' => [
        'enforced_at_dispatch' => (bool) env('TRANSFER_CONCURRENCY_ENFORCED', true),
    ],
];
