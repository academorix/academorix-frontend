<?php

declare(strict_types=1);

namespace Stackra\Domains\Data;

use Stackra\Domains\Contracts\Data\DomainRecordInterface;
use Stackra\Domains\Enums\DnsRecordStatus;
use Stackra\Domains\Enums\DnsRecordType;
use Stackra\Domains\Models\DomainRecord;
use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Attributes\WithCast;
use Spatie\LaravelData\Casts\DateTimeInterfaceCast;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible output DTO for {@see DomainRecord}.
 *
 * @category Domains
 *
 * @since    0.1.0
 */
#[MapOutputName(SnakeCaseMapper::class)]
final class DomainRecordData extends Data
{
    /**
     * @param  string           $id             `drc_<ulid>`.
     * @param  string           $tenantId       Owning tenant.
     * @param  string           $domainId       Parent domain.
     * @param  DnsRecordType    $kind           DNS record type.
     * @param  string           $name           Fully-qualified name.
     * @param  string           $expectedValue  What we expect DNS to return.
     * @param  DnsRecordStatus  $status         Last check outcome.
     * @param  \DateTimeInterface $createdAt    Row creation.
     * @param  \DateTimeInterface $updatedAt    Last mutation.
     * @param  string|null      $lastSeenValue  Actual value observed on the last check.
     * @param  int|null         $ttlSeconds     TTL observed.
     * @param  int|null         $priority       For MX records.
     * @param  \DateTimeInterface|null $lastCheckAt  Timestamp of last check.
     * @param  \DateTimeInterface|null $lastMatchedAt Timestamp of last successful match.
     */
    public function __construct(
        public string $id,
        public string $tenantId,
        public string $domainId,
        public DnsRecordType $kind,
        public string $name,
        public string $expectedValue,
        public DnsRecordStatus $status,
        #[WithCast(DateTimeInterfaceCast::class)]
        public \DateTimeInterface $createdAt,
        #[WithCast(DateTimeInterfaceCast::class)]
        public \DateTimeInterface $updatedAt,
        public ?string $lastSeenValue = null,
        public ?int $ttlSeconds = null,
        public ?int $priority = null,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $lastCheckAt = null,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $lastMatchedAt = null,
    ) {
    }

    /**
     * Build from a Model.
     */
    public static function fromModel(DomainRecord $record): self
    {
        $kindValue = $record->{DomainRecordInterface::ATTR_KIND};
        $kind = $kindValue instanceof DnsRecordType
            ? $kindValue
            : (DnsRecordType::tryFrom((string) $kindValue) ?? DnsRecordType::Txt);

        $statusValue = $record->{DomainRecordInterface::ATTR_STATUS};
        $status = $statusValue instanceof DnsRecordStatus
            ? $statusValue
            : (DnsRecordStatus::tryFrom((string) $statusValue) ?? DnsRecordStatus::Unknown);

        return new self(
            id: (string) $record->getKey(),
            tenantId: (string) $record->{DomainRecordInterface::ATTR_TENANT_ID},
            domainId: (string) $record->{DomainRecordInterface::ATTR_DOMAIN_ID},
            kind: $kind,
            name: (string) $record->{DomainRecordInterface::ATTR_NAME},
            expectedValue: (string) $record->{DomainRecordInterface::ATTR_EXPECTED_VALUE},
            status: $status,
            createdAt: $record->{DomainRecordInterface::ATTR_CREATED_AT},
            updatedAt: $record->{DomainRecordInterface::ATTR_UPDATED_AT},
            lastSeenValue: $record->{DomainRecordInterface::ATTR_LAST_SEEN_VALUE},
            ttlSeconds: $record->{DomainRecordInterface::ATTR_TTL_SECONDS},
            priority: $record->{DomainRecordInterface::ATTR_PRIORITY},
            lastCheckAt: $record->{DomainRecordInterface::ATTR_LAST_CHECK_AT},
            lastMatchedAt: $record->{DomainRecordInterface::ATTR_LAST_MATCHED_AT},
        );
    }
}
