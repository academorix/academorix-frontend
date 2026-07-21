<?php

declare(strict_types=1);

namespace Stackra\Tenancy\Observers;

use Stackra\Tenancy\Contracts\Data\TenantInterface;
use Stackra\Tenancy\Enums\TenantStatus;
use Stackra\Tenancy\Events\TenantArchived;
use Stackra\Tenancy\Events\TenantResumed;
use Stackra\Tenancy\Events\TenantSettingsUpdated;
use Stackra\Tenancy\Events\TenantSuspended;
use Stackra\Tenancy\Exceptions\SystemTenantException;
use Stackra\Tenancy\Models\Tenant;
use Carbon\CarbonImmutable;

/**
 * Lifecycle side effects on {@see Tenant}.
 *
 * Wired via `#[ObservedBy(TenantObserver::class)]` on the model.
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
final class TenantObserver
{
    /**
     * `creating` — default status + trial window.
     */
    public function creating(Tenant $tenant): void
    {
        // Default status → Trialing when the caller left it blank.
        if ($tenant->{TenantInterface::ATTR_STATUS} === null) {
            $tenant->{TenantInterface::ATTR_STATUS} = TenantStatus::Trialing;
        }

        // Default trial window (14d) — read from config.
        if (
            $tenant->{TenantInterface::ATTR_TRIAL_ENDS_AT} === null
            && $tenant->{TenantInterface::ATTR_STATUS} === TenantStatus::Trialing
        ) {
            $days = (int) \config('tenancy.provisioning.default_trial_days', 14);
            $tenant->{TenantInterface::ATTR_TRIAL_ENDS_AT} = CarbonImmutable::now()->addDays($days);
        }
    }

    /**
     * `updating` — refuse mutations on `is_system = true` rows outside
     * the sanctioned mutation scope.
     */
    public function updating(Tenant $tenant): void
    {
        if ($tenant->getOriginal(TenantInterface::ATTR_IS_SYSTEM) === true
            && ! $this->isSystemMutationAllowed()
        ) {
            throw new SystemTenantException(\sprintf(
                'Cannot update the system tenant "%s".',
                $tenant->getKey(),
            ));
        }
    }

    /**
     * `deleting` — refuse deletion on `is_system = true` rows.
     */
    public function deleting(Tenant $tenant): void
    {
        if ($tenant->{TenantInterface::ATTR_IS_SYSTEM} === true
            && ! $this->isSystemMutationAllowed()
        ) {
            throw new SystemTenantException(\sprintf(
                'Cannot delete the system tenant "%s".',
                $tenant->getKey(),
            ));
        }
    }

    /**
     * `updated` — emit lifecycle events on status transitions.
     */
    public function updated(Tenant $tenant): void
    {
        $original = $tenant->getOriginal(TenantInterface::ATTR_STATUS);
        $current  = $tenant->{TenantInterface::ATTR_STATUS};

        if ($original === $current) {
            // No status change — but tenant settings may have changed.
            $this->emitSettingsUpdated($tenant);

            return;
        }

        match ($current) {
            TenantStatus::Suspended => TenantSuspended::dispatch($tenant, (string) ($tenant->{TenantInterface::ATTR_SUSPENSION_REASON} ?? '')),
            TenantStatus::Active    => TenantResumed::dispatch($tenant),
            TenantStatus::Archived  => TenantArchived::dispatch($tenant),
            default                 => null,
        };

        // If status transitioned OUT of trialing/grace INTO active,
        // clear the trial + grace timestamps.
        if (
            $current === TenantStatus::Active
            && \in_array($original, [TenantStatus::Trialing->value, TenantStatus::Grace->value], true)
        ) {
            $tenant->{TenantInterface::ATTR_TRIAL_ENDS_AT} = null;
            $tenant->{TenantInterface::ATTR_GRACE_ENDS_AT} = null;
            $tenant->saveQuietly();
        }
    }

    /**
     * Fire `TenantSettingsUpdated` when any settings-facing column changed.
     */
    private function emitSettingsUpdated(Tenant $tenant): void
    {
        $watched = [
            TenantInterface::ATTR_NAME,
            TenantInterface::ATTR_LEGAL_NAME,
            TenantInterface::ATTR_LOCALE,
            TenantInterface::ATTR_TIMEZONE,
            TenantInterface::ATTR_CURRENCY,
            TenantInterface::ATTR_PRIMARY_BRANDING_ID,
            TenantInterface::ATTR_BRANDING,
            TenantInterface::ATTR_SETTINGS,
            TenantInterface::ATTR_FEATURES,
            TenantInterface::ATTR_TERMINOLOGY,
        ];

        $changed = \array_values(\array_intersect($watched, \array_keys($tenant->getChanges())));
        if ($changed === []) {
            return;
        }

        TenantSettingsUpdated::dispatch($tenant, $changed);
    }

    /**
     * Whether a sanctioned mutation scope is active (seeder /
     * `Tenant::allowSystemMutation()` / retention job).
     */
    private function isSystemMutationAllowed(): bool
    {
        // The HasSystemFlag trait exposes this at the model level;
        // here we defer to the concrete method if available.
        return \method_exists(Tenant::class, 'isSystemMutationAllowed')
            ? (bool) Tenant::isSystemMutationAllowed()
            : false;
    }
}
