<?php

declare(strict_types=1);

namespace Stackra\Integrations\Observers;

use Stackra\Integrations\Contracts\Data\TenantIntegrationInterface;
use Stackra\Integrations\Enums\IntegrationKind;
use Stackra\Integrations\Events\IntegrationConfigured;
use Stackra\Integrations\Events\IntegrationDisabled;
use Stackra\Integrations\Events\IntegrationRemoved;
use Stackra\Integrations\Jobs\PurgeDisabledIntegrationJob;
use Stackra\Integrations\Jobs\SyncIntegrationJob;
use Stackra\Integrations\Models\TenantIntegration;

/**
 * Lifecycle side effects on {@see TenantIntegration}.
 *
 * ## Responsibilities
 *
 *   - `saving`  — when `is_active` transitions to true, set
 *     `next_sync_at = now() + interval`. When it transitions to false,
 *     clear both `next_sync_at` and `sync_cursor`.
 *   - `created` — dispatch the initial {@see SyncIntegrationJob} when
 *     the row lands active.
 *   - `updated` — emit {@see IntegrationConfigured} on the true
 *     transition; emit {@see IntegrationDisabled} on the false
 *     transition.
 *   - `deleted` — dispatch {@see PurgeDisabledIntegrationJob} +
 *     emit {@see IntegrationRemoved}.
 *
 * @category Integrations
 *
 * @since    0.1.0
 */
final class TenantIntegrationObserver
{
    /**
     * `saving` — recompute `next_sync_at` / `sync_cursor` around the
     * `is_active` transition.
     */
    public function saving(TenantIntegration $integration): void
    {
        $isActive = (bool) $integration->{TenantIntegrationInterface::ATTR_IS_ACTIVE};

        // Only recompute when `is_active` is actually changing (or on
        // a fresh row that lands active).
        $becomingActive = ($integration->exists === false && $isActive === true)
            || ($integration->isDirty(TenantIntegrationInterface::ATTR_IS_ACTIVE) && $isActive === true);

        $becomingInactive = $integration->isDirty(TenantIntegrationInterface::ATTR_IS_ACTIVE)
            && $isActive === false;

        if ($becomingActive) {
            $minutes = (int) \config('integrations.sync.default_sync_interval_minutes', 60);
            $integration->{TenantIntegrationInterface::ATTR_NEXT_SYNC_AT} = \now()->addMinutes($minutes);
        }

        if ($becomingInactive) {
            $integration->{TenantIntegrationInterface::ATTR_NEXT_SYNC_AT} = null;
            $integration->{TenantIntegrationInterface::ATTR_SYNC_CURSOR}  = null;
        }
    }

    /**
     * `created` — kick off the first sync when the row lands active.
     */
    public function created(TenantIntegration $integration): void
    {
        if ((bool) $integration->{TenantIntegrationInterface::ATTR_IS_ACTIVE} !== true) {
            return;
        }

        IntegrationConfigured::dispatch($integration);
        SyncIntegrationJob::dispatch((string) $integration->getKey());
    }

    /**
     * `updated` — emit lifecycle events on `is_active` transitions.
     *
     * Uses `getOriginal()` because the observer runs after the mass
     * assignment has settled but before the model instance's dirty
     * state is cleared.
     */
    public function updated(TenantIntegration $integration): void
    {
        $changes = $integration->getChanges();

        if (! \array_key_exists(TenantIntegrationInterface::ATTR_IS_ACTIVE, $changes)) {
            return;
        }

        $now  = (bool) $integration->{TenantIntegrationInterface::ATTR_IS_ACTIVE};
        $prev = (bool) $integration->getOriginal(TenantIntegrationInterface::ATTR_IS_ACTIVE);

        if ($now === true && $prev === false) {
            IntegrationConfigured::dispatch($integration);

            return;
        }

        if ($now === false && $prev === true) {
            IntegrationDisabled::dispatch($integration);
        }
    }

    /**
     * `deleted` — enqueue the hard-delete purge + emit the removed
     * event with the tombstone scalars.
     */
    public function deleted(TenantIntegration $integration): void
    {
        $kind = $integration->{TenantIntegrationInterface::ATTR_KIND};
        $kindString = $kind instanceof IntegrationKind
            ? $kind->value
            : (string) ($kind ?? '');

        IntegrationRemoved::dispatch(
            (string) $integration->{TenantIntegrationInterface::ATTR_TENANT_ID},
            (string) $integration->getKey(),
            $kindString,
        );

        PurgeDisabledIntegrationJob::dispatch((string) $integration->getKey());
    }
}
