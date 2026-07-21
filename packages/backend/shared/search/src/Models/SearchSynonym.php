<?php

declare(strict_types=1);

namespace Stackra\Search\Models;

use Stackra\Database\Concerns\HasMetadata;
use Stackra\Database\Concerns\HasPrefixedUlid;
use Stackra\Database\Concerns\HasSystemFlag;
use Stackra\Search\Contracts\Data\SearchSynonymInterface;
use Stackra\Search\Database\Factories\SearchSynonymFactory;
use Stackra\Search\Enums\SynonymKind;
use Stackra\Search\Observers\SearchSynonymObserver;
use Stackra\Search\Policies\SearchSynonymPolicy;
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
use Mattiverse\Userstamps\Traits\Userstamps;

/**
 * Eloquent model for a {@see SearchSynonymInterface}.
 *
 * Platform-seeded rows carry `is_system = true` and can only be
 * disabled (`is_active = false`) by tenants — never deleted.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[Table(
    name: SearchSynonymInterface::TABLE,
    key: SearchSynonymInterface::PRIMARY_KEY,
    keyType: SearchSynonymInterface::KEY_TYPE,
)]
#[Fillable([
    SearchSynonymInterface::ATTR_TENANT_ID,
    SearchSynonymInterface::ATTR_SEARCH_INDEX_ID,
    SearchSynonymInterface::ATTR_LANGUAGE,
    SearchSynonymInterface::ATTR_KIND,
    SearchSynonymInterface::ATTR_TERMS,
    SearchSynonymInterface::ATTR_ONE_WAY_SOURCE,
    SearchSynonymInterface::ATTR_ONE_WAY_TARGETS,
    SearchSynonymInterface::ATTR_IS_ACTIVE,
    SearchSynonymInterface::ATTR_IS_SYSTEM,
    SearchSynonymInterface::ATTR_SOURCE,
    SearchSynonymInterface::ATTR_DESCRIPTION,
    SearchSynonymInterface::ATTR_METADATA,
    SearchSynonymInterface::ATTR_CREATED_BY_TYPE,
    SearchSynonymInterface::ATTR_CREATED_BY_ID,
])]
#[UseFactory(SearchSynonymFactory::class)]
#[UsePolicy(SearchSynonymPolicy::class)]
#[ObservedBy([SearchSynonymObserver::class])]
#[WithoutIncrementing]
final class SearchSynonym extends Model implements SearchSynonymInterface
{
    use BelongsToTenant;
    use HasFactory;
    use HasMetadata;
    use HasPrefixedUlid;
    use HasSystemFlag;
    use SoftDeletes;
    use Userstamps;

    /**
     * Cast map — enums, JSON, and booleans coerced on hydrate.
     *
     * @var array<string, string>
     */
    protected $casts = [
        SearchSynonymInterface::ATTR_KIND            => SynonymKind::class,
        SearchSynonymInterface::ATTR_TERMS           => 'array',
        SearchSynonymInterface::ATTR_ONE_WAY_TARGETS => 'array',
        SearchSynonymInterface::ATTR_METADATA        => 'array',
        SearchSynonymInterface::ATTR_IS_ACTIVE       => 'boolean',
        SearchSynonymInterface::ATTR_IS_SYSTEM       => 'boolean',
    ];
}
