<?php

declare(strict_types=1);

namespace Stackra\Tenancy\Data;

use Stackra\Tenancy\Contracts\Data\TenantInterface;
use Stackra\Tenancy\Enums\TenantStatus;
use Stackra\Tenancy\Models\Tenant;
use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Slim tenant entry rendered by `GET /api/v1/me/tenants` and the
 * central `POST /api/v1/auth/find-tenants` list.
 *
 * Only the fields a tenant picker needs — name, slug, tenant-URL,
 * status. Full tenant details resolve via a follow-up call under the
 * tenant's own host.
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
#[MapOutputName(SnakeCaseMapper::class)]
final class MyTenantEntryData extends Data
{
    /**
     * @param  string        $id         `ten_<ulid>`.
     * @param  string        $slug       URL-safe identifier.
     * @param  string        $name       Display name.
     * @param  string        $tenantUrl  Deep-link to the tenant host.
     *                                   Wire key `tenant_url`. Renamed
     *                                   from the previous URL-field name
     *                                   per ADR-0017 — the terminology
     *                                   moved to `tenant`. Frontends
     *                                   that still read the older wire
     *                                   key update in their next release
     *                                   cycle.
     * @param  TenantStatus  $status     Lifecycle state (drives UI badge).
     * @param  string|null   $logoUrl    Logo URL from `tenants.branding`.
     */
    public function __construct(
        public string $id,
        public string $slug,
        public string $name,
        public string $tenantUrl,
        public TenantStatus $status,
        public ?string $logoUrl = null,
    ) {
    }

    /**
     * Build from a Model. `tenantUrl` is composed from the parent
     * Application's `central_host`.
     */
    public static function fromModel(Tenant $tenant): self
    {
        $application = $tenant->application;
        $centralHost = (string) ($application?->central_host ?? '');
        $slug        = (string) $tenant->{TenantInterface::ATTR_SLUG};

        $tenantUrl = $centralHost !== ''
            ? 'https://' . $slug . '.' . $centralHost
            : 'https://' . $slug;

        $branding = $tenant->{TenantInterface::ATTR_BRANDING};
        $logoUrl  = \is_array($branding) && isset($branding['logo_url'])
            ? (string) $branding['logo_url']
            : null;

        return new self(
            id: (string) $tenant->getKey(),
            slug: $slug,
            name: (string) $tenant->{TenantInterface::ATTR_NAME},
            tenantUrl: $tenantUrl,
            status: $tenant->{TenantInterface::ATTR_STATUS} ?? TenantStatus::Trialing,
            logoUrl: $logoUrl,
        );
    }
}
