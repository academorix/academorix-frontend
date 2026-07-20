<?php

declare(strict_types=1);

namespace Academorix\Integrations\Services;

use Academorix\Integrations\Contracts\Services\IntegrationRegistryInterface;
use Academorix\Integrations\Models\TenantIntegration;
use Illuminate\Container\Attributes\Singleton;

/**
 * Default no-op implementation of
 * {@see IntegrationRegistryInterface}.
 *
 * Every `sync()` call is a no-op — the module boots without any
 * per-provider drivers registered. Consumer apps override by binding
 * a concrete registry that composes their driver catalogue through
 * the interface's `#[Bind]` attribute.
 *
 * `#[Singleton]` — the registry is stateless; the container reuses
 * the same instance for every sync call in the worker process.
 *
 * @category Integrations
 *
 * @since    0.1.0
 */
#[Singleton]
final class NullIntegrationRegistry implements IntegrationRegistryInterface
{
    /**
     * {@inheritDoc}
     *
     * No-op — no driver is bound.
     */
    public function sync(TenantIntegration $integration): void
    {
        // Intentional no-op — no drivers registered in the default binding.
    }
}
