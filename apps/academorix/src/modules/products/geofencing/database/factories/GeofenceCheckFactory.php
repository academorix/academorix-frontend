<?php

declare(strict_types=1);

namespace Stackra\Geofencing\Database\Factories;

use Stackra\Geofencing\Contracts\Data\GeofenceCheckInterface;
use Stackra\Geofencing\Enums\GeofenceMode;
use Stackra\Geofencing\Enums\GeofenceResult;
use Stackra\Geofencing\Models\GeofenceCheck;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * Factory for {@see GeofenceCheck}.
 *
 * Produces an INSIDE check in polygon mode against a `branch` fenceable +
 * `staff_clockin` subject. States (`->outside()`, `->skipped()`, `->error()`,
 * `->override()`) attach the variants tests need.
 *
 * @extends Factory<GeofenceCheck>
 *
 * @category Geofencing
 *
 * @since    0.1.0
 */
final class GeofenceCheckFactory extends Factory
{
    /**
     * @var class-string<GeofenceCheck>
     */
    protected $model = GeofenceCheck::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            GeofenceCheckInterface::ATTR_ID                  => 'gfc_' . Str::ulid()->toBase32(),
            GeofenceCheckInterface::ATTR_TENANT_ID           => 'ten_' . Str::ulid()->toBase32(),
            GeofenceCheckInterface::ATTR_FENCEABLE_TYPE      => 'branch',
            GeofenceCheckInterface::ATTR_FENCEABLE_ID        => 'brn_' . Str::ulid()->toBase32(),
            GeofenceCheckInterface::ATTR_SUBJECT_TYPE        => 'staff_clockin',
            GeofenceCheckInterface::ATTR_SUBJECT_ID          => 'sci_' . Str::ulid()->toBase32(),
            GeofenceCheckInterface::ATTR_RESULT              => GeofenceResult::Inside->value,
            GeofenceCheckInterface::ATTR_MODE                => GeofenceMode::Polygon->value,
            GeofenceCheckInterface::ATTR_CAPTURED_LOCATION   => 'POINT(-74.0060 40.7128)',
            GeofenceCheckInterface::ATTR_ACCURACY_M          => 25,
            GeofenceCheckInterface::ATTR_DISTANCE_TO_FENCE_M => 12.5,
            GeofenceCheckInterface::ATTR_EVALUATED_AT        => now(),
        ];
    }

    /**
     * State: OUTSIDE verdict.
     */
    public function outside(): static
    {
        return $this->state(fn (): array => [
            GeofenceCheckInterface::ATTR_RESULT              => GeofenceResult::Outside->value,
            GeofenceCheckInterface::ATTR_DISTANCE_TO_FENCE_M => 350.0,
        ]);
    }

    /**
     * State: SKIPPED (accuracy too low).
     */
    public function skipped(): static
    {
        return $this->state(fn (): array => [
            GeofenceCheckInterface::ATTR_RESULT     => GeofenceResult::Skipped->value,
            GeofenceCheckInterface::ATTR_ACCURACY_M => 500,
        ]);
    }

    /**
     * State: ERROR verdict (fail-closed).
     */
    public function error(): static
    {
        return $this->state(fn (): array => [
            GeofenceCheckInterface::ATTR_RESULT              => GeofenceResult::Error->value,
            GeofenceCheckInterface::ATTR_DISTANCE_TO_FENCE_M => null,
        ]);
    }

    /**
     * State: override row that supersedes another. Caller passes the
     * original row's id.
     */
    public function override(string $supersedesId, string $overriddenByUserId, string $reason = 'Approved by admin — GPS drift confirmed.'): static
    {
        return $this->state(fn (): array => [
            GeofenceCheckInterface::ATTR_RESULT                => GeofenceResult::Inside->value,
            GeofenceCheckInterface::ATTR_SUPERSEDES_CHECK_ID   => $supersedesId,
            GeofenceCheckInterface::ATTR_OVERRIDDEN_BY_USER_ID => $overriddenByUserId,
            GeofenceCheckInterface::ATTR_OVERRIDE_REASON       => $reason,
        ]);
    }
}
