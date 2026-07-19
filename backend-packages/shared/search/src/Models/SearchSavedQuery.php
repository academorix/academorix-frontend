<?php

declare(strict_types=1);

namespace Academorix\Search\Models;

use Academorix\Database\Concerns\HasMetadata;
use Academorix\Database\Concerns\HasPrefixedUlid;
use Academorix\Search\Contracts\Data\SearchSavedQueryInterface;
use Academorix\Search\Database\Factories\SearchSavedQueryFactory;
use Academorix\Search\Policies\SearchSavedQueryPolicy;
use Academorix\Tenancy\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Attributes\WithoutIncrementing;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Mattiverse\Userstamps\Traits\Userstamps;

/**
 * Eloquent model for a {@see SearchSavedQueryInterface}.
 *
 * Per-user saved query or smart list. `is_shared` marks tenant-wide
 * visibility; ownership is tracked via `owner_id`.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[Table(
    name: SearchSavedQueryInterface::TABLE,
    key: SearchSavedQueryInterface::PRIMARY_KEY,
    keyType: SearchSavedQueryInterface::KEY_TYPE,
)]
#[Fillable([
    SearchSavedQueryInterface::ATTR_TENANT_ID,
    SearchSavedQueryInterface::ATTR_OWNER_ID,
    SearchSavedQueryInterface::ATTR_NAME,
    SearchSavedQueryInterface::ATTR_DESCRIPTION,
    SearchSavedQueryInterface::ATTR_ACROSS,
    SearchSavedQueryInterface::ATTR_QUERY,
    SearchSavedQueryInterface::ATTR_FILTERS,
    SearchSavedQueryInterface::ATTR_FACETS,
    SearchSavedQueryInterface::ATTR_BOOSTS,
    SearchSavedQueryInterface::ATTR_IS_SHARED,
    SearchSavedQueryInterface::ATTR_IS_SMART_LIST,
    SearchSavedQueryInterface::ATTR_USE_COUNT,
    SearchSavedQueryInterface::ATTR_LAST_RESULT_COUNT,
    SearchSavedQueryInterface::ATTR_LAST_RUN_AT,
    SearchSavedQueryInterface::ATTR_METADATA,
])]
#[UseFactory(SearchSavedQueryFactory::class)]
#[UsePolicy(SearchSavedQueryPolicy::class)]
#[WithoutIncrementing]
final class SearchSavedQuery extends Model implements SearchSavedQueryInterface
{
    use BelongsToTenant;
    use HasFactory;
    use HasMetadata;
    use HasPrefixedUlid;
    use SoftDeletes;
    use Userstamps;

    /**
     * Cast map — JSON, integers, booleans, datetimes coerced on hydrate.
     *
     * @var array<string, string>
     */
    protected $casts = [
        SearchSavedQueryInterface::ATTR_ACROSS            => 'array',
        SearchSavedQueryInterface::ATTR_FILTERS           => 'array',
        SearchSavedQueryInterface::ATTR_FACETS            => 'array',
        SearchSavedQueryInterface::ATTR_BOOSTS            => 'array',
        SearchSavedQueryInterface::ATTR_METADATA          => 'array',
        SearchSavedQueryInterface::ATTR_IS_SHARED         => 'boolean',
        SearchSavedQueryInterface::ATTR_IS_SMART_LIST     => 'boolean',
        SearchSavedQueryInterface::ATTR_USE_COUNT         => 'integer',
        SearchSavedQueryInterface::ATTR_LAST_RESULT_COUNT => 'integer',
        SearchSavedQueryInterface::ATTR_LAST_RUN_AT       => 'datetime',
    ];
}
