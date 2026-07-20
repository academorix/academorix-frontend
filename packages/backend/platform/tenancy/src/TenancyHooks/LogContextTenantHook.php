<?php

declare(strict_types=1);

namespace Academorix\Tenancy\TenancyHooks;

use Academorix\ServiceProvider\Attributes\AsTenancyHook;
use Academorix\ServiceProvider\Contracts\TenancyHookInterface;
use Academorix\ServiceProvider\Support\TenantHookContext;
use Academorix\Tenancy\Contracts\Data\TenantInterface;
use Academorix\Tenancy\Models\Tenant;
use Illuminate\Log\Context\Repository as LogContext;

/**
 * Push `tenant_id`, `tenant_slug`, `application_id` into the current
 * PSR-3 log context so every log line emitted during the request
 * carries the tenant identity.
 *
 * Octane-safe — `onTenantEnded` restores whatever the log context
 * held before we mutated it.
 *
 * Priority 10 — framework-level, first to init, last to end.
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
#[AsTenancyHook(priority: 10)]
final class LogContextTenantHook implements TenancyHookInterface
{
    /**
     * @var array<string, mixed>|null  Snapshot of the log context values we replaced.
     */
    private ?array $snapshot = null;

    /**
     * {@inheritDoc}
     */
    public function onTenantInitialized(TenantHookContext $ctx): void
    {
        if (! $ctx->tenant instanceof Tenant) {
            return;
        }

        try {
            /** @var LogContext $log */
            $log = $ctx->container->make(LogContext::class);
        } catch (\Throwable) {
            // Fail-soft — log context is optional in some workers.
            return;
        }

        // Snapshot the previous values under the same keys.
        $this->snapshot = [
            'tenant_id'      => $log->get('tenant_id'),
            'tenant_slug'    => $log->get('tenant_slug'),
            'application_id' => $log->get('application_id'),
        ];

        $log->add([
            'tenant_id'      => $ctx->tenant->getKey(),
            'tenant_slug'    => $ctx->tenant->{TenantInterface::ATTR_SLUG},
            'application_id' => $ctx->tenant->{TenantInterface::ATTR_APPLICATION_ID},
        ]);
    }

    /**
     * {@inheritDoc}
     */
    public function onTenantEnded(TenantHookContext $ctx): void
    {
        if ($this->snapshot === null) {
            return;
        }

        try {
            /** @var LogContext $log */
            $log = $ctx->container->make(LogContext::class);
        } catch (\Throwable) {
            $this->snapshot = null;

            return;
        }

        foreach ($this->snapshot as $key => $value) {
            if ($value === null) {
                $log->forget($key);
            } else {
                $log->add([$key => $value]);
            }
        }

        $this->snapshot = null;
    }
}
