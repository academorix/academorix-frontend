<?php

declare(strict_types=1);

namespace Academorix\Search\Contracts\Data;

use Academorix\Search\Models\SearchIndex;
use Illuminate\Container\Attributes\Bind;

/**
 * Table shape for the `search_indexes` table.
 *
 * Registry row for one `#[Searchable]` model class — the mirror of
 * the compile-time attribute inventory, kept in the DB so admin
 * surfaces can render the catalogue and the orchestrator can drive
 * reindex + alias-swap operations against it.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[Bind(SearchIndex::class)]
interface SearchIndexInterface
{
    public const string TABLE = 'search_indexes';

    public const string PRIMARY_KEY = 'id';

    public const string KEY_TYPE = 'string';

    public const string ID_PREFIX = 'sidx';

    // ── Columns ───────────────────────────────────────────────

    public const string ATTR_ID               = 'id';
    public const string ATTR_TENANT_ID        = 'tenant_id';
    public const string ATTR_MODEL_CLASS      = 'model_class';
    public const string ATTR_ENGINE           = 'engine';
    public const string ATTR_INDEX_NAME       = 'index_name';
    public const string ATTR_LIVE_ALIAS       = 'live_alias';
    public const string ATTR_CURRENT_VERSION  = 'current_version';
    public const string ATTR_STATUS           = 'status';
    public const string ATTR_LANGUAGE         = 'language';
    public const string ATTR_DOCUMENT_COUNT   = 'document_count';
    public const string ATTR_LAST_INDEXED_AT  = 'last_indexed_at';
    public const string ATTR_LAST_SWAP_AT     = 'last_swap_at';
    public const string ATTR_FIELD_SPECS      = 'field_specs';
    public const string ATTR_FACET_SPECS      = 'facet_specs';
    public const string ATTR_BOOST_SPECS      = 'boost_specs';
    public const string ATTR_CONFIG_HASH      = 'config_hash';
    public const string ATTR_RETENTION_TIER   = 'retention_tier';
    public const string ATTR_METADATA         = 'metadata';
    public const string ATTR_CREATED_BY       = 'created_by';
    public const string ATTR_UPDATED_BY       = 'updated_by';
    public const string ATTR_DELETED_BY       = 'deleted_by';
    public const string ATTR_CREATED_AT       = 'created_at';
    public const string ATTR_UPDATED_AT       = 'updated_at';
    public const string ATTR_DELETED_AT       = 'deleted_at';
}
