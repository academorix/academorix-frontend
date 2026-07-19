<?php

declare(strict_types=1);

namespace Academorix\Storage\Models;

use Academorix\Database\Concerns\HasMetadata;
use Academorix\Database\Concerns\HasPrefixedUlid;
use Academorix\Storage\Contracts\Data\SignedUrlAuditInterface;
use Academorix\Storage\Database\Factories\SignedUrlAuditFactory;
use Academorix\Storage\Enums\SignedUrlPurpose;
use Academorix\Tenancy\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Attributes\WithoutIncrementing;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Mattiverse\Userstamps\Traits\Userstamps;
use OwenIt\Auditing\Auditable;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

/**
 * Eloquent model for a {@see SignedUrlAuditInterface}.
 *
 * Append-only audit log — one row per signed URL the module issues.
 * No `SoftDeletes` — expired rows are hard-purged by the retention
 * job. The `signature_hash` column is the redemption lookup key.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[Table(
    name: SignedUrlAuditInterface::TABLE,
    key: SignedUrlAuditInterface::PRIMARY_KEY,
    keyType: SignedUrlAuditInterface::KEY_TYPE,
)]
#[Fillable([
    SignedUrlAuditInterface::ATTR_FILE_ID,
    SignedUrlAuditInterface::ATTR_VARIANT_KEY,
    SignedUrlAuditInterface::ATTR_TENANT_ID,
    SignedUrlAuditInterface::ATTR_ISSUED_BY_USER_ID,
    SignedUrlAuditInterface::ATTR_ISSUED_BY_SERVICE,
    SignedUrlAuditInterface::ATTR_ISSUED_TO_USER_ID,
    SignedUrlAuditInterface::ATTR_PURPOSE,
    SignedUrlAuditInterface::ATTR_SIGNATURE_HASH,
    SignedUrlAuditInterface::ATTR_TTL_SECONDS,
    SignedUrlAuditInterface::ATTR_ISSUED_AT,
    SignedUrlAuditInterface::ATTR_EXPIRES_AT,
    SignedUrlAuditInterface::ATTR_IP_LOCK,
    SignedUrlAuditInterface::ATTR_USER_LOCK,
    SignedUrlAuditInterface::ATTR_ONE_TIME_USE,
    SignedUrlAuditInterface::ATTR_HIT_COUNT,
    SignedUrlAuditInterface::ATTR_LAST_HIT_AT,
    SignedUrlAuditInterface::ATTR_REVOKED_AT,
    SignedUrlAuditInterface::ATTR_REVOKED_REASON,
    SignedUrlAuditInterface::ATTR_METADATA,
])]
#[UseFactory(SignedUrlAuditFactory::class)]
#[WithoutIncrementing]
final class SignedUrlAudit extends Model implements AuditableContract, SignedUrlAuditInterface
{
    use Auditable;
    use BelongsToTenant;
    use HasFactory;
    use HasMetadata;
    use HasPrefixedUlid;
    use Userstamps;

    /**
     * Signature hash is never exposed on the wire — it's a lookup
     * secret.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        SignedUrlAuditInterface::ATTR_SIGNATURE_HASH,
    ];

    /**
     * Cast map.
     *
     * @var array<string, string>
     */
    protected $casts = [
        SignedUrlAuditInterface::ATTR_PURPOSE       => SignedUrlPurpose::class,
        SignedUrlAuditInterface::ATTR_TTL_SECONDS   => 'integer',
        SignedUrlAuditInterface::ATTR_HIT_COUNT     => 'integer',
        SignedUrlAuditInterface::ATTR_ONE_TIME_USE  => 'boolean',
        SignedUrlAuditInterface::ATTR_METADATA      => 'array',
        SignedUrlAuditInterface::ATTR_ISSUED_AT     => 'datetime',
        SignedUrlAuditInterface::ATTR_EXPIRES_AT    => 'datetime',
        SignedUrlAuditInterface::ATTR_LAST_HIT_AT   => 'datetime',
        SignedUrlAuditInterface::ATTR_REVOKED_AT    => 'datetime',
    ];

    /**
     * The file this URL grants access to.
     *
     * @return BelongsTo<File, $this>
     */
    public function file(): BelongsTo
    {
        /** @var BelongsTo<File, $this> $relation */
        $relation = $this->belongsTo(File::class, SignedUrlAuditInterface::ATTR_FILE_ID);

        return $relation;
    }

    /**
     * Whether this audit row is still live — not revoked and not
     * past its `expires_at`.
     */
    public function isActive(): bool
    {
        $expiresAt = $this->{SignedUrlAuditInterface::ATTR_EXPIRES_AT};
        $revokedAt = $this->{SignedUrlAuditInterface::ATTR_REVOKED_AT};

        return $revokedAt === null
            && $expiresAt !== null
            && $expiresAt->greaterThan(\now());
    }
}
