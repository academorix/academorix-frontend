<?php

declare(strict_types=1);

namespace Stackra\Application\Events;

use Stackra\Application\Models\BusinessType;
use Stackra\Events\Attributes\AsEvent;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a tenant custom {@see BusinessType} is soft-deleted.
 *
 * System rows never soft-delete (policy + observer refuse). Consumers
 * should verify no Tenant currently references the archived slug —
 * `BusinessTypeInUseException` (422) fires client-side pre-archive.
 *
 * `#[AsEvent(name: 'application.business_type.archived')]` marks this
 * class for the events package's boot-time discovery.
 *
 * @category Application
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'application.business_type.archived')]
final readonly class BusinessTypeArchived implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  BusinessType  $businessType  The tenant-custom row that was archived.
     */
    public function __construct(public BusinessType $businessType)
    {
    }
}
