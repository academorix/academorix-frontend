<?php

declare(strict_types=1);

namespace Academorix\FeatureFlags\Contracts\Data;

use Academorix\FeatureFlags\Models\Feature;
use Illuminate\Container\Attributes\Bind;

/**
 * Table shape for the `feature_definitions` catalog table.
 *
 * Platform-scoped catalog of every flag registered via
 * `#[AsFeatureFlag]`. Populated exclusively by
 * `FeatureFlagDiscovery` on `package:discover`; read by the
 * resolver's `DefaultLayer` (default decision), the checker's
 * cache-TTL fallback, and the admin `ListFlags` / `ShowFlag`
 * endpoints. The table is deliberately named
 * `feature_definitions` — not `features` — to avoid colliding
 * with Pennant's own `DatabaseDriver` schema.
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
#[Bind(Feature::class)]
interface FeatureInterface
{
    /**
     * Table name.
     */
    public const string TABLE = 'feature_definitions';

    /**
     * Primary key column.
     */
    public const string PRIMARY_KEY = 'id';

    /**
     * Primary key type — string, prefixed ULID.
     */
    public const string KEY_TYPE = 'string';

    // ── Columns ───────────────────────────────────────────────

    public const string ATTR_ID          = 'id';
    public const string ATTR_NAME        = 'name';
    public const string ATTR_DESCRIPTION = 'description';
    public const string ATTR_KIND        = 'kind';
    public const string ATTR_DEFAULT_OFF = 'default_off';
    public const string ATTR_CACHE_TTL   = 'cache_ttl';
    public const string ATTR_CREATED_AT  = 'created_at';
    public const string ATTR_UPDATED_AT  = 'updated_at';
    public const string ATTR_DELETED_AT  = 'deleted_at';
}
