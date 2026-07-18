<?php

declare(strict_types=1);

namespace Academorix\FeatureFlags\Observers;

use Academorix\FeatureFlags\Contracts\Data\FeatureOverrideInterface;
use Academorix\FeatureFlags\Events\FeatureFlagOverrideCleared;
use Academorix\FeatureFlags\Events\FeatureFlagOverrideCreated;
use Academorix\FeatureFlags\Models\FeatureOverride;
use Illuminate\Cache\Repository as CacheRepository;
use Illuminate\Contracts\Events\Dispatcher as EventDispatcher;

/**
 * Cache-invalidation + event-dispatch observer for {@see FeatureOverride}.
 *
 * On every write flushes the tenant-scoped `feature_flags:{tid}`
 * cache tag when the store supports tags, or bumps
 * `feature_flags:version:{tid}` otherwise. Dispatches the matching
 * event on the shared bus so audit + analytics consumers stay in
 * sync with the row lifecycle.
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
final class FeatureOverrideObserver
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
     * @param  FeatureOverride  $override  Persisted override row.
     * @return void
     */
    public function saved(FeatureOverride $override): void
    {
        $tenantId = (string) $override->getAttribute(FeatureOverrideInterface::ATTR_TENANT_ID);
        $this->invalidate($tenantId);

        if ($override->wasRecentlyCreated) {
            $this->events->dispatch(new FeatureFlagOverrideCreated(
                flag: (string) $override->getAttribute(FeatureOverrideInterface::ATTR_FLAG),
                tenantId: $tenantId,
                overrideId: (string) $override->getKey(),
                decision: (string) $override->getAttribute(FeatureOverrideInterface::ATTR_DECISION),
                scopeLevel: (string) $override->getAttribute(FeatureOverrideInterface::ATTR_SCOPE_LEVEL),
                scopeValue: (string) $override->getAttribute(FeatureOverrideInterface::ATTR_SCOPE_VALUE),
                actorId: $this->stringOrNull($override->getAttribute(FeatureOverrideInterface::ATTR_UPDATED_BY)),
            ));
        }
    }

    /**
     * Handle the `deleted` event — fires on soft + hard delete.
     *
     * @param  FeatureOverride  $override  Row being retired.
     * @return void
     */
    public function deleted(FeatureOverride $override): void
    {
        $tenantId = (string) $override->getAttribute(FeatureOverrideInterface::ATTR_TENANT_ID);
        $this->invalidate($tenantId);

        $this->events->dispatch(new FeatureFlagOverrideCleared(
            flag: (string) $override->getAttribute(FeatureOverrideInterface::ATTR_FLAG),
            tenantId: $tenantId,
            overrideId: (string) $override->getKey(),
            actorId: $this->stringOrNull($override->getAttribute(FeatureOverrideInterface::ATTR_DELETED_BY)),
        ));
    }

    /**
     * Flush the tenant-scoped cache tag, or bump the version key when tags are unsupported.
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
