<?php

declare(strict_types=1);

namespace Stackra\Integrations\Data;

use Stackra\Integrations\Contracts\Data\TenantIntegrationInterface;
use Stackra\Integrations\Enums\IntegrationKind;
use Stackra\Integrations\Enums\IntegrationSyncStatus;
use Stackra\Integrations\Models\TenantIntegration;
use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Attributes\WithCast;
use Spatie\LaravelData\Casts\DateTimeInterfaceCast;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible output DTO for {@see TenantIntegration}.
 *
 * The `config`, `sync_cursor`, `metadata`, and userstamp columns are
 * hidden by OMISSION here — secrets stay server-side. This mirrors
 * the blueprint's `x-wire.hidden` list.
 *
 * @category Integrations
 *
 * @since    0.1.0
 */
#[MapOutputName(SnakeCaseMapper::class)]
final class TenantIntegrationData extends Data
{
    /**
     * @param  string                    $id             `wit_<ulid>`.
     * @param  string                    $tenantId       Owning tenant.
     * @param  IntegrationKind           $kind           Category of integration.
     * @param  string                    $provider       Provider key (allow-listed by kind).
     * @param  string                    $name           Human label.
     * @param  bool                      $isActive       Active flag.
     * @param  IntegrationSyncStatus     $lastSyncStatus Most recent sync outcome.
     * @param  \DateTimeInterface        $createdAt      Row creation.
     * @param  \DateTimeInterface        $updatedAt      Last mutation.
     * @param  \DateTimeInterface|null   $lastSyncAt     Timestamp of the most recent sync.
     * @param  string|null               $lastSyncError  Error string from the most recent failed sync.
     * @param  \DateTimeInterface|null   $nextSyncAt     Timestamp of the next scheduled sync.
     * @param  \DateTimeInterface|null   $deletedAt      Soft-delete marker.
     */
    public function __construct(
        public string $id,
        public string $tenantId,
        public IntegrationKind $kind,
        public string $provider,
        public string $name,
        public bool $isActive,
        public IntegrationSyncStatus $lastSyncStatus,
        #[WithCast(DateTimeInterfaceCast::class)]
        public \DateTimeInterface $createdAt,
        #[WithCast(DateTimeInterfaceCast::class)]
        public \DateTimeInterface $updatedAt,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $lastSyncAt = null,
        public ?string $lastSyncError = null,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $nextSyncAt = null,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $deletedAt = null,
    ) {
    }

    /**
     * Build from a Model.
     */
    public static function fromModel(TenantIntegration $integration): self
    {
        $kindRaw = $integration->{TenantIntegrationInterface::ATTR_KIND};
        $kind = $kindRaw instanceof IntegrationKind
            ? $kindRaw
            : (IntegrationKind::tryFrom((string) $kindRaw) ?? IntegrationKind::Webhook);

        $statusRaw = $integration->{TenantIntegrationInterface::ATTR_LAST_SYNC_STATUS};
        $status = $statusRaw instanceof IntegrationSyncStatus
            ? $statusRaw
            : (IntegrationSyncStatus::tryFrom((string) $statusRaw) ?? IntegrationSyncStatus::Unknown);

        return new self(
            id: (string) $integration->getKey(),
            tenantId: (string) $integration->{TenantIntegrationInterface::ATTR_TENANT_ID},
            kind: $kind,
            provider: (string) $integration->{TenantIntegrationInterface::ATTR_PROVIDER},
            name: (string) $integration->{TenantIntegrationInterface::ATTR_NAME},
            isActive: (bool) $integration->{TenantIntegrationInterface::ATTR_IS_ACTIVE},
            lastSyncStatus: $status,
            createdAt: $integration->{TenantIntegrationInterface::ATTR_CREATED_AT},
            updatedAt: $integration->{TenantIntegrationInterface::ATTR_UPDATED_AT},
            lastSyncAt: $integration->{TenantIntegrationInterface::ATTR_LAST_SYNC_AT},
            lastSyncError: $integration->{TenantIntegrationInterface::ATTR_LAST_SYNC_ERROR},
            nextSyncAt: $integration->{TenantIntegrationInterface::ATTR_NEXT_SYNC_AT},
            deletedAt: $integration->{TenantIntegrationInterface::ATTR_DELETED_AT},
        );
    }
}
