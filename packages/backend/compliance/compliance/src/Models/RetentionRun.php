<?php

declare(strict_types=1);

namespace Academorix\Compliance\Models;

use Academorix\Compliance\Contracts\Data\RetentionRunInterface;
use Academorix\Compliance\Database\Factories\RetentionRunFactory;
use Academorix\Compliance\Observers\RetentionRunObserver;
use Academorix\Compliance\Policies\RetentionRunPolicy;
use Academorix\Database\Concerns\HasMetadata;
use Academorix\Database\Concerns\HasPrefixedUlid;
use Academorix\Tenancy\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Attributes\WithoutIncrementing;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Eloquent model for a {@see RetentionRunInterface}.
 *
 * High-volume table (one row per tenant per sweep). NO SoftDeletes,
 * NO HasUserstamps, NO HasActivityLog, NO HasAuditable. Hard-purged
 * after 365 days.
 *
 * @category Compliance
 *
 * @since    0.1.0
 */
#[Table(
    name: RetentionRunInterface::TABLE,
    key: RetentionRunInterface::PRIMARY_KEY,
    keyType: RetentionRunInterface::KEY_TYPE,
)]
#[Fillable([
    RetentionRunInterface::ATTR_TENANT_ID,
    RetentionRunInterface::ATTR_STARTED_AT,
    RetentionRunInterface::ATTR_FINISHED_AT,
    RetentionRunInterface::ATTR_STATUS,
    RetentionRunInterface::ATTR_TRIGGER,
    RetentionRunInterface::ATTR_TRIGGERED_BY,
    RetentionRunInterface::ATTR_PURGED_COUNT,
    RetentionRunInterface::ATTR_ANONYMIZED_COUNT,
    RetentionRunInterface::ATTR_ARCHIVED_COUNT,
    RetentionRunInterface::ATTR_HELD_COUNT,
    RetentionRunInterface::ATTR_SKIPPED_COUNT,
    RetentionRunInterface::ATTR_FAILED_COUNT,
    RetentionRunInterface::ATTR_SUMMARY,
    RetentionRunInterface::ATTR_METADATA,
])]
#[UseFactory(RetentionRunFactory::class)]
#[UsePolicy(RetentionRunPolicy::class)]
#[ObservedBy([RetentionRunObserver::class])]
#[WithoutIncrementing]
final class RetentionRun extends Model implements RetentionRunInterface
{
    use BelongsToTenant;
    use HasFactory;
    use HasMetadata;
    use HasPrefixedUlid;

    /**
     * Cast map — datetimes + integers + JSON coerced on hydrate.
     *
     * @var array<string, string>
     */
    protected $casts = [
        RetentionRunInterface::ATTR_STARTED_AT       => 'datetime',
        RetentionRunInterface::ATTR_FINISHED_AT      => 'datetime',
        RetentionRunInterface::ATTR_PURGED_COUNT     => 'integer',
        RetentionRunInterface::ATTR_ANONYMIZED_COUNT => 'integer',
        RetentionRunInterface::ATTR_ARCHIVED_COUNT   => 'integer',
        RetentionRunInterface::ATTR_HELD_COUNT       => 'integer',
        RetentionRunInterface::ATTR_SKIPPED_COUNT    => 'integer',
        RetentionRunInterface::ATTR_FAILED_COUNT     => 'integer',
        RetentionRunInterface::ATTR_SUMMARY          => 'array',
    ];
}
