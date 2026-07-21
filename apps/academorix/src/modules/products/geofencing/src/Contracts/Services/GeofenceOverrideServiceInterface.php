<?php

declare(strict_types=1);

namespace Academorix\Geofencing\Contracts\Services;

use Academorix\Geofencing\Services\GeofenceOverrideService;
use Illuminate\Container\Attributes\Bind;

/**
 * Override request-approve-apply workflow.
 *
 * Consumers call {@see requestOverride()} when a caller asks for an admin
 * override on a rejected check. The Approvals module reviews + resolves;
 * on approval, {@see applyOverride()} mints a new INSIDE row with
 * `supersedes_check_id` pointing at the original.
 *
 * @category Geofencing
 *
 * @since    0.1.0
 */
#[Bind(GeofenceOverrideService::class)]
interface GeofenceOverrideServiceInterface
{
    /**
     * Request an admin review on a rejected check. Returns the approval
     * task id so the caller's UI can link to it.
     *
     * @throws \InvalidArgumentException  On reason length < min.
     * @throws \Academorix\Geofencing\Exceptions\OverrideAlreadyAppliedException
     */
    public function requestOverride(
        string $originalCheckId,
        string $requesterUserId,
        string $reason,
    ): string;

    /**
     * Mint the override row after approval. Returns the new check id.
     */
    public function applyOverride(
        string $originalCheckId,
        string $overriddenByUserId,
        string $reason,
        string $approvalTaskId,
    ): string;
}
