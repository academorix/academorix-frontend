<?php

declare(strict_types=1);

namespace Stackra\Domains\Data;

use Stackra\Domains\Contracts\Data\DomainInterface;
use Stackra\Domains\Enums\DomainKind;
use Stackra\Domains\Enums\DomainVerificationMethod;
use Stackra\Domains\Enums\SslStatus;
use Stackra\Domains\Models\Domain;
use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Attributes\WithCast;
use Spatie\LaravelData\Casts\DateTimeInterfaceCast;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible output DTO for {@see Domain}.
 *
 * `verification_last_error` + `metadata` are hidden by omission
 * (matches the blueprint's `x-wire.hidden` list).
 *
 * @category Domains
 *
 * @since    0.1.0
 */
#[MapOutputName(SnakeCaseMapper::class)]
final class DomainData extends Data
{
    /**
     * @param  string                    $id                    `dom_<ulid>`.
     * @param  string                    $applicationId         Owning Application.
     * @param  string                    $tenantId              Owning tenant.
     * @param  string                    $host                  DNS hostname.
     * @param  DomainKind                $kind                  Subdomain / custom / alias.
     * @param  bool                      $isPrimary             Whether primary of the tenant.
     * @param  bool                      $isVerified            Computed — `verified_at IS NOT NULL`.
     * @param  string                    $verificationToken     Verification token embedded in the expected TXT.
     * @param  DomainVerificationMethod  $verificationMethod    dns_txt / dns_cname / http_meta.
     * @param  int                       $verificationAttempts  Failed attempt counter.
     * @param  SslStatus                 $sslStatus             Certificate state.
     * @param  \DateTimeInterface        $createdAt             Row creation.
     * @param  \DateTimeInterface        $updatedAt             Last mutation.
     * @param  \DateTimeInterface|null   $verifiedAt            When verification succeeded.
     * @param  \DateTimeInterface|null   $sslIssuedAt           When the current cert was issued.
     * @param  \DateTimeInterface|null   $sslExpiresAt          When the current cert expires.
     * @param  string|null               $publicUrl             Computed public URL (null unless verified).
     * @param  \DateTimeInterface|null   $deletedAt             Soft-delete marker.
     */
    public function __construct(
        public string $id,
        public string $applicationId,
        public string $tenantId,
        public string $host,
        public DomainKind $kind,
        public bool $isPrimary,
        public bool $isVerified,
        public string $verificationToken,
        public DomainVerificationMethod $verificationMethod,
        public int $verificationAttempts,
        public SslStatus $sslStatus,
        #[WithCast(DateTimeInterfaceCast::class)]
        public \DateTimeInterface $createdAt,
        #[WithCast(DateTimeInterfaceCast::class)]
        public \DateTimeInterface $updatedAt,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $verifiedAt = null,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $sslIssuedAt = null,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $sslExpiresAt = null,
        public ?string $publicUrl = null,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $deletedAt = null,
    ) {
    }

    /**
     * Build from a Model.
     */
    public static function fromModel(Domain $domain): self
    {
        $kindValue = $domain->{DomainInterface::ATTR_KIND};
        $kind = $kindValue instanceof DomainKind
            ? $kindValue
            : (DomainKind::tryFrom((string) $kindValue) ?? DomainKind::Custom);

        $methodValue = $domain->{DomainInterface::ATTR_VERIFICATION_METHOD};
        $method = $methodValue instanceof DomainVerificationMethod
            ? $methodValue
            : (DomainVerificationMethod::tryFrom((string) $methodValue) ?? DomainVerificationMethod::DnsTxt);

        $sslValue = $domain->{DomainInterface::ATTR_SSL_STATUS};
        $ssl = $sslValue instanceof SslStatus
            ? $sslValue
            : (SslStatus::tryFrom((string) $sslValue) ?? SslStatus::Pending);

        $verifiedAt = $domain->{DomainInterface::ATTR_VERIFIED_AT};

        return new self(
            id: (string) $domain->getKey(),
            applicationId: (string) $domain->{DomainInterface::ATTR_APPLICATION_ID},
            tenantId: (string) $domain->{DomainInterface::ATTR_TENANT_ID},
            host: (string) $domain->{DomainInterface::ATTR_HOST},
            kind: $kind,
            isPrimary: (bool) $domain->{DomainInterface::ATTR_IS_PRIMARY},
            isVerified: $verifiedAt !== null,
            verificationToken: (string) $domain->{DomainInterface::ATTR_VERIFICATION_TOKEN},
            verificationMethod: $method,
            verificationAttempts: (int) $domain->{DomainInterface::ATTR_VERIFICATION_ATTEMPTS},
            sslStatus: $ssl,
            createdAt: $domain->{DomainInterface::ATTR_CREATED_AT},
            updatedAt: $domain->{DomainInterface::ATTR_UPDATED_AT},
            verifiedAt: $verifiedAt,
            sslIssuedAt: $domain->{DomainInterface::ATTR_SSL_ISSUED_AT},
            sslExpiresAt: $domain->{DomainInterface::ATTR_SSL_EXPIRES_AT},
            publicUrl: $verifiedAt !== null ? 'https://' . $domain->{DomainInterface::ATTR_HOST} : null,
            deletedAt: $domain->{DomainInterface::ATTR_DELETED_AT},
        );
    }
}
