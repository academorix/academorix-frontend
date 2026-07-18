<?php

declare(strict_types=1);

namespace Academorix\Search\Models;

use Academorix\Database\Concerns\HasPrefixedUlid;
use Academorix\Search\Contracts\Data\SearchAnalyticsEventInterface;
use Academorix\Search\Database\Factories\SearchAnalyticsEventFactory;
use Academorix\Search\Enums\AnalyticsEventKind;
use Academorix\Search\Enums\SearchEngine;
use Academorix\Search\Policies\SearchAnalyticsEventPolicy;
use Academorix\Tenancy\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Attributes\WithoutIncrementing;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Eloquent model for a {@see SearchAnalyticsEventInterface}.
 *
 * Append-only telemetry — no `SoftDeletes` (retention is hard-delete),
 * no `HasActivityLog` (would drown the feed), no `HasAudit` (query
 * volume isn't compliance evidence). The `query` column is hidden on
 * the wire; only aggregation-safe `query_hash` is emitted publicly.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[Table(
    name: SearchAnalyticsEventInterface::TABLE,
    key: SearchAnalyticsEventInterface::PRIMARY_KEY,
    keyType: SearchAnalyticsEventInterface::KEY_TYPE,
)]
#[Fillable([
    SearchAnalyticsEventInterface::ATTR_TENANT_ID,
    SearchAnalyticsEventInterface::ATTR_USER_ID,
    SearchAnalyticsEventInterface::ATTR_SEARCH_SESSION_ID,
    SearchAnalyticsEventInterface::ATTR_SAVED_QUERY_ID,
    SearchAnalyticsEventInterface::ATTR_KIND,
    SearchAnalyticsEventInterface::ATTR_ENGINE,
    SearchAnalyticsEventInterface::ATTR_INDEX_NAMES,
    SearchAnalyticsEventInterface::ATTR_QUERY,
    SearchAnalyticsEventInterface::ATTR_QUERY_HASH,
    SearchAnalyticsEventInterface::ATTR_RESULT_COUNT,
    SearchAnalyticsEventInterface::ATTR_TOOK_MS,
    SearchAnalyticsEventInterface::ATTR_HAD_TYPO_CORRECTION,
    SearchAnalyticsEventInterface::ATTR_WAS_FROM_SAVED_QUERY,
    SearchAnalyticsEventInterface::ATTR_CLICKED_RESULT_TYPE,
    SearchAnalyticsEventInterface::ATTR_CLICKED_RESULT_ID,
    SearchAnalyticsEventInterface::ATTR_CLICKED_POSITION,
    SearchAnalyticsEventInterface::ATTR_RETENTION_TIER,
])]
#[Hidden([SearchAnalyticsEventInterface::ATTR_QUERY])]
#[UseFactory(SearchAnalyticsEventFactory::class)]
#[UsePolicy(SearchAnalyticsEventPolicy::class)]
#[WithoutIncrementing]
final class SearchAnalyticsEvent extends Model implements SearchAnalyticsEventInterface
{
    use BelongsToTenant;
    use HasFactory;
    use HasPrefixedUlid;

    /**
     * Cast map — enums + JSON + numerics + booleans coerced on hydrate.
     *
     * @var array<string, string>
     */
    protected $casts = [
        SearchAnalyticsEventInterface::ATTR_KIND                 => AnalyticsEventKind::class,
        SearchAnalyticsEventInterface::ATTR_ENGINE               => SearchEngine::class,
        SearchAnalyticsEventInterface::ATTR_INDEX_NAMES          => 'array',
        SearchAnalyticsEventInterface::ATTR_RESULT_COUNT         => 'integer',
        SearchAnalyticsEventInterface::ATTR_TOOK_MS              => 'integer',
        SearchAnalyticsEventInterface::ATTR_HAD_TYPO_CORRECTION  => 'boolean',
        SearchAnalyticsEventInterface::ATTR_WAS_FROM_SAVED_QUERY => 'boolean',
        SearchAnalyticsEventInterface::ATTR_CLICKED_POSITION     => 'integer',
    ];
}
