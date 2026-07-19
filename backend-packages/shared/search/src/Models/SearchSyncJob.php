<?php

declare(strict_types=1);

namespace Academorix\Search\Models;

use Academorix\Database\Concerns\HasPrefixedUlid;
use Academorix\Search\Contracts\Data\SearchSyncJobInterface;
use Academorix\Search\Database\Factories\SearchSyncJobFactory;
use Academorix\Search\Enums\SearchSyncJobStatus;
use Academorix\Search\Observers\SearchSyncJobObserver;
use Academorix\Search\Policies\SearchSyncJobPolicy;
use Academorix\Tenancy\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Attributes\WithoutIncrementing;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Mattiverse\Userstamps\Traits\Userstamps;
use OwenIt\Auditing\Auditable;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

/**
 * Eloquent model for a {@see SearchSyncJobInterface}.
 *
 * Operational record for one reindex / backfill / flush / alias-swap /
 * single-document sync. Same lifecycle stack as XferJob — dual-writes
 * to activity + audit on state transitions.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[Table(
    name: SearchSyncJobInterface::TABLE,
    key: SearchSyncJobInterface::PRIMARY_KEY,
    keyType: SearchSyncJobInterface::KEY_TYPE,
)]
#[Fillable([
    SearchSyncJobInterface::ATTR_TENANT_ID,
    SearchSyncJobInterface::ATTR_SEARCH_INDEX_ID,
    SearchSyncJobInterface::ATTR_KIND,
    SearchSyncJobInterface::ATTR_STATUS,
    SearchSyncJobInterface::ATTR_SOURCE,
    SearchSyncJobInterface::ATTR_SOURCE_ARTIFACT_ID,
    SearchSyncJobInterface::ATTR_SOURCE_VERSION,
    SearchSyncJobInterface::ATTR_TARGET_VERSION,
    SearchSyncJobInterface::ATTR_SHARDS_TOTAL,
    SearchSyncJobInterface::ATTR_SHARDS_COMPLETED,
    SearchSyncJobInterface::ATTR_PROGRESS_PERCENT,
    SearchSyncJobInterface::ATTR_COUNTERS,
    SearchSyncJobInterface::ATTR_PARAMS,
    SearchSyncJobInterface::ATTR_RETENTION_TIER,
    SearchSyncJobInterface::ATTR_CAUSER_TYPE,
    SearchSyncJobInterface::ATTR_CAUSER_ID,
    SearchSyncJobInterface::ATTR_NOTIFY_CHANNELS,
    SearchSyncJobInterface::ATTR_NOTIFY_LOCALE,
    SearchSyncJobInterface::ATTR_QUEUE_CONNECTION,
    SearchSyncJobInterface::ATTR_QUEUE_NAME,
    SearchSyncJobInterface::ATTR_LARAVEL_QUEUE_BATCH_ID,
    SearchSyncJobInterface::ATTR_STARTED_AT,
    SearchSyncJobInterface::ATTR_FINISHED_AT,
    SearchSyncJobInterface::ATTR_LAST_PROGRESS_AT,
    SearchSyncJobInterface::ATTR_LAST_ERROR_CODE,
    SearchSyncJobInterface::ATTR_LAST_ERROR_MESSAGE,
    SearchSyncJobInterface::ATTR_CANCELLED_BY_TYPE,
    SearchSyncJobInterface::ATTR_CANCELLED_BY_ID,
    SearchSyncJobInterface::ATTR_CANCEL_REASON,
])]
#[UseFactory(SearchSyncJobFactory::class)]
#[UsePolicy(SearchSyncJobPolicy::class)]
#[ObservedBy([SearchSyncJobObserver::class])]
#[WithoutIncrementing]
final class SearchSyncJob extends Model implements AuditableContract, SearchSyncJobInterface
{
    use Auditable;
    use BelongsToTenant;
    use HasFactory;
    use HasPrefixedUlid;
    use SoftDeletes;
    use Userstamps;

    /**
     * Cast map — enums, JSON, and datetimes coerced on hydrate.
     *
     * @var array<string, string>
     */
    protected $casts = [
        SearchSyncJobInterface::ATTR_STATUS            => SearchSyncJobStatus::class,
        SearchSyncJobInterface::ATTR_COUNTERS          => 'array',
        SearchSyncJobInterface::ATTR_PARAMS            => 'array',
        SearchSyncJobInterface::ATTR_NOTIFY_CHANNELS   => 'array',
        SearchSyncJobInterface::ATTR_STARTED_AT        => 'datetime',
        SearchSyncJobInterface::ATTR_FINISHED_AT       => 'datetime',
        SearchSyncJobInterface::ATTR_LAST_PROGRESS_AT  => 'datetime',
        SearchSyncJobInterface::ATTR_SOURCE_VERSION    => 'integer',
        SearchSyncJobInterface::ATTR_TARGET_VERSION    => 'integer',
        SearchSyncJobInterface::ATTR_SHARDS_TOTAL      => 'integer',
        SearchSyncJobInterface::ATTR_SHARDS_COMPLETED  => 'integer',
        SearchSyncJobInterface::ATTR_PROGRESS_PERCENT  => 'integer',
    ];

    /**
     * @return BelongsTo<SearchIndex, $this>
     */
    public function searchIndex(): BelongsTo
    {
        return $this->belongsTo(SearchIndex::class, SearchSyncJobInterface::ATTR_SEARCH_INDEX_ID);
    }
}
