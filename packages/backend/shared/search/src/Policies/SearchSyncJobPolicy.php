<?php

declare(strict_types=1);

namespace Stackra\Search\Policies;

use Stackra\Search\Contracts\Data\SearchSyncJobInterface;
use Stackra\Search\Enums\SearchPermission;
use Stackra\Search\Enums\SearchSyncJobStatus;
use Stackra\Search\Models\SearchSyncJob;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Foundation\Auth\User;

/**
 * Authorization policy for {@see SearchSyncJob}.
 *
 * @category Search
 *
 * @since    0.1.0
 */
final class SearchSyncJobPolicy
{
    public function viewAny(Authenticatable $user): bool
    {
        return $this->has($user, SearchPermission::SyncJobsViewAny);
    }

    public function view(Authenticatable $user, SearchSyncJob $job): bool
    {
        return $this->has($user, SearchPermission::SyncJobsView)
            && $this->isOwn($user, $job);
    }

    /**
     * `cancel` — a caller can cancel own row when it is queued or running.
     */
    public function cancel(Authenticatable $user, SearchSyncJob $job): bool
    {
        if (! $this->has($user, SearchPermission::SyncJobsCancel)) {
            return false;
        }

        if (! $this->isOwn($user, $job)) {
            return false;
        }

        $status = $job->{SearchSyncJobInterface::ATTR_STATUS};

        return $status === SearchSyncJobStatus::Queued
            || $status === SearchSyncJobStatus::Running;
    }

    public function platformViewAny(Authenticatable $user): bool
    {
        return $this->has($user, SearchPermission::PlatformSyncJobsViewAny);
    }

    public function platformView(Authenticatable $user, SearchSyncJob $job): bool
    {
        unset($job);

        return $this->has($user, SearchPermission::PlatformSyncJobsView);
    }

    /**
     * `platformCancel` — platform admin may cancel any state.
     */
    public function platformCancel(Authenticatable $user, SearchSyncJob $job): bool
    {
        unset($job);

        return $this->has($user, SearchPermission::PlatformSyncJobsCancel);
    }

    private function has(Authenticatable $user, SearchPermission $permission): bool
    {
        return $user instanceof User && $user->can($permission->value);
    }

    private function isOwn(Authenticatable $user, SearchSyncJob $job): bool
    {
        return (string) $job->{SearchSyncJobInterface::ATTR_CAUSER_ID}
            === (string) $user->getAuthIdentifier();
    }
}
