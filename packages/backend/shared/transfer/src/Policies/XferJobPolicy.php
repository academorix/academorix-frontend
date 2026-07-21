<?php

declare(strict_types=1);

namespace Stackra\Transfer\Policies;

use Stackra\Transfer\Contracts\Data\XferJobInterface;
use Stackra\Transfer\Enums\TransferPermission;
use Stackra\Transfer\Enums\XferJobStatus;
use Stackra\Transfer\Models\XferJob;
use Illuminate\Contracts\Auth\Authenticatable;

/**
 * Authorization policy for {@see XferJob}.
 *
 * Regular users see + control their own jobs; platform admins see
 * + control any job cross-tenant via the platform.transfer.*
 * permissions.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
final class XferJobPolicy
{
    /**
     * `viewAny` — list jobs.
     */
    public function viewAny(Authenticatable $user): bool
    {
        return $user->can(TransferPermission::ViewAny->value)
            || $user->can(TransferPermission::PlatformViewAny->value);
    }

    /**
     * `view` — show one job. Platform-admin bypasses ownership check.
     */
    public function view(Authenticatable $user, XferJob $job): bool
    {
        if ($user->can(TransferPermission::PlatformView->value)) {
            return true;
        }

        if (! $user->can(TransferPermission::View->value)) {
            return false;
        }

        return $this->isInitiator($user, $job);
    }

    /**
     * `cancel` — cancel a queued / running job.
     */
    public function cancel(Authenticatable $user, XferJob $job): bool
    {
        if (! $user->can(TransferPermission::Cancel->value)) {
            return false;
        }

        if (! $this->isInitiator($user, $job)) {
            return false;
        }

        $status = $job->{XferJobInterface::ATTR_STATUS};

        return $status === XferJobStatus::Queued || $status === XferJobStatus::Running;
    }

    /**
     * `retryShard` — retry a failed shard.
     */
    public function retryShard(Authenticatable $user, XferJob $job): bool
    {
        if (! $user->can(TransferPermission::RetryShard->value)) {
            return false;
        }

        if (! $this->isInitiator($user, $job)) {
            return false;
        }

        $status = $job->{XferJobInterface::ATTR_STATUS};

        return $status === XferJobStatus::Failed || $status === XferJobStatus::PartiallySucceeded;
    }

    /**
     * `download` — download the result artifact.
     */
    public function download(Authenticatable $user, XferJob $job): bool
    {
        if (! $user->can(TransferPermission::Download->value)) {
            return false;
        }

        return $this->isInitiator($user, $job);
    }

    /**
     * `downloadErrors` — download the errors artifact.
     */
    public function downloadErrors(Authenticatable $user, XferJob $job): bool
    {
        return $this->download($user, $job)
            && $job->{XferJobInterface::ATTR_ERROR_ARTIFACT_ID} !== null;
    }

    /**
     * Whether the authenticated user initiated this job.
     */
    private function isInitiator(Authenticatable $user, XferJob $job): bool
    {
        $initiatorId = $job->{XferJobInterface::ATTR_INITIATOR_USER_ID};
        if ($initiatorId === null) {
            return false;
        }

        return (string) $user->getAuthIdentifier() === (string) $initiatorId;
    }
}
