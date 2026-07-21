<?php

declare(strict_types=1);

namespace Stackra\Domains\Models;

use Stackra\Database\Concerns\HasMetadata;
use Stackra\Database\Concerns\HasPrefixedUlid;
use Stackra\Domains\Contracts\Data\DomainRecordInterface;
use Stackra\Domains\Database\Factories\DomainRecordFactory;
use Stackra\Domains\Enums\DnsRecordStatus;
use Stackra\Domains\Enums\DnsRecordType;
use Stackra\Domains\Observers\DomainRecordObserver;
use Stackra\Domains\Policies\DomainRecordPolicy;
use Stackra\Tenancy\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Attributes\WithoutIncrementing;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Mattiverse\Userstamps\Traits\Userstamps;
use OwenIt\Auditing\Auditable;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

/**
 * Eloquent model for a {@see DomainRecordInterface}.
 *
 * Expected DNS record for a Domain. Populated by
 * {@see \Stackra\Domains\Observers\DomainObserver} on Domain
 * create; diffed against real DNS by
 * {@see \Stackra\Domains\Jobs\VerifyDomainDnsJob}.
 *
 * Hard-deleted (no SoftDeletes) — diff-state, not compliance data.
 */
#[Table(
    name: DomainRecordInterface::TABLE,
    key: DomainRecordInterface::PRIMARY_KEY,
    keyType: DomainRecordInterface::KEY_TYPE,
)]
#[Fillable([
    DomainRecordInterface::ATTR_TENANT_ID,
    DomainRecordInterface::ATTR_DOMAIN_ID,
    DomainRecordInterface::ATTR_KIND,
    DomainRecordInterface::ATTR_NAME,
    DomainRecordInterface::ATTR_EXPECTED_VALUE,
    DomainRecordInterface::ATTR_LAST_SEEN_VALUE,
    DomainRecordInterface::ATTR_TTL_SECONDS,
    DomainRecordInterface::ATTR_PRIORITY,
    DomainRecordInterface::ATTR_STATUS,
    DomainRecordInterface::ATTR_LAST_CHECK_AT,
    DomainRecordInterface::ATTR_LAST_MATCHED_AT,
    DomainRecordInterface::ATTR_LAST_ERROR,
    DomainRecordInterface::ATTR_METADATA,
])]
#[UseFactory(DomainRecordFactory::class)]
#[UsePolicy(DomainRecordPolicy::class)]
#[ObservedBy([DomainRecordObserver::class])]
#[WithoutIncrementing]
final class DomainRecord extends Model implements AuditableContract, DomainRecordInterface
{
    use Auditable;
    use BelongsToTenant;
    use HasFactory;
    use HasMetadata;
    use HasPrefixedUlid;
    use Userstamps;

    /**
     * Cast map — enum + JSON + datetime coercion on hydrate.
     *
     * @var array<string, string>
     */
    protected $casts = [
        DomainRecordInterface::ATTR_KIND            => DnsRecordType::class,
        DomainRecordInterface::ATTR_STATUS          => DnsRecordStatus::class,
        DomainRecordInterface::ATTR_TTL_SECONDS     => 'integer',
        DomainRecordInterface::ATTR_METADATA        => 'array',
        DomainRecordInterface::ATTR_LAST_CHECK_AT   => 'datetime',
        DomainRecordInterface::ATTR_LAST_MATCHED_AT => 'datetime',
    ];

    /**
     * Parent domain.
     *
     * @return BelongsTo<Domain, $this>
     */
    public function domain(): BelongsTo
    {
        return $this->belongsTo(Domain::class, DomainRecordInterface::ATTR_DOMAIN_ID);
    }

    /**
     * Whether the last check matched the expected value.
     */
    public function isMatching(): bool
    {
        return $this->{DomainRecordInterface::ATTR_STATUS} === DnsRecordStatus::Matches;
    }
}
