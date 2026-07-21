<?php

declare(strict_types=1);

namespace Stackra\Search\Contracts\Data;

use Stackra\Search\Models\SearchAnalyticsEvent;
use Illuminate\Container\Attributes\Bind;

/**
 * Table shape for the `search_analytics_events` table.
 *
 * Append-only telemetry row for one query / no-results /
 * click-through / suggest event. Raw query text lives in `query` +
 * a SHA-256 fingerprint lives in `query_hash` for aggregation-safe
 * dashboards. Retention is tier-driven — query text is scrubbed
 * before rows are pruned.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[Bind(SearchAnalyticsEvent::class)]
interface SearchAnalyticsEventInterface
{
    public const string TABLE = 'search_analytics_events';

    public const string PRIMARY_KEY = 'id';

    public const string KEY_TYPE = 'string';

    public const string ID_PREFIX = 'sae';

    // ── Columns ───────────────────────────────────────────────

    public const string ATTR_ID                   = 'id';
    public const string ATTR_TENANT_ID            = 'tenant_id';
    public const string ATTR_USER_ID              = 'user_id';
    public const string ATTR_SEARCH_SESSION_ID    = 'search_session_id';
    public const string ATTR_SAVED_QUERY_ID       = 'saved_query_id';
    public const string ATTR_KIND                 = 'kind';
    public const string ATTR_ENGINE               = 'engine';
    public const string ATTR_INDEX_NAMES          = 'index_names';
    public const string ATTR_QUERY                = 'query';
    public const string ATTR_QUERY_HASH           = 'query_hash';
    public const string ATTR_RESULT_COUNT         = 'result_count';
    public const string ATTR_TOOK_MS              = 'took_ms';
    public const string ATTR_HAD_TYPO_CORRECTION  = 'had_typo_correction';
    public const string ATTR_WAS_FROM_SAVED_QUERY = 'was_from_saved_query';
    public const string ATTR_CLICKED_RESULT_TYPE  = 'clicked_result_type';
    public const string ATTR_CLICKED_RESULT_ID    = 'clicked_result_id';
    public const string ATTR_CLICKED_POSITION     = 'clicked_position';
    public const string ATTR_RETENTION_TIER       = 'retention_tier';
    public const string ATTR_CREATED_AT           = 'created_at';
    public const string ATTR_UPDATED_AT           = 'updated_at';
}
