<?php

declare(strict_types=1);

namespace Stackra\FeatureFlags\Observers;

use Stackra\FeatureFlags\Contracts\Data\FeatureRolloutInterface;
use Stackra\FeatureFlags\Events\FeatureFlagRolloutUpdated;
use Stackra\FeatureFlags\Models\FeatureRollout;
use Illuminate\Cache\Repository as CacheRepository;
use Illuminate\Contracts\Events\Dispatcher as EventDispatcher;

/**
 * Cache-invalidation + event-dispatch observer for {@see FeatureRollout}.
 *
 * Same pattern as `FeatureOverrideObserver`. Dispatches
 * `FeatureFlagRolloutUpdated` with old + new percentage so audit
 * consumers can chart ratchet operations.
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
final class FeatureRolloutObserver
{
    /**
     * @param  CacheRepository   $cache   Cache store used for resolution caching.
     * @param  EventDispatcher   $events  Event bus for domain-event dispatch.
     */
    public function __construct(
        private readonly CacheRepository $cache,
        private readonly EventDispatcher $events,
    ) {}

    /**
     * Handle the `saved` event — fires on create + update.
     *
     * @param  FeatureRollout  $rollout  Persisted rollout row.
     * @return void
     */
    public function saved(FeatureRollout $rollout): void
    {
        $tenantId = (string) $rollout->getAttribute(FeatureRolloutInterface::ATTR_TENANT_ID);
        $this->invalidate($tenantId);

        $newPct = (int) $rollout->getAttribute(FeatureRolloutInterface::ATTR_PERCENTAGE);
        $oldPct = $rollout->wasRecentlyCreated
            ? 0
            : (int) ($rollout->getOriginal(FeatureRolloutInterface::ATTR_PERCENTAGE) ?? $newPct);

        $this->events->dispatch(new FeatureFlagRolloutUpdated(
            flag: (string) $rollout->getAttribute(FeatureRolloutInterface::ATTR_FLAG),
            tenantId: $tenantId,
            rolloutId: (string) $rollout->getKey(),
            scopeLevel: (string) $rollout->getAttribute(FeatureRolloutInterface::ATTR_SCOPE_LEVEL),
            oldPercentage: $oldPct,
            newPercentage: $newPct,
            actorId: $this->stringOrNull($rollout->getAttribute(FeatureRolloutInterface::ATTR_UPDATED_BY)),
        ));
    }

    /**
     * Handle the `deleted` event — fires on soft + hard delete.
     *
     * @param  FeatureRollout  $rollout  Row being retired.
     * @return void
     */
    public function deleted(FeatureRollout $rollout): void
    {
        $tenantId = (string) $rollout->getAttribute(FeatureRolloutInterface::ATTR_TENANT_ID);
        $this->invalidate($tenantId);
    }

    /**
     * Flush the tenant-scoped cache tag, or bump the version key.
     *
     * @param  string  $tenantId  Owning tenant id.
     * @return void
     */
    private function invalidate(string $tenantId): void
    {
        $store = $this->cache->getStore();
        if (\method_exists($store, 'tags')) {
            $this->cache->tags(['feature_flags', "feature_flags:{$tenantId}"])->flush();

            return;
        }

        $this->cache->forever("feature_flags:version:{$tenantId}", (int) (microtime(true) * 1000));
    }

    /**
     * Coerce a mixed attribute into a nullable string.
     *
     * @param  mixed  $value  Attribute value from the model.
     * @return string|null
     */
    private function stringOrNull(mixed $value): ?string
    {
        return $value === null ? null : (string) $value;
    }
}
