<?php

declare(strict_types=1);

namespace Stackra\Integrations\Database\Factories;

use Stackra\Integrations\Contracts\Data\TenantIntegrationInterface;
use Stackra\Integrations\Enums\IntegrationKind;
use Stackra\Integrations\Enums\IntegrationSyncStatus;
use Stackra\Integrations\Models\TenantIntegration;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * Factory for {@see TenantIntegration}.
 *
 * @extends Factory<TenantIntegration>
 *
 * @category Integrations
 *
 * @since    0.1.0
 */
final class TenantIntegrationFactory extends Factory
{
    /**
     * @var class-string<TenantIntegration>
     */
    protected $model = TenantIntegration::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            TenantIntegrationInterface::ATTR_ID               => 'wit_' . Str::ulid()->toBase32(),
            TenantIntegrationInterface::ATTR_TENANT_ID        => 'ten_' . Str::ulid()->toBase32(),
            TenantIntegrationInterface::ATTR_KIND             => IntegrationKind::Webhook->value,
            TenantIntegrationInterface::ATTR_PROVIDER         => 'custom',
            TenantIntegrationInterface::ATTR_NAME             => 'Fixture Integration',
            TenantIntegrationInterface::ATTR_CONFIG           => ['dummy' => true],
            TenantIntegrationInterface::ATTR_IS_ACTIVE        => false,
            TenantIntegrationInterface::ATTR_LAST_SYNC_STATUS => IntegrationSyncStatus::Unknown->value,
        ];
    }

    /**
     * State: `is_active = true`.
     */
    public function active(): static
    {
        return $this->state(fn (): array => [
            TenantIntegrationInterface::ATTR_IS_ACTIVE => true,
        ]);
    }

    /**
     * State: swap the row's `kind` to the supplied enum case.
     */
    public function withKind(IntegrationKind $kind): static
    {
        return $this->state(fn (): array => [
            TenantIntegrationInterface::ATTR_KIND => $kind->value,
        ]);
    }

    /**
     * State: mark the last sync as failed with a placeholder error.
     */
    public function syncFailed(): static
    {
        return $this->state(fn (): array => [
            TenantIntegrationInterface::ATTR_LAST_SYNC_STATUS => IntegrationSyncStatus::Failed->value,
            TenantIntegrationInterface::ATTR_LAST_SYNC_AT     => \now(),
            TenantIntegrationInterface::ATTR_LAST_SYNC_ERROR  => 'Provider returned HTTP 500 on the last sync attempt.',
        ]);
    }
}
