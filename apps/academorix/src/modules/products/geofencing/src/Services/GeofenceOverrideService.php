<?php

declare(strict_types=1);

namespace Academorix\Geofencing\Services;

use Academorix\Geofencing\Contracts\Data\GeofenceCheckInterface;
use Academorix\Geofencing\Contracts\Repositories\GeofenceCheckRepositoryInterface;
use Academorix\Geofencing\Contracts\Services\GeofenceOverrideServiceInterface;
use Academorix\Geofencing\Enums\GeofenceMode;
use Academorix\Geofencing\Enums\GeofenceResult;
use Academorix\Geofencing\Events\GeofenceOverrideApplied;
use Academorix\Geofencing\Events\GeofenceOverrideRequested;
use Academorix\Geofencing\Exceptions\OverrideAlreadyAppliedException;
use Illuminate\Container\Attributes\Config;
use Illuminate\Container\Attributes\Singleton;
use Illuminate\Support\Str;
use InvalidArgumentException;

/**
 * Default {@see GeofenceOverrideServiceInterface} implementation.
 *
 * ## Flow
 *
 *  1. {@see requestOverride()} — validates the original check + reason, then
 *     creates an approval task (via the events bus — the Approvals module
 *     picks up `GeofenceOverrideRequested`).
 *  2. On approval, {@see applyOverride()} mints a new INSIDE row with
 *     `supersedes_check_id` pointing at the original + copies fenceable +
 *     subject metadata verbatim so the override lives in the same audit
 *     thread. Fires `GeofenceOverrideApplied`.
 *
 * `#[Singleton]` — stateless helper.
 *
 * @category Geofencing
 *
 * @since    0.1.0
 */
#[Singleton]
final class GeofenceOverrideService implements GeofenceOverrideServiceInterface
{
    public function __construct(
        private readonly GeofenceCheckRepositoryInterface $repository,
        #[Config('geofencing.override.min_reason_length')] private readonly int $minReasonLength,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function requestOverride(
        string $originalCheckId,
        string $requesterUserId,
        string $reason,
    ): string {
        if (\mb_strlen($reason) < $this->minReasonLength) {
            throw new InvalidArgumentException(\sprintf(
                'Override reason must be at least %d characters.',
                $this->minReasonLength,
            ));
        }

        $original = $this->repository->find($originalCheckId);
        if ($original === null) {
            throw new InvalidArgumentException(\sprintf(
                'Original check %s not found.',
                $originalCheckId,
            ));
        }

        // Refuse when there's already an override row that supersedes this
        // one. Prevents duplicate requests on the same rejected check.
        $existingOverride = $this->repository->query()
            ->where(GeofenceCheckInterface::ATTR_SUPERSEDES_CHECK_ID, $originalCheckId)
            ->exists();
        if ($existingOverride) {
            throw new OverrideAlreadyAppliedException(
                \sprintf('Check %s already has an applied override.', $originalCheckId),
            );
        }

        // Refuse override on an INSIDE row — nothing to override.
        $resultValue = $original->{GeofenceCheckInterface::ATTR_RESULT};
        $result = $resultValue instanceof GeofenceResult
            ? $resultValue
            : GeofenceResult::tryFrom((string) $resultValue);
        if ($result === GeofenceResult::Inside) {
            throw new InvalidArgumentException(
                'Cannot request an override on an INSIDE check — nothing to override.',
            );
        }

        // Generate a placeholder approval task id — the Approvals module
        // rewrites this to its real id when it picks up the event. Keeping
        // the id here means this service doesn't need to reach into the
        // Approvals module's repository.
        $approvalTaskId = 'atsk_' . Str::ulid()->toBase32();

        event(new GeofenceOverrideRequested(
            originalCheckId: $originalCheckId,
            requesterUserId: $requesterUserId,
            reason: $reason,
            approvalTaskId: $approvalTaskId,
        ));

        return $approvalTaskId;
    }

    /**
     * {@inheritDoc}
     */
    public function applyOverride(
        string $originalCheckId,
        string $overriddenByUserId,
        string $reason,
        string $approvalTaskId,
    ): string {
        $original = $this->repository->find($originalCheckId);
        if ($original === null) {
            throw new InvalidArgumentException(\sprintf(
                'Original check %s not found.',
                $originalCheckId,
            ));
        }

        // Mint the override row — copy fenceable + subject metadata verbatim
        // so the audit chain stays intact.
        $override = $this->repository->create([
            GeofenceCheckInterface::ATTR_TENANT_ID             => (string) $original->{GeofenceCheckInterface::ATTR_TENANT_ID},
            GeofenceCheckInterface::ATTR_FENCEABLE_TYPE        => (string) $original->{GeofenceCheckInterface::ATTR_FENCEABLE_TYPE},
            GeofenceCheckInterface::ATTR_FENCEABLE_ID          => (string) $original->{GeofenceCheckInterface::ATTR_FENCEABLE_ID},
            GeofenceCheckInterface::ATTR_SUBJECT_TYPE          => (string) $original->{GeofenceCheckInterface::ATTR_SUBJECT_TYPE},
            GeofenceCheckInterface::ATTR_SUBJECT_ID            => (string) $original->{GeofenceCheckInterface::ATTR_SUBJECT_ID},
            GeofenceCheckInterface::ATTR_RESULT                => GeofenceResult::Inside->value,
            GeofenceCheckInterface::ATTR_MODE                  => (string) $original->{GeofenceCheckInterface::ATTR_MODE} ?: GeofenceMode::Polygon->value,
            GeofenceCheckInterface::ATTR_EVALUATED_AT          => now(),
            GeofenceCheckInterface::ATTR_SUPERSEDES_CHECK_ID   => $originalCheckId,
            GeofenceCheckInterface::ATTR_OVERRIDE_TASK_ID      => $approvalTaskId,
            GeofenceCheckInterface::ATTR_OVERRIDDEN_BY_USER_ID => $overriddenByUserId,
            GeofenceCheckInterface::ATTR_OVERRIDE_REASON       => $reason,
        ]);

        event(new GeofenceOverrideApplied(
            newCheckId: (string) $override->getKey(),
            supersedesCheckId: $originalCheckId,
            fenceableType: (string) $original->{GeofenceCheckInterface::ATTR_FENCEABLE_TYPE},
            fenceableId: (string) $original->{GeofenceCheckInterface::ATTR_FENCEABLE_ID},
            overriddenByUserId: $overriddenByUserId,
            overrideReason: $reason,
        ));

        return (string) $override->getKey();
    }
}
