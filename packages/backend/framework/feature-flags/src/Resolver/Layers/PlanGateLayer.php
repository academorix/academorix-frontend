<?php

declare(strict_types=1);

namespace Academorix\FeatureFlags\Resolver\Layers;

use Academorix\FeatureFlags\Enums\FlagKind;
use Academorix\FeatureFlags\Exceptions\PlanGateFailedException;
use Academorix\FeatureFlags\Resolver\FeatureResolution;
use Academorix\FeatureFlags\Resolver\ResolutionContext;
use Throwable;

/**
 * Fourth layer — decides via the tenant's active subscription entitlement.
 *
 * Only runs for flags whose `kind = PlanGate` — returns `null`
 * (defer to `DefaultLayer`) for every other kind. Match rule:
 * the flag name equals the backing value of an `EntitlementType`
 * granted by the tenant's active `TenantSubscription`. A
 * lookup error raises `PlanGateFailedException` — the middleware
 * translates that to HTTP 402 (Requirement 3.5).
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
final class PlanGateLayer implements ResolverLayer
{
    /**
     * {@inheritDoc}
     *
     * @throws PlanGateFailedException  When the entitlement lookup itself errors.
     */
    public function apply(ResolutionContext $context): ?FeatureResolution
    {
        if ($context->definition->kind !== FlagKind::PlanGate) {
            return null;
        }

        if ($context->tenant === null) {
            return null;
        }

        try {
            $entitled = $this->entitlementGranted($context);
        } catch (Throwable $error) {
            throw PlanGateFailedException::forTenant(
                $context->flag,
                (string) $context->tenant->getKey(),
            )->withContextValue('previous_message', $error->getMessage());
        }

        return FeatureResolution::planGate($entitled);
    }

    /**
     * Look up whether the tenant's active subscription grants the flag as an entitlement.
     *
     * Kept as a small helper so the layer body stays readable and
     * the resolution logic (subscription active + entitlement match)
     * lives in one place. Delegates through `lucalongo/laravel-entitlements`
     * when the tenant model exposes the standard relation; falls
     * back to `false` otherwise.
     *
     * @param  ResolutionContext  $context  Frozen evaluation inputs.
     * @return bool                         True when the plan grants a matching entitlement.
     */
    private function entitlementGranted(ResolutionContext $context): bool
    {
        $tenant = $context->tenant;
        if ($tenant === null) {
            return false;
        }

        // `hasEntitlement` is the canonical accessor added by the
        // entitlements trait on tenant-owned billable models — see
        // `LucaLongo\LaravelEntitlements\Concerns\HasEntitlements`.
        if (\method_exists($tenant, 'hasEntitlement')) {
            /** @var bool $granted */
            $granted = $tenant->hasEntitlement($context->flag);

            return $granted;
        }

        return false;
    }
}
