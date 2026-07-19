<?php

declare(strict_types=1);

namespace Academorix\Tenancy\Events;

use Academorix\Events\Attributes\AsEvent;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a {@see \Academorix\Tenancy\Models\TenantContact} is soft-deleted.
 *
 * Carries plain scalars (contact id + kind + owning tenant) rather
 * than the model because the row is now in the tombstone state.
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'tenancy.contact.removed')]
final readonly class TenantContactRemoved implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  string  $tenantId   The tenant the removed contact belonged to.
     * @param  string  $contactId  The removed contact's id.
     * @param  string  $kind       The removed contact's kind (backing value).
     */
    public function __construct(
        public string $tenantId,
        public string $contactId,
        public string $kind,
    ) {
    }
}
