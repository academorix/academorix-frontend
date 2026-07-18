<?php

declare(strict_types=1);

namespace Academorix\Entitlements\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when `SyncEntitlementsFromPlanJob` cannot complete a sync.
 *
 * The job retries via `#[Tries(3)]` — this exception fires only after
 * every retry is exhausted. Consumers subscribe to the wrapping
 * `EntitlementSyncCompleted` event to detect success.
 *
 * @category Entitlements
 *
 * @since    0.1.0
 */
final class EntitlementSyncFailedException extends AcademorixException
{
    /**
     * Stable machine-readable error code emitted on the JSON envelope.
     */
    public const CODE = 'entitlements.sync_failed';

    /**
     * Translation key for the humanised message.
     */
    public const TRANSLATION_KEY = 'entitlements::errors.sync_failed';

    /**
     * Convenience factory used by the syncer's raise path.
     *
     * @param  string  $tenantId  Owning tenant.
     * @param  string  $planId    Subscription plan identifier.
     * @param  string  $reason    Root-cause description.
     */
    public static function forPlan(string $tenantId, string $planId, string $reason): self
    {
        return (new self(\sprintf(
            'Failed to sync entitlements for tenant "%s" from plan "%s": %s',
            $tenantId,
            $planId,
            $reason,
        )));
    }
}
