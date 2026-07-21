<?php

declare(strict_types=1);

namespace Stackra\Search\Contracts\Data;

use Stackra\Search\Models\SearchSynonym;
use Illuminate\Container\Attributes\Bind;

/**
 * Table shape for the `search_synonyms` table.
 *
 * Per-tenant + per-language synonym entry. Platform-seeded rows carry
 * `is_system = true` and can only be disabled (`is_active = false`)
 * by tenants — never deleted.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[Bind(SearchSynonym::class)]
interface SearchSynonymInterface
{
    public const string TABLE = 'search_synonyms';

    public const string PRIMARY_KEY = 'id';

    public const string KEY_TYPE = 'string';

    public const string ID_PREFIX = 'syn';

    // ── Columns ───────────────────────────────────────────────

    public const string ATTR_ID              = 'id';
    public const string ATTR_TENANT_ID       = 'tenant_id';
    public const string ATTR_SEARCH_INDEX_ID = 'search_index_id';
    public const string ATTR_LANGUAGE        = 'language';
    public const string ATTR_KIND            = 'kind';
    public const string ATTR_TERMS           = 'terms';
    public const string ATTR_ONE_WAY_SOURCE  = 'one_way_source';
    public const string ATTR_ONE_WAY_TARGETS = 'one_way_targets';
    public const string ATTR_IS_ACTIVE       = 'is_active';
    public const string ATTR_IS_SYSTEM       = 'is_system';
    public const string ATTR_SOURCE          = 'source';
    public const string ATTR_DESCRIPTION     = 'description';
    public const string ATTR_METADATA        = 'metadata';
    public const string ATTR_CREATED_BY_TYPE = 'created_by_type';
    public const string ATTR_CREATED_BY_ID   = 'created_by_id';
    public const string ATTR_CREATED_BY      = 'created_by';
    public const string ATTR_UPDATED_BY      = 'updated_by';
    public const string ATTR_DELETED_BY      = 'deleted_by';
    public const string ATTR_CREATED_AT      = 'created_at';
    public const string ATTR_UPDATED_AT      = 'updated_at';
    public const string ATTR_DELETED_AT      = 'deleted_at';
}
