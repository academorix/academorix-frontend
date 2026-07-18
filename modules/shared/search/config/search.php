<?php

/**
 * @file config/search.php
 *
 * @description
 * Runtime knobs for the search package. Every downstream publishes
 * this file via `vendor:publish --tag=search-config`.
 */

declare(strict_types=1);

return [
    /*
    |--------------------------------------------------------------------------
    | Engines
    |--------------------------------------------------------------------------
    |
    | Per-engine adapter configuration. Meilisearch is built into
    | laravel/scout; pgvector + PG FTS come from third-party Scout
    | drivers we depend on.
    */
    'engines' => [
        'default' => env('SEARCH_DEFAULT_ENGINE', 'meilisearch'),

        'meilisearch' => [
            'host'         => env('SEARCH_MEILISEARCH_HOST', 'http://meilisearch:7700'),
            'api_key'      => env('SEARCH_MEILISEARCH_API_KEY'),
            'index_prefix' => env('SEARCH_MEILISEARCH_INDEX_PREFIX', 'academorix_'),
        ],

        'postgres_fts' => [
            'driver'       => 'devnoise/pgsql-tsvector',
            'tsvector_col' => 'searchable',
            'language'     => 'english',
        ],

        'pgvector' => [
            'driver'    => 'benbjurstrom/pgvector-scout',
            'dimension' => 1536,
            'distance'  => 'cosine',
            'embedder'  => env('SEARCH_PGVECTOR_EMBEDDER', 'openai'),
        ],

        'elasticsearch' => [
            'enabled' => false,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Queue
    |--------------------------------------------------------------------------
    */
    'queue' => [
        'connection'     => env('SEARCH_QUEUE_CONNECTION'),
        'name'           => env('SEARCH_QUEUE_NAME', 'search'),
        'analytics_name' => 'search-analytics',
    ],

    /*
    |--------------------------------------------------------------------------
    | Query
    |--------------------------------------------------------------------------
    */
    'query' => [
        'max_length'        => 512,
        'timeout_ms'        => 5000,
        'default_page_size' => 20,
        'max_page_size'     => 100,
        'default_language'  => 'auto',
    ],

    /*
    |--------------------------------------------------------------------------
    | Suggest / autocomplete
    |--------------------------------------------------------------------------
    */
    'suggest' => [
        'enabled'           => true,
        'min_prefix_length' => 2,
        'max_results'       => 10,
        'ttl_seconds'       => 60,
    ],

    /*
    |--------------------------------------------------------------------------
    | Analytics
    |--------------------------------------------------------------------------
    */
    'analytics' => [
        'record'                     => true,
        'session_ttl'                => 1800,
        'click_tracking'             => true,
        'top_queries_cache_seconds'  => 300,
    ],

    /*
    |--------------------------------------------------------------------------
    | Synonyms
    |--------------------------------------------------------------------------
    */
    'synonyms' => [
        'enabled'           => true,
        'cache_ttl_seconds' => 3600,
    ],

    /*
    |--------------------------------------------------------------------------
    | Shards
    |--------------------------------------------------------------------------
    */
    'shards' => [
        'enabled'             => true,
        'min_rows_per_shard'  => 25000,
        'max_shards'          => 100,
    ],

    /*
    |--------------------------------------------------------------------------
    | Progress
    |--------------------------------------------------------------------------
    */
    'progress' => [
        'every_rows'    => 1000,
        'every_percent' => 5,
    ],

    /*
    |--------------------------------------------------------------------------
    | Notifications
    |--------------------------------------------------------------------------
    */
    'notifications' => [
        'default_channels'         => ['database', 'broadcast'],
        'completed_channels_max'   => 5,
        'async'                    => true,
    ],

    /*
    |--------------------------------------------------------------------------
    | Retention
    |--------------------------------------------------------------------------
    */
    'retention' => [
        'sync_job_tier_days' => [
            'short'  => 90,
            'medium' => 180,
            'long'   => 365,
        ],
        'analytics_tier_days' => [
            'short'  => 30,
            'medium' => 90,
            'long'   => 365,
        ],
        'query_text_days'          => 7,
        'swap_grace_days'          => 7,
        'stale_hours'              => 24,
        'prune_chunk_size'         => 1000,
        'synonym_grace_days'       => 365,
        'saved_query_grace_days'   => 365,
        'index_grace_days'         => 30,
    ],

    /*
    |--------------------------------------------------------------------------
    | Concurrency
    |--------------------------------------------------------------------------
    */
    'concurrency' => [
        'enforced_at_dispatch' => true,
    ],

    /*
    |--------------------------------------------------------------------------
    | Rate limits
    |--------------------------------------------------------------------------
    */
    'rate_limit' => [
        'default_per_minute' => 60,
    ],

    'max_query_rate_per_minute' => 60,
    'max_reindex_concurrency'   => 3,
    'default_engine'            => 'meilisearch',
    'supported_languages'       => ['en', 'ar', 'fr', 'es', 'de'],

    /*
    |--------------------------------------------------------------------------
    | Auto-disable
    |--------------------------------------------------------------------------
    */
    'auto_disable' => [
        'failure_threshold' => 30,
    ],

    /*
    |--------------------------------------------------------------------------
    | Temporary files
    |--------------------------------------------------------------------------
    */
    'temporary_files' => [
        'remote_disk'          => env('SEARCH_TEMP_REMOTE_DISK'),
        'force_resync_remote'  => true,
    ],

    /*
    |--------------------------------------------------------------------------
    | Kill switches
    |--------------------------------------------------------------------------
    */
    'queue_enabled'                   => true,
    'indexing_enabled'                => true,
];
