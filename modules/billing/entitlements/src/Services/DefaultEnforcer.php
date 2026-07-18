<?php

declare(strict_types=1);

namespace Academorix\Entitlements\Services;

use Academorix\Entitlements\Contracts\Data\EntitlementInterface;
use Academorix\Entitlements\Contracts\Services\EnforcerInterface;
use Academorix\Entitlements\Contracts\Services\EntitlementResolverInterface;
use Academorix\Entitlements\Contracts\Services\UsageRecorderInterface;
use Academorix\Entitlements\Events\EntitlementExceeded;
use Illuminate\Container\Attributes\Config;
use Illuminate\Container\Attributes\Scoped;

/**
 * Default {@see EnforcerInterface}.
 *
 * Composes the resolver + recorder — one entry point for every
 * metered domain endpoint. Fires `EntitlementExceeded` on rejection
 * so observability / notifications can react without the caller
 * knowing about them.
 *
 * @category Entitlements
 *
 * @since    0.1.0
 */
#[Scoped]
final class DefaultEnforcer implements EnforcerInterface
{
    public function __construct(
        private readonly EntitlementResolverInterface $resolver,
        private readonly UsageRecorderInterface $recorder,
        #[Config('entitlements.enforcer.enabled')] private readonly bool $enforcementEnabled,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function consume(
        string $tenantId,
        string $key,
        int $amount = 1,
        string $reason = 'consumption',
        ?string $correlationId = null,
    ): bool {
        // Master switch — disables every check globally.
        if (! $this->enforcementEnabled) {
            return true;
        }

        $entitlement = $this->resolver->resolve($tenantId, $key);
        if ($entitlement === null) {
            // Fail-closed — unknown key = no entitlement = denied.
            return false;
        }

        if (! $entitlement->canConsume($amount)) {
            EntitlementExceeded::dispatch($entitlement, $amount);

            return false;
        }

        // Record the consumption + increment the parent counter.
        $this->recorder->record($entitlement, $amount, $reason, $correlationId);

        // Flush the resolver's cached snapshot — the next reader picks
        // up the new `used` value.
        $this->resolver->flush($tenantId);

        return true;
    }

    /**
     * {@inheritDoc}
     */
    public function canConsume(string $tenantId, string $key, int $amount = 1): bool
    {
        if (! $this->enforcementEnabled) {
            return true;
        }

        $entitlement = $this->resolver->resolve($tenantId, $key);
        if ($entitlement === null) {
            return false;
        }

        return $entitlement->canConsume($amount);
    }
}
