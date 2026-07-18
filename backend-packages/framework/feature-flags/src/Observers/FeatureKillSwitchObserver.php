<?php

declare(strict_types=1);

namespace Academorix\FeatureFlags\Observers;

use Academorix\FeatureFlags\Contracts\Data\FeatureKillSwitchInterface;
use Academorix\FeatureFlags\Events\FeatureFlagKillSwitchDisabled;
use Academorix\FeatureFlags\Events\FeatureFlagKillSwitchEnabled;
use Academorix\FeatureFlags\Models\FeatureKillSwitch;
use Illuminate\Cache\Repository as CacheRepository;
use Illuminate\Contracts\Events\Dispatcher as EventDispatcher;

/**
 * Cache-invalidation + event-dispatch observer for {@see FeatureKillSwitch}.
 *
 * Kill switches are platform-scoped — a global row flushes the
 * root `feature_flags` tag across every tenant; a scope-targeted
 * row flushes both the platform-wide tag and the affected tenant
 * tag (when `scope_level = 'tenant'`).
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
final class FeatureKillSwitchObserver
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
     * Emits {@see FeatureFlagKillSwitchEnabled} for newly-created
     * rows and updates that push a row into its active window.
     *
     * @param  FeatureKillSwitch  $row  Persisted kill-switch row.
     * @return void
     */
    public function saved(FeatureKillSwitch $row): void
    {
        $this->invalidate($row);

        $this->events->dispatch(new FeatureFlagKillSwitchEnabled(
            flag: (string) $row->getAttribute(FeatureKillSwitchInterface::ATTR_FLAG),
            scopeLevel: (string) $row->getAttribute(FeatureKillSwitchInterface::ATTR_SCOPE_LEVEL),
            scopeValue: $this->stringOrNull($row->getAttribute(FeatureKillSwitchInterface::ATTR_SCOPE_VALUE)),
            reason: $this->stringOrNull($row->getAttribute(FeatureKillSwitchInterface::ATTR_REASON)),
            actorId: $this->stringOrNull($row->getAttribute(FeatureKillSwitchInterface::ATTR_UPDATED_BY)),
        ));
    }

    /**
     * Handle the `deleted` event — fires on soft + hard delete.
     *
     * @param  FeatureKillSwitch  $row  Row being retired.
     * @return void
     */
    public function deleted(FeatureKillSwitch $row): void
    {
        $this->invalidate($row);

        $this->events->dispatch(new FeatureFlagKillSwitchDisabled(
            flag: (string) $row->getAttribute(FeatureKillSwitchInterface::ATTR_FLAG),
            scopeLevel: (string) $row->getAttribute(FeatureKillSwitchInterface::ATTR_SCOPE_LEVEL),
            scopeValue: $this->stringOrNull($row->getAttribute(FeatureKillSwitchInterface::ATTR_SCOPE_VALUE)),
            actorId: $this->stringOrNull($row->getAttribute(FeatureKillSwitchInterface::ATTR_DELETED_BY)),
        ));
    }

    /**
     * Flush the platform-wide + affected-tenant cache tags.
     *
     * @param  FeatureKillSwitch  $row  Row being invalidated.
     * @return void
     */
    private function invalidate(FeatureKillSwitch $row): void
    {
        $tags = ['feature_flags'];

        $scopeLevel = (string) $row->getAttribute(FeatureKillSwitchInterface::ATTR_SCOPE_LEVEL);
        $scopeValue = $row->getAttribute(FeatureKillSwitchInterface::ATTR_SCOPE_VALUE);

        if ($scopeLevel === 'tenant' && $scopeValue !== null) {
            $tags[] = "feature_flags:{$scopeValue}";
        }

        $store = $this->cache->getStore();
        if (\method_exists($store, 'tags')) {
            $this->cache->tags($tags)->flush();

            return;
        }

        // No tag support — bump the platform-wide version key.
        $this->cache->forever('feature_flags:version:global', (int) (microtime(true) * 1000));
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
