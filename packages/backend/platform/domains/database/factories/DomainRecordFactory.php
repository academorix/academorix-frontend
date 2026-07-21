<?php

declare(strict_types=1);

namespace Stackra\Domains\Database\Factories;

use Stackra\Domains\Contracts\Data\DomainRecordInterface;
use Stackra\Domains\Enums\DnsRecordStatus;
use Stackra\Domains\Enums\DnsRecordType;
use Stackra\Domains\Models\DomainRecord;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * Factory for {@see DomainRecord}.
 *
 * @extends Factory<DomainRecord>
 *
 * @category Domains
 *
 * @since    0.1.0
 */
final class DomainRecordFactory extends Factory
{
    /**
     * @var class-string<DomainRecord>
     */
    protected $model = DomainRecord::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            DomainRecordInterface::ATTR_ID             => 'drc_' . Str::ulid()->toBase32(),
            DomainRecordInterface::ATTR_TENANT_ID      => 'ten_' . Str::ulid()->toBase32(),
            DomainRecordInterface::ATTR_DOMAIN_ID      => 'dom_' . Str::ulid()->toBase32(),
            DomainRecordInterface::ATTR_KIND           => DnsRecordType::Cname->value,
            DomainRecordInterface::ATTR_NAME           => 'www.example.com',
            DomainRecordInterface::ATTR_EXPECTED_VALUE => 'edge.stackra.app',
            DomainRecordInterface::ATTR_STATUS         => DnsRecordStatus::Unknown->value,
        ];
    }

    public function matching(): static
    {
        return $this->state(fn (): array => [
            DomainRecordInterface::ATTR_STATUS          => DnsRecordStatus::Matches->value,
            DomainRecordInterface::ATTR_LAST_MATCHED_AT => \Carbon\CarbonImmutable::now(),
        ]);
    }

    public function txt(): static
    {
        return $this->state(fn (): array => [
            DomainRecordInterface::ATTR_KIND => DnsRecordType::Txt->value,
        ]);
    }
}
