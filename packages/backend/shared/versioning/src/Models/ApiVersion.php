<?php

declare(strict_types=1);

namespace Stackra\Versioning\Models;

use Stackra\Database\Concerns\HasMetadata;
use Stackra\Database\Concerns\HasPrefixedUlid;
use Stackra\Database\Concerns\HasSystemFlag;
use Stackra\Versioning\Contracts\Data\ApiVersionInterface;
use Stackra\Versioning\Database\Factories\ApiVersionFactory;
use Stackra\Versioning\Enums\ApiVersionStatus;
use Stackra\Versioning\Enums\VersionScheme;
use Stackra\Versioning\Observers\ApiVersionObserver;
use Stackra\Versioning\Policies\ApiVersionPolicy;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Attributes\WithoutIncrementing;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Wildside\Userstamps\Traits\Userstamps;
use OwenIt\Auditing\Auditable;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

/**
 * Eloquent model for {@see ApiVersionInterface}.
 *
 * Global — NO `BelongsToTenant`. `is_system` blocks tenant-side edits
 * via the policy; the observer emits the lifecycle events on status
 * transitions.
 *
 * @category Versioning
 *
 * @since    0.1.0
 */
#[Table(
    name: ApiVersionInterface::TABLE,
    key: ApiVersionInterface::PRIMARY_KEY,
    keyType: ApiVersionInterface::KEY_TYPE,
)]
#[Fillable([
    ApiVersionInterface::ATTR_SLUG,
    ApiVersionInterface::ATTR_SCHEME,
    ApiVersionInterface::ATTR_SCHEME_VALUE,
    ApiVersionInterface::ATTR_STATUS,
    ApiVersionInterface::ATTR_RELEASED_AT,
    ApiVersionInterface::ATTR_DEPRECATED_AT,
    ApiVersionInterface::ATTR_SUNSET_AT,
    ApiVersionInterface::ATTR_DESCRIPTION,
    ApiVersionInterface::ATTR_IS_SYSTEM,
    ApiVersionInterface::ATTR_METADATA,
])]
#[UseFactory(ApiVersionFactory::class)]
#[UsePolicy(ApiVersionPolicy::class)]
#[ObservedBy([ApiVersionObserver::class])]
#[WithoutIncrementing]
final class ApiVersion extends Model implements ApiVersionInterface, AuditableContract
{
    use Auditable;
    use HasFactory;
    use HasMetadata;
    use HasPrefixedUlid;
    use HasSystemFlag;
    use SoftDeletes;
    use Userstamps;

    /**
     * Cast map — enums + datetime coercion on hydrate.
     *
     * @var array<string, string>
     */
    protected $casts = [
        ApiVersionInterface::ATTR_STATUS        => ApiVersionStatus::class,
        ApiVersionInterface::ATTR_SCHEME        => VersionScheme::class,
        ApiVersionInterface::ATTR_IS_SYSTEM     => 'boolean',
        ApiVersionInterface::ATTR_RELEASED_AT   => 'datetime',
        ApiVersionInterface::ATTR_DEPRECATED_AT => 'datetime',
        ApiVersionInterface::ATTR_SUNSET_AT     => 'datetime',
        ApiVersionInterface::ATTR_METADATA      => 'array',
    ];

    /**
     * Every deprecation notice attached to this version.
     *
     * @return HasMany<DeprecationNotice, $this>
     */
    public function deprecationNotices(): HasMany
    {
        return $this->hasMany(
            DeprecationNotice::class,
            \Stackra\Versioning\Contracts\Data\DeprecationNoticeInterface::ATTR_API_VERSION_ID,
        );
    }

    /**
     * Whether this version is currently deprecated.
     */
    public function isDeprecated(): bool
    {
        return $this->normaliseStatus() === ApiVersionStatus::Deprecated;
    }

    /**
     * Whether this version has been sunset.
     */
    public function isSunset(): bool
    {
        return $this->normaliseStatus() === ApiVersionStatus::Sunset;
    }

    /**
     * Whether this version is released and safe to target.
     */
    public function isReleased(): bool
    {
        return $this->normaliseStatus() === ApiVersionStatus::Released;
    }

    /**
     * Coerce the raw status (enum or string) to the enum.
     */
    private function normaliseStatus(): ApiVersionStatus
    {
        $status = $this->{ApiVersionInterface::ATTR_STATUS};
        if ($status instanceof ApiVersionStatus) {
            return $status;
        }

        return ApiVersionStatus::tryFrom((string) $status) ?? ApiVersionStatus::Draft;
    }
}
