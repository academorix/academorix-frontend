<?php

declare(strict_types=1);

namespace Stackra\Storage\Data;

use Stackra\Storage\Contracts\Data\SignedUrlAuditInterface;
use Stackra\Storage\Enums\SignedUrlPurpose;
use Stackra\Storage\Models\SignedUrlAudit;
use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Attributes\WithCast;
use Spatie\LaravelData\Casts\DateTimeInterfaceCast;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible output DTO for {@see SignedUrlAudit}.
 *
 * `signature_hash` is deliberately absent — it's the redemption
 * lookup secret.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[MapOutputName(SnakeCaseMapper::class)]
final class SignedUrlAuditData extends Data
{
    /**
     * @param  string                     $id                Prefixed ULID `sua_<26>`.
     * @param  string                     $fileId            Target file.
     * @param  string|null                $variantKey        Optional variant.
     * @param  string                     $tenantId          Owning tenant.
     * @param  string|null                $issuedByUserId    Actor.
     * @param  string|null                $issuedByService   Service actor.
     * @param  string|null                $issuedToUserId    Recipient.
     * @param  SignedUrlPurpose           $purpose           Purpose.
     * @param  int                        $ttlSeconds        Requested TTL.
     * @param  int                        $hitCount          Redemption count.
     * @param  bool                       $oneTimeUse        Whether burn-after-read.
     * @param  \DateTimeInterface         $issuedAt          Issue timestamp.
     * @param  \DateTimeInterface         $expiresAt         Expiry timestamp.
     * @param  \DateTimeInterface|null    $lastHitAt         Last redemption.
     * @param  \DateTimeInterface|null    $revokedAt         Revocation moment.
     * @param  string|null                $revokedReason     Free-form reason.
     */
    public function __construct(
        public string $id,
        public string $fileId,
        public ?string $variantKey,
        public string $tenantId,
        public ?string $issuedByUserId,
        public ?string $issuedByService,
        public ?string $issuedToUserId,
        public SignedUrlPurpose $purpose,
        public int $ttlSeconds,
        public int $hitCount,
        public bool $oneTimeUse,
        #[WithCast(DateTimeInterfaceCast::class)]
        public \DateTimeInterface $issuedAt,
        #[WithCast(DateTimeInterfaceCast::class)]
        public \DateTimeInterface $expiresAt,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $lastHitAt = null,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $revokedAt = null,
        public ?string $revokedReason = null,
    ) {
    }

    public static function fromModel(SignedUrlAudit $audit): self
    {
        $purposeRaw = $audit->{SignedUrlAuditInterface::ATTR_PURPOSE};
        $purpose    = $purposeRaw instanceof SignedUrlPurpose
            ? $purposeRaw
            : (SignedUrlPurpose::tryFrom((string) $purposeRaw) ?? SignedUrlPurpose::Download);

        return new self(
            id: (string) $audit->getKey(),
            fileId: (string) $audit->{SignedUrlAuditInterface::ATTR_FILE_ID},
            variantKey: $audit->{SignedUrlAuditInterface::ATTR_VARIANT_KEY},
            tenantId: (string) $audit->{SignedUrlAuditInterface::ATTR_TENANT_ID},
            issuedByUserId: $audit->{SignedUrlAuditInterface::ATTR_ISSUED_BY_USER_ID},
            issuedByService: $audit->{SignedUrlAuditInterface::ATTR_ISSUED_BY_SERVICE},
            issuedToUserId: $audit->{SignedUrlAuditInterface::ATTR_ISSUED_TO_USER_ID},
            purpose: $purpose,
            ttlSeconds: (int) $audit->{SignedUrlAuditInterface::ATTR_TTL_SECONDS},
            hitCount: (int) $audit->{SignedUrlAuditInterface::ATTR_HIT_COUNT},
            oneTimeUse: (bool) $audit->{SignedUrlAuditInterface::ATTR_ONE_TIME_USE},
            issuedAt: $audit->{SignedUrlAuditInterface::ATTR_ISSUED_AT},
            expiresAt: $audit->{SignedUrlAuditInterface::ATTR_EXPIRES_AT},
            lastHitAt: $audit->{SignedUrlAuditInterface::ATTR_LAST_HIT_AT},
            revokedAt: $audit->{SignedUrlAuditInterface::ATTR_REVOKED_AT},
            revokedReason: $audit->{SignedUrlAuditInterface::ATTR_REVOKED_REASON},
        );
    }
}
