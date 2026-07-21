<?php

declare(strict_types=1);

namespace Stackra\Compliance\Database\Factories;

use Stackra\Compliance\Contracts\Data\DsarInterface;
use Stackra\Compliance\Enums\DsarAction;
use Stackra\Compliance\Enums\DsarState;
use Stackra\Compliance\Models\Dsar;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * Factory for {@see Dsar}.
 *
 * @extends Factory<Dsar>
 *
 * @category Compliance
 *
 * @since    0.1.0
 */
final class DsarFactory extends Factory
{
    /**
     * @var class-string<Dsar>
     */
    protected $model = Dsar::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            DsarInterface::ATTR_ID           => 'dsr_' . Str::ulid()->toBase32(),
            DsarInterface::ATTR_TENANT_ID    => 'ten_' . Str::ulid()->toBase32(),
            DsarInterface::ATTR_SUBJECT_TYPE => 'App\\Models\\User',
            DsarInterface::ATTR_SUBJECT_ID   => 'usr_' . Str::ulid()->toBase32(),
            DsarInterface::ATTR_ACTION       => DsarAction::Export->value,
            DsarInterface::ATTR_STATE        => DsarState::Received->value,
            DsarInterface::ATTR_REQUESTED_AT => \now(),
            DsarInterface::ATTR_SLA_DAYS     => 30,
            DsarInterface::ATTR_ARTEFACT_COUNT => 0,
        ];
    }

    /**
     * Delivered state — bundle available.
     */
    public function delivered(): static
    {
        return $this->state(fn (): array => [
            DsarInterface::ATTR_STATE            => DsarState::Delivered->value,
            DsarInterface::ATTR_DELIVERED_AT     => \now(),
            DsarInterface::ATTR_DOWNLOAD_SIGNATURE => Str::random(64),
            DsarInterface::ATTR_DOWNLOAD_EXPIRES_AT => \now()->addDays(30),
        ]);
    }

    /**
     * Rejected state.
     */
    public function rejected(): static
    {
        return $this->state(fn (): array => [
            DsarInterface::ATTR_STATE            => DsarState::Rejected->value,
            DsarInterface::ATTR_REJECTED_AT      => \now(),
            DsarInterface::ATTR_REJECTION_REASON => 'Identity could not be verified.',
        ]);
    }
}
