<?php

declare(strict_types=1);

namespace Academorix\Tenancy\Contracts\Services;

use Academorix\Tenancy\Models\Tenant;
use Academorix\Tenancy\Services\TenantContextResolver;
use Illuminate\Container\Attributes\Bind;

/**
 * The resolved-tenant context bound into the container by the
 * `resolve.tenant` middleware.
 *
 * Consumers depend on this interface via constructor injection —
 * NOT on the concrete resolver — so the container can swap in a
 * fake for unit tests.
 *
 * `#[Bind]` follows the Laravel-canonical placement (`.kiro/steering/
 * php-attributes.md` §Container attributes): the attribute lives on
 * the ABSTRACT (this interface); the argument IS the CONCRETE
 * ({@see TenantContextResolver}). Consumers type-hint the interface;
 * the container resolves to the concrete.
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
#[Bind(TenantContextResolver::class)]
interface TenantContextInterface
{
    /**
     * The active Tenant, or `null` when the request runs on a
     * central / platform-admin host (no tenant context).
     */
    public function current(): ?Tenant;

    /**
     * The active Tenant id, or `null` when no context is bound.
     * Preferred over `current()->id` for hot-path auto-fill hooks —
     * avoids materialising the model.
     */
    public function currentId(): ?string;

    /**
     * Assert a tenant context is bound. Throws when none — used by
     * actions that must not run on central / platform-admin hosts.
     *
     * @throws \Academorix\Tenancy\Exceptions\TenantNotResolvedException
     */
    public function currentOrFail(): Tenant;

    /**
     * Bind a Tenant into the context. Called by the `resolve.tenant`
     * middleware; also by test helpers that need to fixture a
     * request-like context.
     */
    public function setCurrent(?Tenant $tenant): void;
}
