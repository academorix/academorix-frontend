<?php

declare(strict_types=1);

namespace Academorix\Search\Contracts\Data;

use Academorix\Search\Models\SearchSavedQuery;
use Illuminate\Container\Attributes\Bind;

/**
 * Table shape for the `search_saved_queries` table.
 *
 * Per-user saved query or smart list. Shared queries (`is_shared`)
 * are visible tenant-wide; owner_id is the User who created the row.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[Bind(SearchSavedQuery::class)]
interface SearchSavedQueryInterface
{
    public const string TABLE = 'search_saved_queries';

    public const string PRIMARY_KEY = 'id';

    public const string KEY_TYPE = 'string';

    public const string ID_PREFIX = 'sq';

    // ── Columns ───────────────────────────────────────────────

    public const string ATTR_ID                = 'id';
    public const string ATTR_TENANT_ID         = 'tenant_id';
    public const string ATTR_OWNER_ID          = 'owner_id';
    public const string ATTR_NAME              = 'name';
    public const string ATTR_DESCRIPTION       = 'description';
    public const string ATTR_ACROSS            = 'across';
    public const string ATTR_QUERY             = 'query';
    public const string ATTR_FILTERS           = 'filters';
    public const string ATTR_FACETS            = 'facets';
    public const string ATTR_BOOSTS            = 'boosts';
    public const string ATTR_IS_SHARED         = 'is_shared';
    public const string ATTR_IS_SMART_LIST     = 'is_smart_list';
    public const string ATTR_USE_COUNT         = 'use_count';
    public const string ATTR_LAST_RESULT_COUNT = 'last_result_count';
    public const string ATTR_LAST_RUN_AT       = 'last_run_at';
    public const string ATTR_METADATA          = 'metadata';
    public const string ATTR_CREATED_BY        = 'created_by';
    public const string ATTR_UPDATED_BY        = 'updated_by';
    public const string ATTR_DELETED_BY        = 'deleted_by';
    public const string ATTR_CREATED_AT        = 'created_at';
    public const string ATTR_UPDATED_AT        = 'updated_at';
    public const string ATTR_DELETED_AT        = 'deleted_at';
}
