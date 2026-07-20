<?php

declare(strict_types=1);

namespace Academorix\Subscription\Contracts\Services;

use Academorix\Subscription\Models\Subscription;
use Academorix\Subscription\Services\DefaultGracePeriodResolver;
use DateTimeInterface;
use Illuminate\Container\Attributes\Bind;

/**
 * Compute `grace_ends_at` for a subscription based on the current
 * dunning stage + the platform-wide dunning window.
 *
 * Encapsulates the tenant-tier-aware grace math so callers do not
 * duplicate the calculation. A resolver is a `#[Scoped]` service —
 * one instance per request — because it reads config that may
 * change at deploy time.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[Bind(DefaultGracePeriodResolver::class)]
interface GracePeriodResolverInterface
{
    /**
     * Return the `grace_ends_at` datetime for one subscription given
     * its current state. `null` means "the state has no grace
     * window" (e.g. trialing / active / terminal).
     *
     * @param  Subscription  $subscription  Subscription to inspect.
     */
    public function resolve(Subscription $subscription): ?DateTimeInterface;
}
