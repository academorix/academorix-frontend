<?php

/**
 * @file modules/platform/storage/config/storage.php
 *
 * @description
 * Runtime knobs for the `academorix/storage` module. Merged under
 * the `storage.*` key by the base ServiceProvider's LoadsResources
 * concern.
 */

declare(strict_types=1);

return [
    /*
    |--------------------------------------------------------------------------
    | Cache
    |--------------------------------------------------------------------------
    |
    | TTL applied to repository-level reads (kind config, tenant quotas).
    | See EloquentFileRepository's #[Cacheable(ttl: ...)] override.
    */
    'cache' => [
        'ttl_seconds'     => env('STORAGE_CACHE_TTL_SECONDS', 300),
        'quota_ttl'       => env('STORAGE_QUOTA_CACHE_TTL_SECONDS', 60),
        'kind_config_ttl' => env('STORAGE_KIND_CACHE_TTL_SECONDS', 3600),
    ],

    /*
    |--------------------------------------------------------------------------
    | Default disks per kind
    |--------------------------------------------------------------------------
    |
    | Every FileKind maps to a Laravel filesystem disk name. Consumer
    | apps override per-kind via config publishing; defaults keep dev
    | on the local disk.
    */
    'disks' => [
        'default'    => env('STORAGE_DEFAULT_DISK', 'local'),
        'per_kind'   => [
            'avatar'     => env('STORAGE_DISK_AVATAR', 'public'),
            'logo'       => env('STORAGE_DISK_LOGO', 'public'),
            'document'   => env('STORAGE_DISK_DOCUMENT', 's3'),
            'image'      => env('STORAGE_DISK_IMAGE', 'public'),
            'attachment' => env('STORAGE_DISK_ATTACHMENT', 's3'),
            'video'      => env('STORAGE_DISK_VIDEO', 's3'),
            'audio'      => env('STORAGE_DISK_AUDIO', 's3'),
            'other'      => env('STORAGE_DISK_OTHER', 's3'),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Signed URLs
    |--------------------------------------------------------------------------
    |
    | Default + per-purpose TTL policy. Every issuance runs against the
    | active tenant's plan cap; the default is applied when neither the
    | plan nor the caller specifies one. See module.json §signed_urls.
    */
    'signed_urls' => [
        'default_ttl_seconds' => env('STORAGE_SIGNED_URL_TTL', 3600),
        'ttl_policy' => [
            'download'      => env('STORAGE_SIGNED_URL_TTL_DOWNLOAD', 3600),
            'preview'       => env('STORAGE_SIGNED_URL_TTL_PREVIEW', 300),
            'share'         => env('STORAGE_SIGNED_URL_TTL_SHARE', 604_800),
            'admin_action'  => env('STORAGE_SIGNED_URL_TTL_ADMIN_ACTION', 300),
        ],
        'max_ttl_seconds' => env('STORAGE_SIGNED_URL_MAX_TTL', 2_592_000),
    ],

    /*
    |--------------------------------------------------------------------------
    | Chunked uploads
    |--------------------------------------------------------------------------
    |
    | Multipart / tus.io state expiry + default chunk size.
    */
    'chunked_uploads' => [
        'expiry_hours'      => env('STORAGE_CHUNKED_EXPIRY_HOURS', 24),
        'chunk_size_bytes'  => env('STORAGE_CHUNK_SIZE_BYTES', 5_242_880),
        'threshold_bytes'   => env('STORAGE_CHUNKED_THRESHOLD', 104_857_600),
        'default_protocol'  => env('STORAGE_CHUNKED_PROTOCOL', 'tus'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Content-addressable dedup
    |--------------------------------------------------------------------------
    */
    'dedup' => [
        'enabled'       => env('STORAGE_DEDUP_ENABLED', true),
        'hash_algorithm' => 'sha256',
    ],

    /*
    |--------------------------------------------------------------------------
    | Antivirus
    |--------------------------------------------------------------------------
    |
    | Enable to route every upload through the scanner. When false the
    | scan job flips `virus_scan_state = clean` without contacting the
    | scanner service.
    */
    'antivirus' => [
        'enabled'          => env('STORAGE_ANTIVIRUS_ENABLED', true),
        'quarantine_on_error' => env('STORAGE_ANTIVIRUS_QUARANTINE_ON_ERROR', true),
        'scan_timeout_seconds' => env('STORAGE_ANTIVIRUS_TIMEOUT', 30),
    ],

    /*
    |--------------------------------------------------------------------------
    | Entitlement keys
    |--------------------------------------------------------------------------
    |
    | Feature/quota keys used against the `academorix/entitlements`
    | package. SyncStorageEntitlementUsageJob writes usage back on
    | these keys.
    */
    'entitlements' => [
        'quota_bytes'          => env('STORAGE_ENTITLEMENT_BYTES', 'storage.bytes.consumed'),
        'quota_files'          => env('STORAGE_ENTITLEMENT_FILES', 'storage.files.consumed'),
        'feature_chunked'      => env('STORAGE_ENTITLEMENT_CHUNKED', 'storage.chunked_uploads'),
        'feature_variants'     => env('STORAGE_ENTITLEMENT_VARIANTS', 'storage.image_variants'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Quotas
    |--------------------------------------------------------------------------
    |
    | Default byte + file caps applied when the tenant's plan doesn't
    | specify one. Zero disables the check.
    */
    'quotas' => [
        'default_bytes' => env('STORAGE_QUOTA_DEFAULT_BYTES', 5_368_709_120),
        'default_files' => env('STORAGE_QUOTA_DEFAULT_FILES', 10_000),
        'approach_pct'  => env('STORAGE_QUOTA_APPROACH_PCT', 90),
    ],

    /*
    |--------------------------------------------------------------------------
    | Retention
    |--------------------------------------------------------------------------
    */
    'retention' => [
        'file_hard_delete_days'  => env('STORAGE_FILE_HARD_DELETE_DAYS', 365),
        'audit_purge_days'       => env('STORAGE_AUDIT_PURGE_DAYS', 90),
        'aborted_upload_hours'   => env('STORAGE_ABORTED_UPLOAD_HOURS', 24),
    ],
];
