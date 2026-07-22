<?php

declare(strict_types=1);

namespace Stackra\Search\Models;

use Stackra\Database\Concerns\HasMetadata;
use Stackra\Database\Concerns\HasPrefixedUlid;
use Stackra\Search\Contracts\Data\SearchIndexInterface;
use Stackra\Search\Database\Factories\SearchIndexFactory;
use Stackra\Search\Enums\SearchEngine;
use Stackra\Search\Enums\SearchIndexStatus;
use Stackra\Search\Observers\SearchIndexObserver;
use Stackra\Search\Policies\SearchIndexPolicy;
use Stackra\Tenancy\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Attributes\WithoutIncrementing;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Wildside\Userstamps\Traits\Userstamps;
use OwenIt\Auditing\Auditable;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

/**
 * Eloquent model for a {@see SearchIndexInterface}.
 *
 * Registry row for one `#[Searchable]` model class. Composes the full
 * lifecycle stack — dual-write to activity + audit on registration /
 * alias swap.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[Table(
    name: SearchIndexInterface::TABLE,
    key: SearchIndexInterface::PRIMARY_KEY,
    keyType: SearchIndexInterface::KEY_TYPE,
)]
#[Fillable([
    SearchIndexInterface::ATTR_TENANT_ID,
    SearchIndexInterface::ATTR_MODEL_CLASS,
    SearchIndexInterface::ATTR_ENGINE,
    SearchIndexInterface::ATTR_INDEX_NAME,
    SearchIndexInterface::ATTR_LIVE_ALIAS,
    SearchIndexInterface::ATTR_CURRENT_VERSION,
    SearchIndexInterface::ATTR_STATUS,
    SearchIndexInterface::ATTR_LANGUAGE,
    SearchIndexInterface::ATTR_DOCUMENT_COUNT,
    SearchIndexInterface::ATTR_LAST_INDEXED_AT,
    SearchIndexInterface::ATTR_LAST_SWAP_AT,
    SearchIndexInterface::ATTR_FIELD_SPECS,
    SearchIndexInterface::ATTR_FACET_SPECS,
    SearchIndexInterface::ATTR_BOOST_SPECS,
    SearchIndexInterface::ATTR_CONFIG_HASH,
    SearchIndexInterface::ATTR_RETENTION_TIER,
    SearchIndexInterface::ATTR_METADATA,
])]
#[UseFactory(SearchIndexFactory::class)]
#[UsePolicy(SearchIndexPolicy::class)]
#[ObservedBy([SearchIndexObserver::class])]
#[WithoutIncrementing]
final class SearchIndex extends Model implements AuditableContract, SearchIndexInterface
{
    use Auditable;
    use BelongsToTenant;
    use HasFactory;
    use HasMetadata;
    use HasPrefixedUlid;
    use SoftDeletes;
    use Userstamps;

    /**
     * Cast map — enums, JSON blobs, and datetimes coerced on hydrate.
     *
     * @var array<string, string>
     */
    protected $casts = [
        SearchIndexInterface::ATTR_ENGINE          => SearchEngine::class,
        SearchIndexInterface::ATTR_STATUS          => SearchIndexStatus::class,
        SearchIndexInterface::ATTR_FIELD_SPECS     => 'array',
        SearchIndexInterface::ATTR_FACET_SPECS     => 'array',
        SearchIndexInterface::ATTR_BOOST_SPECS     => 'array',
        SearchIndexInterface::ATTR_METADATA        => 'array',
        SearchIndexInterface::ATTR_LAST_INDEXED_AT => 'datetime',
        SearchIndexInterface::ATTR_LAST_SWAP_AT    => 'datetime',
        SearchIndexInterface::ATTR_DOCUMENT_COUNT  => 'integer',
        SearchIndexInterface::ATTR_CURRENT_VERSION => 'integer',
    ];
}
