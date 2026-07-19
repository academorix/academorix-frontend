<?php

declare(strict_types=1);

namespace Academorix\Tenancy\Events;

use Academorix\Events\Attributes\AsEvent;
use Academorix\Tenancy\Models\TenantContact;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a {@see TenantContact} is created.
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'tenancy.contact.added')]
final readonly class TenantContactAdded implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  TenantContact  $contact  The newly-created contact.
     */
    public function __construct(public TenantContact $contact)
    {
    }
}
