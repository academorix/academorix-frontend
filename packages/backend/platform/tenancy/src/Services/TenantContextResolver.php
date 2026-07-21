<?php

declare(strict_types=1);

namespace Stackra\Tenancy\Services;

use Stackra\Tenancy\Contracts\Services\TenantContextInterface;
use Stackra\Tenancy\Exceptions\TenantNotResolvedException;
use Stackra\Tenancy\Models\Tenant;
use Illuminate\Container\Attributes\Scoped;

/**
 * Request-scoped implementation of {@see TenantContextInterface}.
 *
 * `#[Scoped]` — one instance per resolution scope. Under Octane the
 * container flushes scoped bindings between requests so the tenant
 * context never leaks across requests.
 *
 * The container binding lives on the interface
 * ({@see TenantContextInterface}) per Laravel-canonical placement
 * — this concrete only carries lifetime metadata (`#[Scoped]`).
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
#[Scoped]
final class TenantContextResolver implements TenantContextInterface
{
    private ?Tenant $tenant = null;

    /**
     * {@inheritDoc}
     */
    public function current(): ?Tenant
    {
        return $this->tenant;
    }

    /**
     * {@inheritDoc}
     */
    public function currentId(): ?string
    {
        return $this->tenant?->getKey();
    }

    /**
     * {@inheritDoc}
     */
    public function currentOrFail(): Tenant
    {
        if ($this->tenant === null) {
            throw new TenantNotResolvedException(
                'No tenant context bound to the current request.',
            );
        }

        return $this->tenant;
    }

    /**
     * {@inheritDoc}
     */
    public function setCurrent(?Tenant $tenant): void
    {
        $this->tenant = $tenant;
    }
}
