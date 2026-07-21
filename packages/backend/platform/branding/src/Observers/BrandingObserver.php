<?php

declare(strict_types=1);

namespace Stackra\Branding\Observers;

use Stackra\Branding\Contracts\Data\BrandingInterface;
use Stackra\Branding\Events\BrandingArchived;
use Stackra\Branding\Events\BrandingCreated;
use Stackra\Branding\Events\BrandingUpdated;
use Stackra\Branding\Jobs\SyncBrandingJob;
use Stackra\Branding\Models\Branding;

/**
 * Lifecycle side effects on {@see Branding}.
 *
 * ## Responsibilities
 *
 *   - `creating` — auto-mark first row per tenant as default.
 *   - `updating` — enforce single-default-per-tenant.
 *   - `saved`    — dispatch {@see SyncBrandingJob} to denormalise the
 *     default branding into `tenants.branding`.
 *
 * @category Branding
 *
 * @since    0.1.0
 */
final class BrandingObserver
{
    /**
     * `creating` — first row per tenant is auto-marked default.
     */
    public function creating(Branding $branding): void
    {
        if ($branding->{BrandingInterface::ATTR_IS_DEFAULT} === null) {
            $exists = Branding::query()
                ->where(BrandingInterface::ATTR_TENANT_ID, $branding->{BrandingInterface::ATTR_TENANT_ID})
                ->exists();

            $branding->{BrandingInterface::ATTR_IS_DEFAULT} = ! $exists;
        }
    }

    /**
     * `updating` — when transitioning to default, demote every sibling.
     */
    public function updating(Branding $branding): void
    {
        $becomingDefault = $branding->isDirty(BrandingInterface::ATTR_IS_DEFAULT)
            && (bool) $branding->{BrandingInterface::ATTR_IS_DEFAULT};

        if (! $becomingDefault) {
            return;
        }

        Branding::query()
            ->where(BrandingInterface::ATTR_TENANT_ID, $branding->{BrandingInterface::ATTR_TENANT_ID})
            ->where(BrandingInterface::ATTR_ID, '!=', $branding->getKey())
            ->update([BrandingInterface::ATTR_IS_DEFAULT => false]);
    }

    /**
     * `created` — dispatch the initial denormalisation + emit event.
     */
    public function created(Branding $branding): void
    {
        BrandingCreated::dispatch($branding);

        if ($branding->isDefault()) {
            SyncBrandingJob::dispatch((string) $branding->{BrandingInterface::ATTR_TENANT_ID});
        }
    }

    /**
     * `updated` — dispatch denormalisation when the default row
     * changed OR when this row IS the default.
     */
    public function updated(Branding $branding): void
    {
        $dirty = \array_keys($branding->getChanges());
        if ($dirty === []) {
            return;
        }

        BrandingUpdated::dispatch($branding, $dirty);

        if ($branding->isDefault()) {
            SyncBrandingJob::dispatch((string) $branding->{BrandingInterface::ATTR_TENANT_ID});
        }
    }

    /**
     * `deleted` — emit `BrandingArchived`.
     */
    public function deleted(Branding $branding): void
    {
        BrandingArchived::dispatch(
            (string) $branding->{BrandingInterface::ATTR_TENANT_ID},
            (string) $branding->getKey(),
        );
    }
}
