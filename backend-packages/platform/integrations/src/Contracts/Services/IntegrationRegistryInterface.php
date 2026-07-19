<?php

declare(strict_types=1);

namespace Academorix\Integrations\Contracts\Services;

use Academorix\Integrations\Models\TenantIntegration;
use Academorix\Integrations\Services\NullIntegrationRegistry;
use Illuminate\Container\Attributes\Bind;

/**
 * Registry of pluggable per-provider drivers.
 *
 * Each `(kind, provider)` pair maps to a driver that knows how to
 * perform a `sync()` against the third-party API — pull SCIM
 * directory changes, refresh HRIS employee rosters, replay LMS grade
 * events, etc.
 *
 * The default {@see NullIntegrationRegistry} is a no-op so the
 * module boots without any drivers registered. Consumer apps
 * override by binding their concrete registry through this
 * interface's `#[Bind]` attribute.
 *
 * `#[Bind]` follows the Laravel-canonical placement (`.kiro/steering/
 * php-attributes.md` §Container attributes): the attribute lives on
 * the ABSTRACT (this interface); the argument IS the CONCRETE
 * ({@see NullIntegrationRegistry}). Consumers type-hint the interface;
 * the container resolves to the concrete.
 *
 * @category Integrations
 *
 * @since    0.1.0
 */
#[Bind(NullIntegrationRegistry::class)]
interface IntegrationRegistryInterface
{
    /**
     * Run a sync pass against the third-party API backing this
     * integration. Implementations MUST honour the row's `is_active`
     * flag + `sync_cursor` for incremental sync.
     *
     * @throws \Academorix\Integrations\Exceptions\IntegrationSyncFailedException
     *   When the underlying provider raises unrecoverable errors.
     */
    public function sync(TenantIntegration $integration): void;
}
