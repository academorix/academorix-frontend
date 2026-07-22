<?php

declare(strict_types=1);

namespace Stackra\Versioning\Models;

use Stackra\Database\Concerns\HasMetadata;
use Stackra\Database\Concerns\HasPrefixedUlid;
use Stackra\Versioning\Contracts\Data\DeprecationNoticeInterface;
use Stackra\Versioning\Database\Factories\DeprecationNoticeFactory;
use Stackra\Versioning\Enums\DeprecationSurface;
use Stackra\Versioning\Observers\DeprecationNoticeObserver;
use Stackra\Versioning\Policies\DeprecationNoticePolicy;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Attributes\WithoutIncrementing;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Wildside\Userstamps\Traits\Userstamps;
use OwenIt\Auditing\Auditable;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

/**
 * Eloquent model for {@see DeprecationNoticeInterface}.
 *
 * Global — NO `BelongsToTenant`. No `SoftDeletes` — notices are
 * append-only once published; text corrections produce a new notice.
 *
 * @category Versioning
 *
 * @since    0.1.0
 */
#[Table(
    name: DeprecationNoticeInterface::TABLE,
    key: DeprecationNoticeInterface::PRIMARY_KEY,
    keyType: DeprecationNoticeInterface::KEY_TYPE,
)]
#[Fillable([
    DeprecationNoticeInterface::ATTR_API_VERSION_ID,
    DeprecationNoticeInterface::ATTR_SURFACE,
    DeprecationNoticeInterface::ATTR_TITLE,
    DeprecationNoticeInterface::ATTR_BODY,
    DeprecationNoticeInterface::ATTR_STARTS_AT,
    DeprecationNoticeInterface::ATTR_ENDS_AT,
    DeprecationNoticeInterface::ATTR_IS_ACTIVE,
    DeprecationNoticeInterface::ATTR_REPLACEMENT_VERSION,
    DeprecationNoticeInterface::ATTR_METADATA,
])]
#[UseFactory(DeprecationNoticeFactory::class)]
#[UsePolicy(DeprecationNoticePolicy::class)]
#[ObservedBy([DeprecationNoticeObserver::class])]
#[WithoutIncrementing]
final class DeprecationNotice extends Model implements AuditableContract, DeprecationNoticeInterface
{
    use Auditable;
    use HasFactory;
    use HasMetadata;
    use HasPrefixedUlid;
    use Userstamps;

    /**
     * Cast map — enums + boolean + datetime coercion on hydrate.
     *
     * @var array<string, string>
     */
    protected $casts = [
        DeprecationNoticeInterface::ATTR_SURFACE   => DeprecationSurface::class,
        DeprecationNoticeInterface::ATTR_IS_ACTIVE => 'boolean',
        DeprecationNoticeInterface::ATTR_STARTS_AT => 'datetime',
        DeprecationNoticeInterface::ATTR_ENDS_AT   => 'datetime',
        DeprecationNoticeInterface::ATTR_METADATA  => 'array',
    ];

    /**
     * The ApiVersion this notice attaches to.
     *
     * @return BelongsTo<ApiVersion, $this>
     */
    public function apiVersion(): BelongsTo
    {
        return $this->belongsTo(
            ApiVersion::class,
            DeprecationNoticeInterface::ATTR_API_VERSION_ID,
        );
    }

    /**
     * Whether this notice is presently active — `is_active` toggled on
     * AND (`starts_at` is null OR in the past) AND (`ends_at` is null
     * OR in the future).
     */
    public function isCurrentlyActive(): bool
    {
        if (! (bool) $this->{DeprecationNoticeInterface::ATTR_IS_ACTIVE}) {
            return false;
        }

        $startsAt = $this->{DeprecationNoticeInterface::ATTR_STARTS_AT};
        if ($startsAt !== null && $startsAt->isFuture()) {
            return false;
        }

        $endsAt = $this->{DeprecationNoticeInterface::ATTR_ENDS_AT};
        if ($endsAt !== null && $endsAt->isPast()) {
            return false;
        }

        return true;
    }
}
