<?php

declare(strict_types=1);

namespace Stackra\Compliance\Database\Factories;

use Stackra\Compliance\Contracts\Data\SafeguardingIncidentInterface;
use Stackra\Compliance\Enums\SafeguardingIncidentState;
use Stackra\Compliance\Enums\SafeguardingSeverity;
use Stackra\Compliance\Models\SafeguardingIncident;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * Factory for {@see SafeguardingIncident}.
 *
 * @extends Factory<SafeguardingIncident>
 *
 * @category Compliance
 *
 * @since    0.1.0
 */
final class SafeguardingIncidentFactory extends Factory
{
    /**
     * @var class-string<SafeguardingIncident>
     */
    protected $model = SafeguardingIncident::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            SafeguardingIncidentInterface::ATTR_ID           => 'sfi_' . Str::ulid()->toBase32(),
            SafeguardingIncidentInterface::ATTR_TENANT_ID    => 'ten_' . Str::ulid()->toBase32(),
            SafeguardingIncidentInterface::ATTR_SUBJECT_TYPE => 'App\\Models\\Athlete',
            SafeguardingIncidentInterface::ATTR_SUBJECT_ID   => 'ath_' . Str::ulid()->toBase32(),
            SafeguardingIncidentInterface::ATTR_SEVERITY     => SafeguardingSeverity::Concern->value,
            SafeguardingIncidentInterface::ATTR_STATE        => SafeguardingIncidentState::Reported->value,
            SafeguardingIncidentInterface::ATTR_TITLE        => 'Safeguarding concern raised',
            SafeguardingIncidentInterface::ATTR_DESCRIPTION  => 'Details of the concern.',
            SafeguardingIncidentInterface::ATTR_REPORTED_AT  => \now(),
            SafeguardingIncidentInterface::ATTR_PENDING_EXTERNAL_REFERRAL => false,
        ];
    }

    /**
     * Critical severity state.
     */
    public function critical(): static
    {
        return $this->state(fn (): array => [
            SafeguardingIncidentInterface::ATTR_SEVERITY                => SafeguardingSeverity::Critical->value,
            SafeguardingIncidentInterface::ATTR_ESCALATION_DEADLINE_AT  => \now()->addHour(),
        ]);
    }
}
