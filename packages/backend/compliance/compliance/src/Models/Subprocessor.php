<?php

declare(strict_types=1);

namespace Stackra\Compliance\Models;

use Stackra\Compliance\Contracts\Data\SubprocessorInterface;
use Stackra\Compliance\Database\Factories\SubprocessorFactory;
use Stackra\Compliance\Enums\SubprocessorRole;
use Stackra\Compliance\Observers\SubprocessorObserver;
use Stackra\Compliance\Policies\SubprocessorPolicy;
use Stackra\Database\Concerns\HasMetadata;
use Stackra\Database\Concerns\HasPrefixedUlid;
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
 * Eloquent model for a {@see SubprocessorInterface}.
 *
 * Platform-level registry — `tenant_id=NULL` always (no
 * BelongsToTenant). Every change is a DPA amendment; the observer
 * bumps `version` on material updates.
 *
 * @category Compliance
 *
 * @since    0.1.0
 */
#[Table(
    name: SubprocessorInterface::TABLE,
    key: SubprocessorInterface::PRIMARY_KEY,
    keyType: SubprocessorInterface::KEY_TYPE,
)]
#[Fillable([
    SubprocessorInterface::ATTR_NAME,
    SubprocessorInterface::ATTR_ROLE,
    SubprocessorInterface::ATTR_PURPOSE,
    SubprocessorInterface::ATTR_DATA_CLASSES,
    SubprocessorInterface::ATTR_LOCATION,
    SubprocessorInterface::ATTR_LEGAL_BASIS,
    SubprocessorInterface::ATTR_DPA_URL,
    SubprocessorInterface::ATTR_WEBSITE_URL,
    SubprocessorInterface::ATTR_ACTIVE_FROM,
    SubprocessorInterface::ATTR_ACTIVE_UNTIL,
    SubprocessorInterface::ATTR_VERSION,
    SubprocessorInterface::ATTR_LAST_UPDATED_BY_USER_ID,
    SubprocessorInterface::ATTR_IS_SYSTEM,
    SubprocessorInterface::ATTR_METADATA,
])]
#[UseFactory(SubprocessorFactory::class)]
#[UsePolicy(SubprocessorPolicy::class)]
#[ObservedBy([SubprocessorObserver::class])]
#[WithoutIncrementing]
final class Subprocessor extends Model implements AuditableContract, SubprocessorInterface
{
    use Auditable;
    use HasFactory;
    use HasMetadata;
    use HasPrefixedUlid;
    use SoftDeletes;
    use Userstamps;

    /**
     * Cast map — enum + JSON + datetimes + integer + boolean coerced
     * on hydrate.
     *
     * @var array<string, string>
     */
    protected $casts = [
        SubprocessorInterface::ATTR_ROLE         => SubprocessorRole::class,
        SubprocessorInterface::ATTR_DATA_CLASSES => 'array',
        SubprocessorInterface::ATTR_ACTIVE_FROM  => 'datetime',
        SubprocessorInterface::ATTR_ACTIVE_UNTIL => 'datetime',
        SubprocessorInterface::ATTR_VERSION      => 'integer',
        SubprocessorInterface::ATTR_IS_SYSTEM    => 'boolean',
    ];
}
