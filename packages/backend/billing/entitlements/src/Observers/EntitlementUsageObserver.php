<?php

declare(strict_types=1);

namespace Academorix\Entitlements\Observers;

use Academorix\Entitlements\Contracts\Data\EntitlementUsageInterface;
use Academorix\Entitlements\Contracts\Repositories\EntitlementRepositoryInterface;
use Academorix\Entitlements\Events\EntitlementConsumed;
use Academorix\Entitlements\Models\EntitlementUsage;

/**
 * Lifecycle side effects on {@see EntitlementUsage}.
 *
 * ## Responsibilities
 *
 *   - `created` — fire {@see EntitlementConsumed}. The parent
 *     `Entitlement` is fetched via the repository so listeners have
 *     full context without re-querying.
 *
 * @category Entitlements
 *
 * @since    0.1.0
 */
final class EntitlementUsageObserver
{
    /**
     * `created` — dispatch the `EntitlementConsumed` event.
     */
    public function created(EntitlementUsage $usage): void
    {
        /** @var EntitlementRepositoryInterface $entitlements */
        $entitlements = \app(EntitlementRepositoryInterface::class);
        $parent       = $entitlements->find(
            (string) $usage->{EntitlementUsageInterface::ATTR_ENTITLEMENT_ID},
        );

        if ($parent === null) {
            // Parent was deleted before the child could fire — skip.
            return;
        }

        EntitlementConsumed::dispatch(
            $parent,
            $usage,
            (int) $usage->{EntitlementUsageInterface::ATTR_DELTA},
            $usage->{EntitlementUsageInterface::ATTR_CORRELATION_ID},
        );
    }
}
