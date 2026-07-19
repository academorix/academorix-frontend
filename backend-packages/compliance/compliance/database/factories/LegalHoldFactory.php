<?php

declare(strict_types=1);

namespace Academorix\Compliance\Database\Factories;

use Academorix\Compliance\Contracts\Data\LegalHoldInterface;
use Academorix\Compliance\Enums\LegalHoldScope;
use Academorix\Compliance\Models\LegalHold;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * Factory for {@see LegalHold}.
 *
 * @extends Factory<LegalHold>
 *
 * @category Compliance
 *
 * @since    0.1.0
 */
final class LegalHoldFactory extends Factory
{
    /**
     * @var class-string<LegalHold>
     */
    protected $model = LegalHold::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            LegalHoldInterface::ATTR_ID                  => 'lhd_' . Str::ulid()->toBase32(),
            LegalHoldInterface::ATTR_TENANT_ID           => 'ten_' . Str::ulid()->toBase32(),
            LegalHoldInterface::ATTR_SCOPE               => LegalHoldScope::Subject->value,
            LegalHoldInterface::ATTR_SUBJECT_TYPE        => 'App\\Models\\User',
            LegalHoldInterface::ATTR_SUBJECT_ID          => 'usr_' . Str::ulid()->toBase32(),
            LegalHoldInterface::ATTR_APPLIED_BY_USER_ID  => 'usr_' . Str::ulid()->toBase32(),
            LegalHoldInterface::ATTR_APPROVED_BY_USER_ID => 'usr_' . Str::ulid()->toBase32(),
            LegalHoldInterface::ATTR_REASON              => 'Pending litigation.',
            LegalHoldInterface::ATTR_APPLIED_AT          => \now(),
            LegalHoldInterface::ATTR_EXPIRES_AT          => \now()->addYear(),
        ];
    }

    /**
     * Tenant-scope variant.
     */
    public function tenantScope(): static
    {
        return $this->state(fn (): array => [
            LegalHoldInterface::ATTR_SCOPE        => LegalHoldScope::Tenant->value,
            LegalHoldInterface::ATTR_SUBJECT_TYPE => null,
            LegalHoldInterface::ATTR_SUBJECT_ID   => null,
        ]);
    }
}
